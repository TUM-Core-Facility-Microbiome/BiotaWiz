import path from "path";
import * as fs from "fs";
import {getChecksum} from "./process";
import {
    DISTRIBUTION_NAME,
    WSL_TAR_CHECKSUM,
    WSL_TAR_NAME,
    IMAGE_REPOSITORY,
    GITHUB_BASE_URL,
    COMPATIBLE_IMAGE_VERSIONS
} from "../config";
import axios from "axios";
import {getLatestMatchingVersion, semVerFromGitHubTag} from "./semver";

const {app} = require('electron');
const wsl = require('@endevr-io/wsl-api');

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
 * Ensure the distribution tarball is valid.
 * @param path
 * @throws Error if the tarball is not valid.
 */
async function checkTarValid(path: string) {
    checkTarExists(path);

    // compare the SHA256 checksums to validate the download
    const actualChecksum = await getChecksum(path);
    console.log(actualChecksum);
    const expectedChecksum = WSL_TAR_CHECKSUM;
    if (actualChecksum !== expectedChecksum) {
        throw new Error(`Checksum of distribution tarball does not match. Expected ${expectedChecksum}, but got ${actualChecksum}`);
    }
}

/**
 * Query GitHub for the latest release tag of the image.
 */
async function getCurrentImageReleaseTag() {
    return new Promise<SemanticVersion>((resolve, reject) => {
        axios.get<GitHubReleasesLatestResponse>(
            `https://api.github.com/repos/${IMAGE_REPOSITORY.owner}/${IMAGE_REPOSITORY.repo}/releases/latest`,
            {
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                },
            }
        ).then((response) => {
            const data = response.data;
            const tag = data.tag_name;
            const semver: SemanticVersion = semVerFromGitHubTag(tag);
            resolve(semver);
        }).catch((error) => {
            reject(error);
        });
    });
}

async function getLatestCompatibleImageReleaseTag() {
    return new Promise<SemanticVersion>((resolve, reject) => {
        // query GitHub for available releases
        axios.get<GitHubReleasesLatestResponse[]>(
            `https://api.github.com/repos/${IMAGE_REPOSITORY.owner}/${IMAGE_REPOSITORY.repo}/releases`,
            {
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                },
            }
        ).then((response) => {
            const data = response.data;
            const availableVersions = data.map((release) => {
                return semVerFromGitHubTag(release.tag_name);
            });
            const latestCompatibleVersion = getLatestMatchingVersion(availableVersions, COMPATIBLE_IMAGE_VERSIONS);
            resolve(latestCompatibleVersion);
        }).catch((error) => {
            reject(error);
        });
    });
}

/**
 * Download the distribution tarball and places it to the expected path.
 */
async function downloadDistributionTar(path: string) {
    // TODO: implement
    const expectedPath = getExpectedDistributionTarPath();
    const imageReleaseVersion = await getCurrentImageReleaseTag();
    console.log(imageReleaseVersion);
    const latestCompatibleVersion = await getLatestCompatibleImageReleaseTag();
    console.log(`Latest compatible version: ${latestCompatibleVersion.major}.${latestCompatibleVersion.minor}.${latestCompatibleVersion.patch}`);
    throw new Error(`Not implemented yet. Place tar by hand at ${expectedPath}`);
}

function getExpectedDistributionTarPath() {
    const appDataDirectory = app.getPath('temp');
    return path.join(appDataDirectory, WSL_TAR_NAME);
}

function getDistributionInstallLocation() {
    const appDataDirectory = app.getPath('userData');
    return path.join(appDataDirectory, 'wsl-distro');
}

/**
 * Get the path of the distribution tarball. If it does not exist, download it.
 *
 * @returns The path of the distribution tarball.
 */
export async function getDistributionTarPath(): Promise<string> {
    const expectedPath = getExpectedDistributionTarPath();

    if (!fs.existsSync(expectedPath)) {
        await downloadDistributionTar(expectedPath);
    }

    await checkTarValid(expectedPath);

    return expectedPath;
}

export async function getDistroVersion(distribution: string) {
    const distributions = await wsl.listVerbose();
    for (const distro of distributions) {
        if (distro.name === distribution) {
            return distro.version;
        }
    }
    throw new Error(`Distribution ${distribution} not found`);
}

export async function registerWslDistribution() {
    const tarPath = await getDistributionTarPath();
    const installLocation = getDistributionInstallLocation();

    // import distribution
    console.log(`Importing distribution ${DISTRIBUTION_NAME} from ${tarPath} to ${installLocation}`);
    await wsl.importDistribution(DISTRIBUTION_NAME, installLocation, tarPath);

    // ensure distribution is running on WSL2
    const version = await getDistroVersion(DISTRIBUTION_NAME);
    console.log(`Distribution ${DISTRIBUTION_NAME} has version ${version}`);
    if (version !== 2) {
        console.log(`Setting version of distribution ${DISTRIBUTION_NAME} to 2`);
        await wsl.setVersion(DISTRIBUTION_NAME, 2);
    }
}

export async function initializeWslBackend() {
    // check if the distribution is registered
    const installed = await wsl.isInstalled(DISTRIBUTION_NAME);
    if (installed) {
        console.log(`WSL distribution ${DISTRIBUTION_NAME} is installed`);
    } else {
        console.log(`WSL distribution ${DISTRIBUTION_NAME} is not installed`);
        await registerWslDistribution();
    }

    const version = await wsl.listVerbose();
    console.log(`WSL version: ${version}`);

    // ensure the distribution is running
    await wsl.runDistribution(DISTRIBUTION_NAME);
    await wsl.waitForRunning(DISTRIBUTION_NAME);
}

export async function initializeDockerBackend() {
    // check if the image is registered

}

export async function terminateWslBackend() {
    console.log(`Terminating WSL distribution ${DISTRIBUTION_NAME}`);
    await wsl.terminate(DISTRIBUTION_NAME);
}

export async function terminateDockerBackend() {
    throw new Error("Not implemented yet");
}
