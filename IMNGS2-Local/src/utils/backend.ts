import path from "path";
import * as fs from "fs";
import {API_BASIC_AUTH, IMAGE_ASSET_NAME, REGISTRY_AUTH} from "../config";
import axios from "axios";
import {byOS, platforms} from "./platform";
import {deleteImageTag, getBackend, getImageTag, storeBackend, setImageTag, setCurrentImageTag} from "./storage";
import {
    getAllowedRange,
    getLatestVersion,
    getMatchingVersions,
    getVersionString,
    semVerFromGitHubTag
} from "./releasetag";
import {logForEnvironment, logToDevTools, updateProgress} from "./logHandler";
import {SemVer} from "semver";
import {cmArgs} from "./command-line-arguments";
import {runSubprocess} from "./process";
import {Environment} from "../enums";
import {docker} from "./makeDockerConnection";
import {helpPages} from "./helpPages";
import {app} from "electron";
import Dockerode from "dockerode";
import {getLocalAppDataPath} from "./helpers";
import * as child_process from "node:child_process";
const wsl = require("@endevr-io/wsl-api");
const { windowsToWsl } = require("@endevr-io/wsl-path");

const runningContainers: Set<string> = new Set();
const runningDistributions = new Set();
const runningWslMainProcesses: Set<child_process.ChildProcess> = new Set();

const GITHUB_API_BASE_URL = cmArgs['api-url'];
const CONTAINER_REGISTRY = cmArgs['container-registry'];


/**
 * Get repository information for the specified environment.
 * @param environment The environment for which to get the repository.
 */
function getRepository(environment: Environment): Repository {
    switch (environment) {
        case Environment.IMNGS2CORE:
            return {
                owner: cmArgs['imngs2core-repository-owner'],
                repo: cmArgs['imngs2core-repository-name'],
            }
    }
}

/**
 * Docker backend.
 */
export const DOCKER: IBackend = {
    type: "Docker",
    name: "Docker",
    command: "docker",
    argsPrefix: ["run", "--rm"],
}

/**
 * Windows Subsystem for Linux backend.
 */
export const WSL: IBackend = {
    type: "WSL",
    name: "Windows Subsystem for Linux",
    command: "wsl",
    argsPrefix: ["-l", "-v"],
}

export const BACKENDS = [
    DOCKER,
    WSL,
]

export function getDefaultBackend(): IBackend {
    return byOS({
        [platforms.LINUX]: () => {
            return DOCKER
        },
        [platforms.WINDOWS]: () => {
            return WSL
        },
        [platforms.MAC]: () => {
            return DOCKER
        },
        default: () => {
            return DOCKER
        },
    })();
}

export async function setBackendByType(type: string) {
    switch (type) {
        case DOCKER.type:
            await setBackend(DOCKER);
            break;
        case WSL.type:
            await setBackend(WSL);
            break;
        case "default":
            await resetToDefaultBackend();
            break;
        default:
            throw new Error(`Backend type ${type} not supported`);
    }
}

export async function setBackend(backend: IBackend) {
    // clean up if the backend is changed
    const currentBackend = await getBackend();
    if (currentBackend.type !== backend.type) {
        await terminateBackend(Environment.IMNGS2CORE);
        await cleanUpBackend();
    }
    // store the backend
    return await storeBackend(backend);
}

export async function checkBackendConnection() {
    return new Promise<void>(async (resolve, reject) => {
        const backend = await getBackend();
        switch (backend.type) {
            case DOCKER.type:
                // check if we can connect to the docker daemon
                // just checking if docker --version works showed to be unreliable
                // as this does not check e.g. if the daemon is running or the user is in the docker group
                docker.info().then(() => {
                    resolve();
                }).catch((error: any) => {
                    reject(error);
                });
                break;
            case WSL.type:
                // for WSL for now let's just check if the wsl command is available and returns version 2
                const subprocess = child_process.spawn(
                    backend.command,
                    ["--version"],
                );

                subprocess.stdout.on('data', (data) => {
                    if (data instanceof Buffer) {
                        // remove null bytes as WSL likes to output them
                        // eslint-disable-next-line no-control-regex
                        const msg = data.toString('utf8').replace(/\x00/g, '');
                        console.log(msg);
                        resolve();
                    }
                });
                subprocess.on('close', (code, signal) => {
                    console.log(`Child closed with code ${code} and signal ${signal}`);
                    reject(code);
                });
                subprocess.on('error', (err) => {
                    console.error(`Error starting process: ${err}`);
                    reject(err);
                });
                break;
            default:
                throw new Error(`Backend ${backend.type} not supported`);
        }
    });
}

