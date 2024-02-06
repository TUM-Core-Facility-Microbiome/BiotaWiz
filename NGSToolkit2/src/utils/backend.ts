import path from "path";
import * as fs from "fs";
import {COMPATIBLE_IMAGE_VERSIONS, DISTRIBUTION_NAME, IMAGE_ASSET_NAME} from "../config";
import axios from "axios";
import {byOS, platforms} from "./platform";
import {deleteImageTag, getBackend, getImageTag, setBackend, setImageTag} from "./storage";
import {getLatestVersion, getMatchingVersions, getVersionString, semVerFromGitHubTag} from "./releasetag";
import {logToDevTools, updateProgress} from "./logHandler";
import {SemVer} from "semver";
import {cmArgs} from "./command-line-arguments";

const {app} = require('electron');
const wsl = require('@endevr-io/wsl-api');
const Docker = require('dockerode');


const GITHUB_API_BASE_URL = cmArgs['api-url'];
const CONTAINER_REGISTRY = cmArgs['container-registry'];
const IMAGE_REPOSITORY = {
    owner: cmArgs['tic-pipeline-repository-owner'],
    repo: cmArgs['tic-pipeline-repository-name'],
}

const DOCKER: IBackend = {
    type: "Docker",
    name: "Docker",
    command: "docker",
    argsPrefix: ["run", "--rm"],
}

const WSL: IBackend = {
    type: "WSL",
    name: "Windows Subsystem for Linux",
    command: "wsl",
    argsPrefix: ["-l", "-v"],
}

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

/**
 * Query GitHub for the latest release tag of the image.
 */
async function getCurrentImageReleaseTag() {
    return new Promise<SemVer>((resolve, reject) => {
        axios.get<GitHubRelease>(
            `${GITHUB_API_BASE_URL}/repos/${IMAGE_REPOSITORY.owner}/${IMAGE_REPOSITORY.repo}/releases/latest`,
            {
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                },
            }
        ).then((response) => {
            const data = response.data;
            const tag = data.tag_name;
            const semver: SemVer = semVerFromGitHubTag(tag);
            resolve(semver);
        }).catch((error) => {
            reject(error);
        });
    });
}

