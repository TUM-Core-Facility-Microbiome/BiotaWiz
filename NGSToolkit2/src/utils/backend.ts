import path from "path";
import * as fs from "fs";
import {
    COMPATIBLE_IMAGE_VERSIONS,
    DISTRIBUTION_NAME,
    IMAGE_ASSET_NAME
} from "../config";
import axios from "axios";
import {byOS, platforms} from "./platform";
import {getBackend, getImageTag, setImageTag} from "./storage";
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

const DOCKER = {
    name: "Docker",
    command: "docker",
    argsPrefix: ["run", "--rm"],
}

const WSL = {
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
        getImageReleaseAssetUrl(releaseTag).then((tarballUrl) => {
            // download tarball
            logToDevTools(`Downloading tarball from ${tarballUrl} to ${path}`);
            const expectedPath = getExpectedDistributionTarPath(releaseTag);
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

function getExpectedDistributionTarPath(releaseTag: SemVer) {
    const appDataDirectory = app.getPath('temp');
    return path.join(appDataDirectory, `${getImageName(releaseTag)}.tar.gz`);
}

function getDistributionInstallLocation(releaseTag: SemVer) {
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
    const installDir = path.join(appDataDirectory, 'wsl-distro', getImageName(releaseTag));

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
    const expectedPath = getExpectedDistributionTarPath(releaseTag);

    updateProgress({
        step: "Initializing backend",
        message: `Downloading distribution files`,
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
    const installLocation = getDistributionInstallLocation(releaseTag);

    // import distribution
    const distributionName = getImageName(releaseTag);
    logToDevTools(`Importing distribution ${distributionName} from ${tarBall} to ${installLocation}`);
    updateProgress({
        step: "Initializing backend",
        message: `Registering WSL distribution v${getVersionString(releaseTag)}`,
    });
    await wsl.importDistribution(distributionName, installLocation, tarBall);
}

function getImageName(releaseTag: SemVer) {
    const backend = getBackend();
    switch (backend) {
        case DOCKER:
            return `${CONTAINER_REGISTRY}/${IMAGE_REPOSITORY.owner}/${IMAGE_REPOSITORY.repo}:${getVersionString(releaseTag)}`
        case WSL:
            return `${DISTRIBUTION_NAME}_${getVersionString(releaseTag)}`;
        default:
            throw new Error(`Backend ${backend.name} not supported`);
    }
}

export async function initializeWslBackend(releaseTag: SemVer) {
    // check if the distribution is registered
    const distribution = getImageName(releaseTag);
    const installed = await wsl.isInstalled(distribution);
    if (installed) {
        logToDevTools(`WSL distribution ${distribution} is registered.`);
        updateProgress({
            step: "Initializing backend",
            message: `WSL distribution v${getVersionString(releaseTag)} is registered`,
        });
    } else {
        logToDevTools(`WSL distribution ${distribution} is not registered.`);
        await registerWslDistribution(releaseTag);
    }

    // ensure distribution is running on WSL2
    updateProgress({
        step: "Initializing backend",
        message: `Ensuring distribution is running on WSL2`,
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
    });
    await wsl.runDistribution(distribution);
    await wsl.waitForRunning(distribution);

    updateProgress({
        step: "Initializing backend",
        message: `Finished initializing WSL backend`,
    });
}

export async function initializeDockerBackend(releaseTag: SemVer) {
    const docker = new Docker();  // initialize with defaults; using socket
    const image = getImageName(releaseTag);

    updateProgress({
        step: "Initializing backend",
        message: "Checking Docker image tag",
    });
    // check if the image is registered
    const images = await docker.listImages();
    const imageExists = images.some((imageInfo: any) => {
        return imageInfo.RepoTags.includes(image);
    });

    if (imageExists) {
        logToDevTools(`Image ${image} exists.`);
    } else {
        logToDevTools(`Image ${image} does not exist.`);
        // pull the image
        updateProgress({
            step: "Initializing backend",
            message: `Pulling v${getVersionString(releaseTag)} image`,
        });
        await docker.pull(image).then((stream: any) => {
            stream.on('finish', () => {
                logToDevTools(`Image ${image} pulled.`);
            });
        });
    }

    updateProgress({
        step: "Initializing backend",
        message: "Finished initializing Docker backend",
    });
    return;
}

export async function terminateWslBackend() {
    logToDevTools(`Terminating WSL distribution ${DISTRIBUTION_NAME}`);
    await wsl.terminate(DISTRIBUTION_NAME);
}

export async function terminateDockerBackend() {
    throw new Error("Not implemented yet");
}

export async function initializeBackend() {
    updateProgress({
        step: "Initializing backend",
        message: "Initializing backend",
    });
    // get the version of the image
    let releaseTag = getImageTag();
    if (releaseTag === null) {
        logToDevTools("No image version specified in storage, querying GitHub for latest version");

        updateProgress({
            step: "Initializing backend",
            message: "Checking for new pipeline releases",
        });
        releaseTag = await getLatestCompatibleImageReleaseTag();
        logToDevTools(`Latest compatible version: ${getVersionString(releaseTag)}`);

        // await setImageTag(releaseTag);  // TODO: manage if user wants to update or use a fixed version
    } else {
        logToDevTools(`Expecting image version: ${getVersionString(releaseTag)}`);
    }

    // run initialization
    // this will download and register the image if necessary
    const backend = getBackend();
    switch (backend) {
        case DOCKER:
            logToDevTools(`Initializing Docker backend`);
            await initializeDockerBackend(releaseTag);
            break;
        case WSL:
            logToDevTools(`Initializing WSL backend`);
            await initializeWslBackend(releaseTag);
            break;
        default:
            throw new Error(`Backend ${backend.name} not supported`);
    }
}