export async function resetToDefaultBackend() {
    await setBackend(getDefaultBackend());
}

/**
 * Ensure that the distribution tarball exists.
 * @param path
 * @throws Error if the tarball does not exist.
 */
function checkTarExists(path: string) {
    if (!fs.existsSync(path)) {
        throw new Error(`Distribution tarball does not exist at ${path}`);
    }
}

export async function getCompatibleReleaseTagStrings(environment: Environment) {
    return new Promise<string[]>((resolve, reject) => {
        getCompatibleImageReleaseTags(environment).then((tags) => {
            // sort tags
            tags.sort((a, b) => {
                return a.compare(b);
            });
            resolve(tags.map((tag) => getVersionString(tag)));
        }).catch((error) => {
            reject(error);
        });
    });
}

async function queryAvailableReleaseTags(environment: Environment) {
    return new Promise<SemVer[]>((resolve, reject) => {
        const repo = getRepository(environment);
        // query GitHub for available releases
        axios.get<GitHubRelease[]>(
            `${GITHUB_API_BASE_URL}/repos/${repo.owner}/${repo.repo}/releases`,
            {
                headers: {'X-GitHub-Api-Version': '2022-11-28'},
                auth: API_BASIC_AUTH,
            }
        ).then((response) => {
            const data = response.data;
            const availableTags = data.map((release) => {
                try {
                    return semVerFromGitHubTag(release.tag_name);
                } catch (error) {  // return null for tags that could not be parsed and filter them out thereafter
                    return null;
                }
            }).filter((tag) => tag !== null) as SemVer[];
            console.debug(`Repo offers ${availableTags.length} releases: ${availableTags.map((version: SemVer) => getVersionString(version)).join(', ')}`);
            resolve(availableTags);
        }).catch((error) => {
            updateProgress(
                {
                    step: `Initializing ${environment} environment`,
                    message: `Failed to query available releases.`,
                    state: "error",
                    error: {
                        code: "RAPIOF",
                        helpUrl: helpPages.RAPIOF,
                    },
                }
            );
            reject(error);
        });
    });
}

async function getCompatibleImageReleaseTags(environment: Environment) {
    return new Promise<SemVer[]>((resolve, reject) => {
        queryAvailableReleaseTags(environment).then((availableTags) => {
            const range = getAllowedRange(environment);
            const compatibleVersions = getMatchingVersions(availableTags, range);
            console.debug(`Found ${compatibleVersions.length} compatible versions: ${compatibleVersions.map((version: SemVer) => getVersionString(version)).join(', ')}`);
            resolve(compatibleVersions);
        }).catch((error) => {
            reject(error);
        });
    });
}

async function getLatestCompatibleImageReleaseTag(environment: Environment) {
    return new Promise<SemVer>((resolve, reject) => {
        getCompatibleImageReleaseTags(environment).then((compatibleTags) => {
            const latestTag = getLatestVersion(compatibleTags);
            resolve(latestTag);
        }).catch((error) => {
            reject(error);
        });
    });
}