export async function getCompatibleReleaseTagStrings() {
    return new Promise<string[]>((resolve, reject) => {
        getCompatibleImageReleaseTags().then((tags) => {
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

async function queryAvailableReleaseTags() {
    return new Promise<SemVer[]>((resolve, reject) => {
        // query GitHub for available releases
        axios.get<GitHubRelease[]>(
            `${GITHUB_API_BASE_URL}/repos/${IMAGE_REPOSITORY.owner}/${IMAGE_REPOSITORY.repo}/releases`,
            {
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                },
            }
        ).then((response) => {
            const data = response.data;
            const availableTags = data.map((release) => {
                return semVerFromGitHubTag(release.tag_name);
            });
            console.debug(`Repo offers ${availableTags.length} releases: ${availableTags.map((version: SemVer) => getVersionString(version)).join(', ')}`);
            resolve(availableTags);
        }).catch((error) => {
            reject(error);
        });
    });
}

async function getCompatibleImageReleaseTags() {
    return new Promise<SemVer[]>((resolve, reject) => {
        queryAvailableReleaseTags().then((availableTags) => {
            const compatibleVersions = getMatchingVersions(availableTags, COMPATIBLE_IMAGE_VERSIONS);
            console.debug(`Found ${compatibleVersions.length} compatible versions: ${compatibleVersions.map((version: SemVer) => getVersionString(version)).join(', ')}`);
            resolve(compatibleVersions);
        }).catch((error) => {
            reject(error);
        });
    });
}

async function getLatestCompatibleImageReleaseTag() {
    return new Promise<SemVer>((resolve, reject) => {
        getCompatibleImageReleaseTags().then((compatibleTags) => {
            const latestTag = getLatestVersion(compatibleTags);
            resolve(latestTag);
        }).catch((error) => {
            reject(error);
        });
    });
}

async function getImageReleaseAssetUrl(releaseTag: SemVer) {
    return new Promise<string>((resolve, reject) => {
        // load specified release and find the tarball
        const RELEASE_URL = `${GITHUB_API_BASE_URL}/repos/${IMAGE_REPOSITORY.owner}/${IMAGE_REPOSITORY.repo}/releases/tags/v${getVersionString(releaseTag)}`;
        logToDevTools(`Querying GitHub for release v${getVersionString(releaseTag)} at ${RELEASE_URL}`);
        axios.get<GitHubRelease>(
            RELEASE_URL,
            {headers: {'X-GitHub-Api-Version': '2022-11-28'}}
        ).then((response) => {
            const data = response.data;
            const assets = data.assets;

            // find the tarball
            logToDevTools(`Release has ${assets.length} assets attached. Searching for ${IMAGE_ASSET_NAME}`);
            const tarball = assets.find((asset) => {
                return asset.name === IMAGE_ASSET_NAME;
            });

            if (tarball === undefined) {
                reject(`Could not find tarball attached to release. Expected ${IMAGE_ASSET_NAME} at v${getVersionString(releaseTag)}`);
            }

            resolve(tarball.browser_download_url);
        });
    });
}

/**
 * Download the distribution tarball and places it to the expected path.
 */
async function downloadDistributionTar(releaseTag: SemVer, path: string) {
    return new Promise<void>((resolve, reject) => {
        // get tarball URL
        getImageReleaseAssetUrl(releaseTag).then(async (tarballUrl) => {
            // download tarball
            logToDevTools(`Downloading tarball from ${tarballUrl} to ${path}`);
            const expectedPath = await getExpectedDistributionTarPath(releaseTag);
            const writer = fs.createWriteStream(expectedPath);
            axios.get(
                tarballUrl,
                {responseType: 'stream'}
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

async function getExpectedDistributionTarPath(releaseTag: SemVer) {
    const appDataDirectory = app.getPath('temp');
    return path.join(appDataDirectory, `${await getImageName(releaseTag)}.tar.gz`);
}

async function getDistributionInstallLocation(releaseTag: SemVer) {
    const appDataDirectory = byOS({
        [platforms.WINDOWS]: () => {
            // avoid using userData as this is a roaming profile, try using an app folder in %LOCALAPPDATA%
            const localAppData = process.env.LOCALAPPDATA;
            if (localAppData === undefined) {
                return app.getPath('userData');  // fallback when environment variable is not set
            }
            return path.join(localAppData, app.name);
        },
        default: () => app.getPath('userData'),
    })();
    const installDir = path.join(appDataDirectory, 'wsl-distro', await getImageName(releaseTag));

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
export async function getImageTarball(releaseTag: SemVer) {
    const expectedPath = await getExpectedDistributionTarPath(releaseTag);

    updateProgress({
        step: "Initializing backend",
        message: `Downloading distribution files`,
        state: "running",
    });

    if (!fs.existsSync(expectedPath)) {
        await downloadDistributionTar(releaseTag, expectedPath);
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


export async function registerWslDistribution(releaseTag: SemVer) {
    const tarBall = await getImageTarball(releaseTag);
    const installLocation = await getDistributionInstallLocation(releaseTag);

    // import distribution
    const distributionName = await getImageName(releaseTag);
    logToDevTools(`Importing distribution ${distributionName} from ${tarBall} to ${installLocation}`);
    updateProgress({
        step: "Initializing backend",
        message: `Registering WSL distribution v${getVersionString(releaseTag)}`,
        state: "running",
    });
    await wsl.importDistribution(distributionName, installLocation, tarBall);
}

/**
 * Get the name of the image excluding the version tag.
 */
async function getImageBaseName() {
    const backend = await getBackend();
    switch (backend.type) {
        case DOCKER.type:
            return `${CONTAINER_REGISTRY}/${IMAGE_REPOSITORY.owner}/${IMAGE_REPOSITORY.repo}`;
        case WSL.type:
            return DISTRIBUTION_NAME;
        default:
            throw new Error(`Backend ${backend.type} not supported`);
    }
}

/**
 * Get the full name of the image including the version tag. This is dependent on the passed release tag.
 * @param releaseTag The version tag of the image.
 */
async function getImageName(releaseTag: SemVer) {
    const backend = await getBackend();
    const baseName = await getImageBaseName();
    switch (backend.type) {
        case DOCKER.type:
            return `${baseName}:${getVersionString(releaseTag)}`
        case WSL.type:
            return `${baseName}_${getVersionString(releaseTag)}`;
        default:
            throw new Error(`Backend ${backend.type} not supported`);
    }
}

export async function initializeWslBackend(releaseTag: SemVer) {
    // check if the distribution is registered
    const distribution = await getImageName(releaseTag);
    const installed = await wsl.isInstalled(distribution);
    if (installed) {
        logToDevTools(`WSL distribution ${distribution} is registered.`);
        updateProgress({
            step: "Initializing backend",
            message: `WSL distribution v${getVersionString(releaseTag)} is registered`,
            state: "running",
        });
    } else {
        logToDevTools(`WSL distribution ${distribution} is not registered.`);
        await registerWslDistribution(releaseTag);
    }

    // ensure distribution is running on WSL2
    updateProgress({
        step: "Initializing backend",
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
        step: "Initializing backend",
        message: `Starting distribution`,
        state: "running",
    });
    await wsl.runDistribution(distribution);
    await wsl.waitForRunning(distribution);

    updateProgress({
        step: "Initializing backend",
        message: `Finished initializing WSL backend`,
        state: "done",
    });
}

export async function initializeDockerBackend(releaseTag: SemVer) {
    return new Promise<void>((resolve, reject) => {
        const docker = new Docker();  // initialize with defaults; using socket
        getImageName(releaseTag).then(async (image) => {
            updateProgress({
                step: "Initializing backend",
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
                logToDevTools(`Image ${image} does not exist.`);
                // pull the image
                updateProgress({
                    step: "Initializing backend",
                    message: `Pulling v${getVersionString(releaseTag)} image`,
                    state: "running",
                });
                await docker.pull(image).then((stream: any) => {
                    docker.modem.followProgress(stream, onFinished, onProgress);
                    let currentStatus = "";
                    let lastUpdateTimeStamp = 0;

                    function onFinished(err: any, output: any) {
                        logToDevTools(`Image ${image} pulled.`);
                        resolve();
                    }
                    function onProgress(event: { status: string, progressDetail: { current: number, total: number }, progress: string, id: string }) {
                        if (event.status !== currentStatus) {
                            currentStatus = event.status;
                            logToDevTools(`Image pull: ${event.status}`);
                            updateProgress({
                                step: "Initializing backend",
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
                                        step: "Initializing backend",
                                        message: `${event.status} image v${getVersionString(releaseTag)} (${pct}%)`,
                                        state: "running",
                                    });
                                }
                            }
                        }
                    }
                });
            }
        });
    });
}

export async function terminateWslBackend() {
    logToDevTools(`Terminating WSL distribution ${DISTRIBUTION_NAME}`);
    await wsl.terminate(DISTRIBUTION_NAME);
}

export async function terminateDockerBackend() {
    throw new Error("Not implemented yet");
}

export async function getFixedImageTagString() {
    // is null if not fixed, this implies a strategy where the latest compatible version is used
    const releaseTag = getImageTag();
    console.debug(`Fixed image version: ${JSON.stringify(releaseTag)}`);
    if (releaseTag == null) {
        return null;
    } else {
        return getVersionString(releaseTag);
    }
}

export async function setFixedImageTagString(tag: string) {
    // might be null when latest compatible version strategy is selected
    console.log(`Setting fixed image version to ${tag}`)
    if (tag == null) {
        console.log(`Deleting fixed image version`);
        // delete any previously set fixed version
        await deleteImageTag();
    } else {
        console.log(`Setting fixed image version to ${tag}`)
        // prefix with "v" if not already
        if (!tag.startsWith("v")) {
            tag = `v${tag}`;
        }
        await setImageTag(tag);
    }
}

async function getImageTagOrLatestCompatible() {
    let releaseTag = getImageTag();
    if (releaseTag === null) {
        logToDevTools("No image version specified in storage, querying GitHub for latest version");
        releaseTag = await getLatestCompatibleImageReleaseTag();
        logToDevTools(`Latest compatible version: ${getVersionString(releaseTag)}`);
    } else {
        logToDevTools(`Expecting image version: ${getVersionString(releaseTag)}`);
    }
    return releaseTag;
}

export async function initializeBackend() {
    updateProgress({
        step: "Initializing backend",
        message: "Initializing backend",
        state: "running",
    });
    // get the version of the image
    const releaseTag = await getImageTagOrLatestCompatible();

    // run initialization
    // this will download and register the image if necessary
    const backend = await getBackend();
    switch (backend.type) {
        case DOCKER.type:
            logToDevTools(`Initializing Docker backend`);
            await initializeDockerBackend(releaseTag);
            updateProgress({
                step: "Initializing backend",
                message: "Finished initializing Docker backend",
                state: "done",
            });
            break;
        case WSL.type:
            logToDevTools(`Initializing WSL backend`);
            await initializeWslBackend(releaseTag);
            break;
        default:
            throw new Error(`Backend ${backend.type} not supported`);
    }
}

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

export async function getAssociatedImages(): Promise<IImage[]> {
    const backend = await getBackend();
    switch (backend.type) {
        case DOCKER.type:
            return await getAssociatedImagesDocker();
        case WSL.type:
            return await getAssociatedImagesWsl();
        default:
            throw new Error(`Backend ${backend.type} not supported`);
    }
}

/**
 * Identify images associated with the application for the Docker backend.
 */
async function getAssociatedImagesDocker(): Promise<IImage[]> {
    return new Promise<IImage[]>((resolve, reject) => {
        const docker = new Docker();
        getImageBaseName().then((baseName) => {
            // filter for images where the name starts with the base name
            docker.listImages().then(async (images: any) => {
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

async function getAssociatedImagesWsl(): Promise<IImage[]> {
    return new Promise<IImage[]>((resolve, reject) => {
        getImageBaseName().then((baseName) => {
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

async function deleteImageDocker(image: IImage) {
    const docker = new Docker();
    const imageFullName = `${image.name}:${image.tag}`;
    logToDevTools(`Deleting image ${imageFullName}`);
    const dImage = docker.getImage(imageFullName);
    await dImage.remove();
}

async function deleteImageWsl(image: IImage) {
    return new Promise<void>((resolve, reject) => {
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

export async function run(command: string[], options: { binds: string[] }) {
    const backend = await getBackend();
    switch (backend.type) {
        case DOCKER.type:
            return await runWithDocker(command, options);
        case WSL.type:
            throw new Error("Not implemented yet");
        default:
            throw new Error(`Backend ${backend.type} not supported`);
    }
}

export async function runWithDocker(command: string[], options: { binds: string[] } = { binds: [] }) {
const docker = new Docker();
    const image = await getImageName(await getImageTagOrLatestCompatible());
    const container = await docker.createContainer({
        Image: image,
        Cmd: command,
        HostConfig: {
            AutoRemove: true,
            Binds: options.binds,
        },
        CpuShares: 768,  // limit CPU usage
    });
    await container.start();
    const data = await container.wait();
    return data.StatusCode;
}