async function getImageReleaseAssetUrl(environment: Environment, releaseTag: SemVer) {
    return new Promise<string>((resolve, reject) => {
        const repo = getRepository(environment);
        // load specified release and find the tarball
        const RELEASE_URL = `${GITHUB_API_BASE_URL}/repos/${repo.owner}/${repo.repo}/releases/tags/v${getVersionString(releaseTag)}`;
        logToDevTools(`Querying GitHub for release v${getVersionString(releaseTag)} at ${RELEASE_URL}`);
        axios.get<GitHubRelease>(
            RELEASE_URL,
            {
                headers: {'X-GitHub-Api-Version': '2022-11-28'},
                auth: API_BASIC_AUTH,
            }
        ).then((response) => {
            const data = response.data;
            const assets = data.assets;

            // find the tarball
            logToDevTools(`Release has ${assets.length} assets attached. Searching for ${IMAGE_ASSET_NAME}`);
            const tarball = assets.find((asset) => {
                return asset.name === IMAGE_ASSET_NAME;
            });

            if (tarball === undefined) {
                updateProgress(
                    {
                        step: `Initializing ${environment} environment`,
                        message: `Release v${getVersionString(releaseTag)} is missing required asset.`,
                        state: "error",
                        error: {
                            code: "RASMIS",
                            helpUrl: helpPages.RASMIS,
                        },
                    }
                );
                reject(`Could not find tarball attached to release. Expected ${IMAGE_ASSET_NAME} at v${getVersionString(releaseTag)}`);
            }

            resolve(tarball.browser_download_url);
        }).catch((error) => {
            updateProgress(
                {
                    step: `Initializing ${environment} environment`,
                    message: `Failed to query release v${getVersionString(releaseTag)}.`,
                    state: "error",
                    error: {
                        code: "RAPIOF",
                        helpUrl: helpPages.RAPIOF,
                    },
                }
            );
            reject(error);
        });
    });
}

/**
 * Download the distribution tarball and places it to the expected path.
 */
async function downloadDistributionTar(environment: Environment, releaseTag: SemVer, path: string) {
    return new Promise<void>((resolve, reject) => {
        // get tarball URL
        getImageReleaseAssetUrl(environment, releaseTag).then(async (tarballUrl) => {
            // download tarball
            logToDevTools(`Downloading tarball from ${tarballUrl} to ${path}`);
            const expectedPath = await getExpectedDistributionTarPath(environment, releaseTag);
            const writer = fs.createWriteStream(expectedPath);
            axios.get(
                tarballUrl,
                {
                    responseType: 'stream',
                    auth: API_BASIC_AUTH,
                    onDownloadProgress: function(progressEvent) {
                        let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
                        updateProgress({
                            step: `Initializing ${environment} environment`,
                            message: `Downloading distribution files (${percentCompleted}%)`,
                            state: "running",
                        });
                    },
                }
            ).then((response) => {
                response.data.pipe(writer);

                writer.on('finish', resolve);
                writer.on('error', (error) => {
                    reject(error);
                });
            }).catch((error) => {
                reject(error);
            });
        }).catch((error) => {
            reject(error);
        });
    });
}

async function getExpectedDistributionTarPath(environment: Environment, releaseTag: SemVer) {
    const appDataDirectory = app.getPath('temp');
    return path.join(appDataDirectory, `${await getImageName(environment, releaseTag)}.tar.gz`);
}

async function getDistributionInstallLocation(environment: Environment, releaseTag: SemVer) {
    const appDataDirectory = getLocalAppDataPath();
    const installDir = path.join(appDataDirectory, 'wsl-distro', await getImageName(environment, releaseTag));

    // make sure the path exists
    if (!fs.existsSync(installDir)) {
        fs.mkdirSync(installDir, {recursive: true});
    }
    logToDevTools(`Distribution will be installed to ${installDir}`);

    return installDir;
}

/**
 * Get the path of the image tarball. If it does not exist, download it.
 *
 * @returns The path of the distribution tarball.
 */
export async function getImageTarball(environment: Environment, releaseTag: SemVer) {
    const expectedPath = await getExpectedDistributionTarPath(environment, releaseTag);

    updateProgress({
        step: `Initializing ${environment} environment`,
        message: `Getting distribution files`,
        state: "running",
    });

    if (!fs.existsSync(expectedPath)) {
        await downloadDistributionTar(environment, releaseTag, expectedPath);
    }

    checkTarExists(expectedPath);

    return expectedPath;
}

export async function getDistroWslVersion(distribution: string) {
    const distributions = await wsl.listVerbose();
    for (const distro of distributions) {
        if (distro.name === distribution) {
            return distro.version;
        }
    }
    throw new Error(`Distribution ${distribution} not found`);
}


export async function registerWslDistribution(environment: Environment, releaseTag: SemVer) {
    const tarBall = await getImageTarball(environment, releaseTag);
    const installLocation = await getDistributionInstallLocation(environment, releaseTag);

    // import distribution
    const distributionName = await getImageName(environment, releaseTag);
    logToDevTools(`Importing distribution ${distributionName} from ${tarBall} to ${installLocation}`);
    updateProgress({
        step: `Initializing ${environment} environment`,
        message: `Registering ${environment} WSL distribution v${getVersionString(releaseTag)}`,
        state: "running",
    });
    await wsl.importDistribution(distributionName, installLocation, tarBall);
}

/**
 * Get the name of the image excluding the version tag.
 */
async function getImageBaseName(environment: Environment) {
    const backend = await getBackend();
    const repo = getRepository(environment);
    switch (backend.type) {
        case DOCKER.type:
            return `${CONTAINER_REGISTRY}/${repo.owner}/${repo.repo}`;
        case WSL.type:
            return `${repo.owner}.${repo.repo}`;
        default:
            throw new Error(`Backend ${backend.type} not supported`);
    }
}

/**
 * Get the full name of the image including the version tag. This is dependent on the passed release tag.
 * @param environment The environment for which to get the image name.
 * @param releaseTag The version tag of the image.
 */
async function getImageName(environment: Environment, releaseTag: SemVer) {
    const backend = await getBackend();
    const baseName = await getImageBaseName(environment);
    switch (backend.type) {
        case DOCKER.type:
            return `${baseName}:${getVersionString(releaseTag)}`
        case WSL.type:
            return `${baseName}_${getVersionString(releaseTag)}`;
        default:
            throw new Error(`Backend ${backend.type} not supported`);
    }
}

export async function initializeWslBackend(environment: Environment, releaseTag: SemVer) {
    // check if the distribution is registered
    const distribution = await getImageName(environment, releaseTag);
    const installed = await wsl.isInstalled(distribution);
    if (installed) {
        logToDevTools(`WSL distribution ${distribution} is registered.`);
        updateProgress({
            step: `Initializing ${environment} environment`,
            message: `WSL distribution v${getVersionString(releaseTag)} is registered`,
            state: "running",
        });
    } else {
        logToDevTools(`WSL distribution ${distribution} is not registered.`);
        await registerWslDistribution(environment, releaseTag);
    }

    // ensure distribution is running on WSL2
    updateProgress({
        step: `Initializing ${environment} environment`,
        message: `Ensuring distribution is running on WSL2`,
        state: "running",
    });
    const version = await getDistroWslVersion(distribution);
    if (version !== 2) {
        logToDevTools(`Setting version of distribution ${distribution} to 2`);
        await wsl.setVersion(distribution, 2);
    } else {
        logToDevTools(`Distribution ${distribution} is running on WSL2.`);
    }

    // ensure the distribution is running
    updateProgress({
        step: `Initializing ${environment} environment`,
        message: `Starting distribution`,
        state: "running",
    });
    await wsl.runDistribution(distribution);
    await wsl.waitForRunning(distribution);

    updateProgress({
        step: `Initializing ${environment} environment`,
        message: `Finished initializing WSL backend`,
        state: "done",
    });
}

export async function initializeDockerBackend(environment: Environment, releaseTag: SemVer) {
    return new Promise<void>((resolve, reject) => {
        // initialize with defaults; using socket
        getImageName(environment, releaseTag).then(async (image) => {
            updateProgress({
                step: `Initializing ${environment} environment`,
                message: "Checking Docker image tag",
                state: "running",
            });
            // check if the image is registered
            const images = await docker.listImages();
            const imageExists = images.some((imageInfo: { RepoTags: string[] }) => {
                return imageInfo.RepoTags.includes(image);
            });

            if (imageExists) {
                logToDevTools(`Image ${image} exists.`);
                resolve();
            } else {
                logToDevTools(`Image ${image} does not exist locally.`);
                // pull the image
                updateProgress({
                    step: `Initializing ${environment} environment`,
                    message: `Pulling v${getVersionString(releaseTag)} image`,
                    state: "running",
                });
                // pull from private registry
                await docker.pull(image, {authconfig: REGISTRY_AUTH}).then((stream: NodeJS.ReadableStream) => {
                    docker.modem.followProgress(stream, onFinished, onProgress);
                    let currentStatus = "";
                    let lastUpdateTimeStamp = 0;

                    function onFinished() {
                        logToDevTools(`Image ${image} pulled.`);
                        resolve();
                    }

                    function onProgress(event: {
                        status: string,
                        progressDetail: { current: number, total: number },
                        progress: string,
                        id: string
                    }) {
                        if (event.status !== currentStatus) {
                            currentStatus = event.status;
                            logToDevTools(`Image pull: ${event.status}`);
                            updateProgress({
                                step: `Initializing ${environment} environment`,
                                message: `Pulling image (${event.status})`,
                                state: "running",
                            });
                        }
                        if (event.status == "Downloading" || event.status == "Extracting") {
                            const now = Date.now();
                            if (now - lastUpdateTimeStamp > 1000) {
                                if (event.progressDetail) {
                                    const pct = Math.round((event.progressDetail.current / event.progressDetail.total) * 100);
                                    lastUpdateTimeStamp = now;
                                    updateProgress({
                                        step: `Initializing ${environment} environment`,
                                        message: `${event.status} image v${getVersionString(releaseTag)} (${pct}%)`,
                                        state: "running",
                                    });
                                }
                            }
                        }
                    }
                }).catch((error: Error) => {
                    updateProgress({
                        step: `Initializing ${environment} environment`,
                        message: `Failed to pull image v${getVersionString(releaseTag)}`,
                        state: "error",
                        error: {
                            code: "DOCPIF",
                            helpUrl: helpPages.DOCPIF,
                        },
                    });
                    reject(error);
                });
            }
        });
    });
}

export async function terminateBackend(environment: Environment) {
    updateProgress({
        step: `Terminating ${environment} environment`,
        message: `Terminating...`,
        state: "running",
    });
    const backend = await getBackend();
    switch (backend.type) {
        case DOCKER.type:
            await terminateDockerBackend();
            break;
        case WSL.type:
            await terminateWslBackend();
            break;
        default:
            throw new Error(`Backend ${backend.type} not supported`);
    }
    updateProgress({
        step: "",
        message: "",
        state: "idle",
    });
    return;
}

async function terminateWslBackend() {
    return new Promise<void>(async (resolve, reject) => {
        console.log(`Number of running WSL main processes: ${runningWslMainProcesses.size}`)
        if (runningWslMainProcesses.size == 0) {
            console.log(`No WSL main processes running. Nothing to terminate.`);
            resolve();
        }
        return await Promise.all(Array.from(runningWslMainProcesses).map(async (childProcess) => {
            console.log(`Terminating process ${childProcess.pid}`);
            const success = childProcess.kill();
            if (success) {
                resolve();
            } else {
                reject();
            }
        }));
    });
}

async function terminateDockerBackend() {
    return new Promise<void>(async (resolve, reject) => {
        console.log(`Number of running containers: ${runningContainers.size}`)
        if (runningContainers.size == 0) {
            console.log(`No containers running. Nothing to terminate.`);
            resolve();
        }
        return await Promise.all(Array.from(runningContainers).map(async (containerId) => {
            console.log(`Stopping container ${containerId}`);
            const container = docker.getContainer(containerId);
            // try to stop the container for 10 seconds, then kill it
            return await container.stop({t: 10}).catch(() => {
                console.log(`Killing container ${containerId}`);
                container.kill().then(() => {
                    resolve();
                }).catch(() => {
                    reject();
                });
            }).then(() => {
                resolve();
            });
        }));
    })
}

/**
 * Get the version of the image from storage. Returns null if no fixed version is set.
 */
export async function getFixedImageTagString(environment: Environment) {
    // is null if not fixed, this implies a strategy where the latest compatible version is used
    const releaseTag = getImageTag(environment);
    console.debug(`Fixed image version: ${JSON.stringify(releaseTag)}`);
    if (releaseTag == null) {
        return null;
    } else {
        return getVersionString(releaseTag);
    }
}

/**
 * Set a fixed version of the image.
 * @param environment The environment for which to set the image version.
 * @param tag The version tag to set. If null, the latest compatible version strategy is used.
 */
export async function setFixedImageTagString(environment: Environment, tag: string) {
    // might be null when latest compatible version strategy is selected
    console.log(`Setting fixed image version to ${tag}`)
    if (tag == null) {
        console.log(`Deleting fixed image version`);
        // delete any previously set fixed version
        await deleteImageTag(environment);
    } else {
        console.log(`Setting fixed image version to ${tag}`)
        // prefix with "v" if not already
        if (!tag.startsWith("v")) {
            tag = `v${tag}`;
        }
        await setImageTag(environment, tag);
    }
}

/**
 * Get a fixed version of the image from storage or query GitHub for the latest compatible version.
 */
export async function getImageTagOrLatestCompatible(environment: Environment) {
    let releaseTag = getImageTag(environment);
    if (releaseTag === null) {
        logToDevTools("No image version specified in storage, querying GitHub for latest version");
        releaseTag = await getLatestCompatibleImageReleaseTag(environment);
        logToDevTools(`Latest compatible version: ${getVersionString(releaseTag)}`);
    } else {
        logToDevTools(`Expecting image version: ${getVersionString(releaseTag)}`);
    }
    return releaseTag;
}

/**
 * Prepare the backend by downloading and registering the image if necessary.
 */
export async function initializeBackend(environment: Environment) {
    return new Promise<void>((resolve, reject) => {
        updateProgress({
            step: `Initializing ${environment} environment`,
            message: `Initializing ${environment} environment`,
            state: "running",
        });
        // get the version of the image
        getImageTagOrLatestCompatible(environment).then(async (releaseTag) => {
            // run initialization
            // this will download and register the image if necessary
            getBackend().then(async (backend) => {
                switch (backend.type) {
                    case DOCKER.type:
                        logToDevTools(`Initializing Docker backend`);
                        await initializeDockerBackend(environment, releaseTag);
                        updateProgress({
                            step: `Initializing ${environment} environment`,
                            message: "Finished initializing Docker backend",
                            state: "done",
                        });
                        resolve();
                        break;
                    case WSL.type:
                        logToDevTools(`Initializing WSL backend`);
                        await initializeWslBackend(environment, releaseTag);
                        resolve();
                        break;
                    default:
                        reject(`Backend ${backend.type} not supported`);
                }
            });
        });
    });
}

/**
 * Get the name and tag of an image from a name including a version tag.
 * @param image
 */
async function getNameAndTagFromImageName(image: string): Promise<IImage> {
    const backend = await getBackend();
    let separator;
    switch (backend.type) {
        case DOCKER.type:
            separator = ":";
            break;
        case WSL.type:
            separator = "_";
            break;
        default:
            throw new Error(`Backend ${backend.type} not supported`);
    }

    // split only on last occurrence of separator as the name might contain it (e.g. port number for docker)
    const parts = image.split(separator);
    const name = parts.slice(0, -1).join(separator);
    const tag = parts.slice(-1)[0];

    return {name, tag};
}

/**
 * List images associated with the environment using the currently set backend.
 */
export async function getAssociatedImages(environment: Environment): Promise<IImage[]> {
    const backend = await getBackend();
    switch (backend.type) {
        case DOCKER.type:
            return await getAssociatedImagesDocker(environment);
        case WSL.type:
            return await getAssociatedImagesWsl(environment);
        default:
            throw new Error(`Backend ${backend.type} not supported`);
    }
}

/**
 * Identify images associated with the application at the Docker backend.
 */
async function getAssociatedImagesDocker(environment: Environment): Promise<IImage[]> {
    return new Promise<IImage[]>((resolve) => {
        getImageBaseName(environment).then((baseName) => {
            // filter for images where the name starts with the base name
            docker.listImages().then(async (images: Dockerode.ImageInfo[]) => {
                const associatedImages = images.filter((imageInfo: { RepoTags: string[] }) => {
                    return imageInfo.RepoTags.some((imageName: string) => {
                        return imageName.startsWith(baseName);
                    });
                });
                // convert to IImage using the first tag
                const ret = [];
                for (const imageInfo of associatedImages) {
                    const imageName = imageInfo.RepoTags[0];
                    const image: IImage = await getNameAndTagFromImageName(imageName);
                    ret.push(image);
                    console.debug(`Found associated image: ${JSON.stringify(image)}`);
                }
                resolve(ret);
            });
        });
    });
}

/**
 * Identify images associated with the application at the WSL backend.
 */
async function getAssociatedImagesWsl(environment: Environment): Promise<IImage[]> {
    return new Promise<IImage[]>((resolve) => {
        getImageBaseName(environment).then((baseName) => {
            wsl.listVerbose().then(async (distributions: { name: string }[]) => {
                // filter for distributions where the name starts with the base name
                const associatedImages = distributions.filter((distro: { name: string }) => {
                    return distro.name.startsWith(baseName);
                });
                // convert to IImage using the first tag
                const ret = [];
                for (const distro of associatedImages) {
                    const distroName = distro.name;
                    const image: IImage = await getNameAndTagFromImageName(distroName);
                    ret.push(image);
                    console.debug(`Found associated image: ${JSON.stringify(image)}`);
                }
                resolve(ret);
            });
        });
    });
}

/**
 * Delete a given image from the backend.
 * @param name Name of the image excluding the version tag.
 * @param tag Version tag of the image.
 */
export async function deleteImage(name: string, tag: string) {
    const image: IImage = {name, tag};
    const backend = await getBackend();
    switch (backend.type) {
        case DOCKER.type:
            return await deleteImageDocker(image);
        case WSL.type:
            return await deleteImageWsl(image);
        default:
            throw new Error(`Backend ${backend.type} not supported`);
    }
}

/**
 * Delete a given image from Docker.
 * @param image
 */
async function deleteImageDocker(image: IImage) {
    const imageFullName = `${image.name}:${image.tag}`;
    logToDevTools(`Deleting image ${imageFullName}`);
    const dImage = docker.getImage(imageFullName);
    await dImage.remove();
}

/**
 * Delete a given image from WSL.
 * @param image
 */
async function deleteImageWsl(image: IImage) {
    return new Promise<void>((resolve) => {
        logToDevTools(`Deleting WSL distribution ${image.name}`);
        const distroName = `${image.name}_${image.tag}`;
        wsl.unregister(distroName).then(() => {
            logToDevTools(`WSL distribution ${distroName} deleted`);
            resolve();
        }).catch((error: Error) => {
            logToDevTools(`Error deleting WSL distribution ${distroName}: ${error}`);
            // somehow this fails even if the distribution is deleted
            resolve();
        });
    });
}

/**
 * Clean up the backend by deleting all associated images.
 * @param environment
 */
export async function cleanUpBackend(environment: Environment) {
    const images = await getAssociatedImages(environment);
    const deletionPromises = images.map(async (image) => {
        await deleteImage(image.name, image.tag);
    });
    await Promise.all(deletionPromises);
}

/**
 * Run a command using the backend.
 * @param environment The environment for which to run the command.
 * @param command The command to run as an array of strings.
 * @param options Options may include bind mounts.
 */
export async function run(environment: Environment, command: string[], options: IRunOptions = {binds: []}) {
    const backend = await getBackend();
    switch (backend.type) {
        case DOCKER.type:
            return await runWithDocker(environment, command, options);
        case WSL.type:
            return await runWithWsl(environment, command, options);
        default:
            throw new Error(`Backend ${backend.type} not supported`);
    }
}

/**
 * From a list of bind mounts, get the format that Docker expects.
 * @param binds
 */
function getDockerBindFormat(binds: IBind[]) {
    return binds.map((bind: IBind) => {
        return `${bind.source}:${bind.target}`;
    });
}

/**
 * Run a command using Docker as the backend.
 * @param environment The environment for which to run the command.
 * @param command The command to run as an array of strings.
 * @param options Options may include bind mounts.
 */
async function runWithDocker(environment: Environment, command: string[], options: IRunOptions) {
    console.log(`Running command with Docker: ${command}`);
    const image = await getImageName(environment, await getImageTagOrLatestCompatible(environment));
    console.log(`Running command ${command.join(' ')} at image ${image} with binds ${JSON.stringify(options.binds)}`);
    const container = await docker.createContainer({
        Image: image,
        Cmd: command,
        HostConfig: {
            AutoRemove: true,
            Binds: getDockerBindFormat(options.binds),
        },
        Tty: true,  // needed to get clean stdout and stderr
    });
    // start and get the stdout
    await container.start();
    runningContainers.add(container.id);
    container.attach({stream: true, stdout: true, stderr: true}, function (err: (Error | null), stream: NodeJS.ReadableStream) {
        stream.on('data', (data: Buffer) => {
            const msg = data.toString();
            logForEnvironment(environment, msg);
        });
    });
    const statusCode: { StatusCode: number } = await container.wait();
    runningContainers.delete(container.id);
    return statusCode.StatusCode;
}


/**
 * Run a command using WSL as the backend.
 * @param environment The environment for which to run the command.
 * @param command The command to run as an array of strings.
 * @param options Options may include bind mounts.
 */
async function runWithWsl(environment: Environment, command: string[], options: IRunOptions) {
    const backend = await getBackend();
    console.log(`Running command with WSL: ${command}`);
    const distribution = await getImageName(environment, await getImageTagOrLatestCompatible(environment));

    // run command to make bind mounts
    logForEnvironment(environment, `Running setup (bind mounts)`);
    for (const bind of options.binds) {
        const source = windowsToWsl(bind.source);
        const target = bind.target;

        console.log(`Preparing mount point ${target}`);
        logForEnvironment(environment, `Preparing mount point ${target}`);
        logForEnvironment(environment, "Clearing previous mounts...");
        await runSubprocess(backend.command, ["--distribution", distribution, "--", "umount", target], (msg) => {
            logToDevTools(msg);
        });  // might return non-zero if the mount point is not used

        if (fs.lstatSync(bind.source).isDirectory()) {
            logForEnvironment(environment, "Ensuring mount point exists...");
            const mkdirProc = await runSubprocess(backend.command, ["--distribution", distribution, "--", "mkdir", "-p", target], (msg) => {
                logToDevTools(msg);
            }); // flag -p creates parent directories if necessary and ignores errors if the directory already exists
            if (mkdirProc !== 0) {
                throw new Error(`Failed to create directory ${target}`);
            }
        } else {
            // create parent directory if necessary
            logForEnvironment(environment, "Ensuring mount point parent exists...");
            const parent = path.dirname(target);
            const mkdirProcNeeded = await runSubprocess(backend.command, ["--distribution", distribution, "--", "mkdir", "-p", parent], (msg) => {
                logToDevTools(msg);
            }); // flag -p creates parent directories if necessary and ignores errors if the directory already exists
            if (mkdirProcNeeded !== 0) {
                throw new Error(`Failed to create directory ${parent}`);
            }
            // touch file
            logForEnvironment(environment, "Ensuring mount point file exists...");
            const touchMountTargetProc = await runSubprocess(backend.command, ["--distribution", distribution, "--", "touch", target], (msg) => {
                logToDevTools(msg);
            });
            if (touchMountTargetProc !== 0) {
                throw new Error(`Failed to create file at mount point ${target}`);
            }
        }

        // ensure the source exists in mnt by remounting the drive; this might help with network shares and removable devices
        const driveLetter = bind.source.split(":")[0];
        const driveIdentifier = `${driveLetter.toUpperCase()}:`
        const driveMountPath = `/mnt/${driveLetter.toLowerCase()}`;
        logForEnvironment(environment, `Remounting drive ${driveIdentifier} to ${driveMountPath}...`);
        // ensure mountpoint exists
        await runSubprocess(backend.command, ["--distribution", distribution, "--", "mkdir", "-p", driveMountPath], (msg) => {
            logToDevTools(msg);
        });
        // mount NTFS-formatted drive to WSL; See https://learn.microsoft.com/en-us/windows/wsl/wsl2-mount-disk#differences-between-mounting-an-external-drive-with-windows-formatting-versus-linux-formatting
        const driveRemountProc = await runSubprocess(backend.command, ["--distribution", distribution, "--", "mount", "-t", "drvfs", driveIdentifier, driveMountPath], (msg) => {
            logToDevTools(msg);
        });
        if (driveRemountProc !== 0) {
            throw new Error(`Failed to remount drive ${driveIdentifier} to ${driveMountPath}`);
        }

        console.log(`Mounting ${source} to ${target}`);
        logForEnvironment(environment, `Bind mounting ${source} to ${target}`);
        const exitCode = await runSubprocess(backend.command, ["--distribution", distribution, "--", "mount", "--bind", source, target], (msg) => {
            logToDevTools(msg);
        });
        if (exitCode !== 0) {
            throw new Error(`Failed to mount ${source} to ${target}`);
        }
    }

    logForEnvironment(environment, `Running command`);
    runningDistributions.add(distribution);
    const args = ["--distribution", distribution, "--", ...command];
    return await runSubprocess(backend.command, args, (msg: string) => {
        logForEnvironment(environment, msg);
    }, runningWslMainProcesses).finally(() => {
        runningDistributions.delete(distribution);
    });
}
