import path from "path";
import * as fs from "fs";
import {IMAGE_ASSET_NAME} from "../config";
import {byOS, platforms} from "./platform";
import {deleteImageTag, getBackend, getImageTag, setImageTag, storeBackend} from "./storage";
import {
    getAllowedRange,
    getLatestVersion,
    getMatchingVersions,
    getVersionString,
    semVerFromGitHubTag
} from "./releasetag";
import {logToDevTools, logToSection, updateProgress} from "./logHandler";
import {LineBuffer} from "./lineBuffer";
import {SemVer} from "semver";
import {cmArgs} from "./command-line-arguments";
import {runSubprocess} from "./process";
import {Environment, LogSection} from "../enums";
import {docker} from "./makeDockerConnection";
import {helpPages} from "./helpPages";
import {app} from "electron";
import Dockerode from "dockerode";
import {getLegacyWslDistributionRoot, getPipelineDownloadRoot, getWslDistributionRoot} from "./helpers";
import {decidePipelineFileAction, parseSha256Digest, readDigestRecord, sha256File, writeDigestRecord} from "./pipelineFile";
import * as child_process from "node:child_process";
import {combineReachability, wgetExitCodeToReachability, wgetProbeArguments} from "./internetCheck";

import wsl from "@endevr-io/wsl-api";
import { windowsToWsl } from "@endevr-io/wsl-path";

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
        case Environment.TACTIC:
            return {
                owner: cmArgs['pipeline-repository-owner'],
                repo: cmArgs['pipeline-repository-name'],
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
    return (byOS({
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
    }) as () => IBackend)();
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
        await terminateBackend(Environment.TACTIC);
        await cleanUpBackend(Environment.TACTIC);
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

/**
 * Check whether the pipeline can reach any of the URLs from inside the backend.
 * For WSL, wget runs in any registered distribution of the application, as all WSL2 distributions share one network.
 * @returns null if it cannot be checked inside the backend: for Docker, whose containers use the network of the host,
 * and for WSL as long as no distribution is registered.
 */
export async function checkBackendInternetAccess(urls: string[]): Promise<boolean | null> {
    const backend = await getBackend();
    if (backend.type !== WSL.type) {
        return null;
    }
    await ensureWslDistributionsMigrated();
    let distribution: string | undefined;
    try {
        const baseName = await getImageBaseName(Environment.TACTIC);
        const distributions: { name: string }[] = await wsl.listVerbose();
        distribution = distributions.find((distro) => distro.name.startsWith(baseName))?.name;
    } catch (error) {
        logToDevTools(`Could not list WSL distributions to check internet access: ${error}`);
        return null;
    }
    if (distribution === undefined) {
        return null;
    }
    const results = await Promise.all(urls.map(async (url) => {
        try {
            const code = await runSubprocess(backend.command, ["--distribution", distribution, "--", ...wgetProbeArguments(url)]);
            logToDevTools(`Internet check from WSL for ${url} exited with code ${code}`);
            return wgetExitCodeToReachability(code);
        } catch {
            return null;
        }
    }));
    return combineReachability(results);
}

export async function resetToDefaultBackend() {
    await setBackend(getDefaultBackend());
}

/**
 * Check whether a distribution tarball file exists and is valid.
 * Validates existence, non-zero size, expected size (if provided), and gzip magic bytes header (0x1f, 0x8b).
 * @param filePath Path to the tarball.
 * @param expectedSize Optional expected file size in bytes.
 */
export function isTarballValid(filePath: string, expectedSize?: number): boolean {
    if (!fs.existsSync(filePath)) {
        return false;
    }
    try {
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
            return false;
        }
        if (expectedSize !== undefined && expectedSize > 0 && stats.size !== expectedSize) {
            return false;
        }
        // Gzip files must start with magic bytes 0x1f, 0x8b
        const fd = fs.openSync(filePath, 'r');
        try {
            const buffer = Buffer.alloc(2);
            const bytesRead = fs.readSync(fd, buffer, 0, 2, 0);
            if (bytesRead < 2) {
                return false;
            }
            return buffer[0] === 0x1f && buffer[1] === 0x8b;
        } finally {
            fs.closeSync(fd);
        }
    } catch {
        return false;
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

const RELEASES_PER_PAGE = 100;  // maximum allowed by the GitHub API
const MAX_RELEASE_PAGES = 10;
const RELEASE_QUERY_TIMEOUT_MS = 15 * 1000;  // give up on a page of the GitHub API after this time

/**
 * Turn errors of the release query into messages that can be shown to the user.
 */
export function describeReleaseQueryError(error: unknown): string {
    // compare by name, as the DOMException thrown on timeout is not necessarily an instance of Error
    const name = (error as { name?: string } | null)?.name;
    if (name === 'TimeoutError') {
        return `GitHub did not respond within ${RELEASE_QUERY_TIMEOUT_MS / 1000} seconds.`;
    }
    if (name === 'TypeError') {
        // fetch() rejects with a TypeError on network failures; its cause holds the details, e.g., ENOTFOUND
        const cause = (error as { cause?: { code?: string, message?: string } }).cause;
        const detail = cause?.code ?? cause?.message;
        return `Could not connect to GitHub${detail ? ` (${detail})` : ''}. Please check your internet connection.`;
    }
    return error instanceof Error ? error.message : String(error);
}

/**
 * Get all releases of the repository. The GitHub API returns them in pages, newest first.
 */
async function queryAllReleases(owner: string, repo: string): Promise<GitHubRelease[]> {
    const releases: GitHubRelease[] = [];
    for (let page = 1; page <= MAX_RELEASE_PAGES; page++) {
        const response = await fetch(
            `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/releases?per_page=${RELEASES_PER_PAGE}&page=${page}`,
            { headers: { 'X-GitHub-Api-Version': '2022-11-28' }, signal: AbortSignal.timeout(RELEASE_QUERY_TIMEOUT_MS) }
        );
        if (!response.ok) {
            // unauthenticated requests are limited to 60 per hour and IP address, which a shared network may exhaust
            if (isRateLimited(response)) {
                const reset = Number(response.headers.get('x-ratelimit-reset'));
                const retry = reset > 0 ? ` Please try again after ${new Date(reset * 1000).toLocaleTimeString()}.` : '';
                throw new Error(`GitHub API rate limit reached (HTTP ${response.status}).${retry}`);
            }
            throw new Error(`HTTP ${response.status}`);
        }
        const data: GitHubRelease[] = await response.json();
        releases.push(...data);
        if (data.length < RELEASES_PER_PAGE) {
            break;  // last page
        }
    }
    return releases;
}

const RELEASE_CACHE_MS = 5 * 60 * 1000;  // reuse the release list for this long to stay within the GitHub rate limit
const releaseCache = new Map<Environment, { tags: SemVer[], time: number }>();

/**
 * Forget the cached release lists, so the next query asks GitHub again.
 */
export function clearReleaseCache() {
    releaseCache.clear();
    releaseSelections.clear();
}

async function queryAvailableReleaseTags(environment: Environment) {
    const cached = releaseCache.get(environment);
    if (cached && Date.now() - cached.time < RELEASE_CACHE_MS) {
        return [...cached.tags];  // copy, as callers sort the list in place
    }
    const repo = getRepository(environment);
    try {
        logToDevTools(`Querying releases of ${repo.owner}/${repo.repo}`);
        const data = await queryAllReleases(repo.owner, repo.repo);
        const availableTags = data.map((release) => {
            try {
                if (!cmArgs['allow-prerelease-tags']) {
                    if (release.prerelease) return null;
                }
                // use the tag, not the release title: the image and its download are looked up by tag
                return semVerFromGitHubTag(release.tag_name);
            } catch {
                return null;
            }
        }).filter((tag) => tag !== null) as SemVer[];
        logToDevTools(`Repo offers ${availableTags.length} releases: ${availableTags.map((version: SemVer) => getVersionString(version)).join(', ')}`);
        releaseCache.set(environment, {tags: [...availableTags], time: Date.now()});
        return availableTags;
    } catch (error) {
        const message = describeReleaseQueryError(error);
        logToDevTools(`Failed to query releases of ${repo.owner}/${repo.repo}: ${message}`, 'error');
        updateProgress({
            step: `Initializing ${environment} environment`,
            message: `Failed to query available releases: ${message}`,
            state: "error",
            error: { code: "RAPIOF", helpUrl: helpPages.RAPIOF },
        });
        throw new Error(message);
    }
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
            if (latestTag === undefined) {
                reject(new Error(`No release of the pipeline is compatible with ${getAllowedRange(environment)}.`));
                return;
            }
            resolve(latestTag);
        }).catch((error) => {
            reject(error);
        });
    });
}

/**
 * Thrown if GitHub cannot be reached to look up a release, e.g., without internet access.
 */
class ReleaseUnreachableError extends Error {
}

/**
 * Whether GitHub rejected the request because the limit for unauthenticated requests is reached.
 */
function isRateLimited(response: Response) {
    return (response.status === 403 || response.status === 429) && response.headers?.get('x-ratelimit-remaining') === '0';
}

interface IImageReleaseAsset {
    url: string;
    size?: number;
    digest: string;  // SHA-256 that GitHub reports for the file
}

/**
 * Look up the pipeline file (WSL image) of a release on GitHub, including the SHA-256 GitHub reports for it.
 * @throws ReleaseUnreachableError if GitHub cannot be reached
 * @throws Error if the release has no such file or GitHub reports no checksum for it
 */
async function getImageReleaseAsset(environment: Environment, releaseTag: SemVer): Promise<IImageReleaseAsset> {
    const repo = getRepository(environment);
    const version = getVersionString(releaseTag);
    const RELEASE_URL = `${GITHUB_API_BASE_URL}/repos/${repo.owner}/${repo.repo}/releases/tags/v${version}`;
    logToDevTools(`Querying GitHub for release v${version} at ${RELEASE_URL}`);
    let response: Response;
    try {
        response = await fetch(RELEASE_URL, {
            headers: { 'X-GitHub-Api-Version': '2022-11-28' },
            signal: AbortSignal.timeout(RELEASE_QUERY_TIMEOUT_MS),
        });
    } catch (error) {
        throw new ReleaseUnreachableError(describeReleaseQueryError(error));
    }
    if (isRateLimited(response)) {
        throw new ReleaseUnreachableError(`GitHub API rate limit reached (HTTP ${response.status}).`);
    }
    if (!response.ok) {
        throw new Error(`Could not look up release v${version} on GitHub (HTTP ${response.status}).`);
    }
    const data: GitHubRelease = await response.json();
    logToDevTools(`Release has ${data.assets.length} assets attached. Searching for ${IMAGE_ASSET_NAME}`);
    const tarball = data.assets.find((asset) => asset.name === IMAGE_ASSET_NAME);
    if (tarball === undefined) {
        updateProgress({
            step: `Initializing ${environment} environment`,
            message: `Release v${version} is missing required asset.`,
            state: "error",
            error: { code: "RASMIS", helpUrl: helpPages.RASMIS },
        });
        throw new Error(`Could not find tarball attached to release. Expected ${IMAGE_ASSET_NAME} at v${version}`);
    }
    const digest = parseSha256Digest(tarball.digest);
    if (digest === null) {
        throw new Error(`GitHub did not provide a checksum for ${IMAGE_ASSET_NAME} of release v${version}, ` +
            `so it cannot be verified.`);
    }
    const url = tarball.url || tarball.browser_download_url;
    const size = (typeof tarball.size === 'number' && tarball.size > 0) ? tarball.size : undefined;
    return { url, size, digest };
}

/**
 * Thrown if a downloaded pipeline file does not have the SHA-256 GitHub reports for it.
 */
class ChecksumMismatchError extends Error {
}

function removeFile(filePath: string) {
    try {
        fs.rmSync(filePath, {force: true});
    } catch (error) {
        logToDevTools(`Could not remove ${filePath}: ${error}`, 'warn');
    }
}

/**
 * Compute the SHA-256 of a pipeline file and show the progress.
 */
async function hashPipelineFile(environment: Environment, filePath: string) {
    logToDevTools(`Computing SHA-256 of ${filePath}`);
    return await sha256File(filePath, (fraction) => updateProgress({
        step: `Initializing ${environment} environment`,
        message: `Verifying pipeline file (${Math.round(fraction * 100)}%)`,
        state: "running",
    }));
}

/**
 * Download the pipeline file, check that its SHA-256 matches the one GitHub reports, and store it with a record of
 * that checksum. The download is only kept if it matches.
 */
async function downloadDistributionTar(environment: Environment, releaseTag: SemVer, asset: IImageReleaseAsset, expectedPath: string) {
    const tarballUrl = asset.url;
    const targetSize = asset.size;
    const tempPath = `${expectedPath}.tmp`;
    fs.mkdirSync(path.dirname(expectedPath), {recursive: true});
    logToDevTools(`Downloading tarball from ${tarballUrl} to ${expectedPath}`);

    // If a stale temporary file exists, delete it before starting
    removeFile(tempPath);

    let response: Response;
    try {
        response = await fetch(tarballUrl, {
            headers: { 'Accept': 'application/octet-stream' },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
        updateProgress({
            step: `Initializing ${environment} environment`,
            message: `Failed to download distribution files.`,
            state: "error",
        });
        throw error;
    }

    const headerLength = parseInt(response.headers.get('content-length') ?? '0', 10);
    const total = headerLength > 0 ? headerLength : (targetSize ?? 0);
    let loaded = 0;
    const writer = fs.createWriteStream(tempPath);
    const reader = response.body!.getReader();

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            loaded += value.length;
            writer.write(Buffer.from(value));
            if (total > 0) {
                const percentCompleted = Math.floor((loaded * 100) / total);
                updateProgress({
                    step: `Initializing ${environment} environment`,
                    message: `Downloading distribution files (${percentCompleted}%)`,
                    state: "running",
                });
            }
        }
    } catch (error) {
        writer.destroy();
        removeFile(tempPath);
        updateProgress({
            step: `Initializing ${environment} environment`,
            message: `Failed to download distribution files.`,
            state: "error",
        });
        throw error;
    }

    await new Promise<void>((resolve, reject) => {
        writer.end();
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    // Verify stream completed with non-zero bytes
    if (loaded === 0) {
        removeFile(tempPath);
        updateProgress({
            step: `Initializing ${environment} environment`,
            message: `Failed to download distribution files (empty file).`,
            state: "error",
        });
        throw new Error(`Download of distribution tarball yielded 0 bytes.`);
    }

    // Verify total byte count if total was known
    if (total > 0 && loaded !== total) {
        removeFile(tempPath);
        updateProgress({
            step: `Initializing ${environment} environment`,
            message: `Failed to download distribution files (incomplete download).`,
            state: "error",
        });
        throw new Error(`Download of distribution tarball incomplete: received ${loaded} of ${total} bytes.`);
    }

    // Validate the completed temp file format and size before committing
    if (!isTarballValid(tempPath, total > 0 ? total : undefined)) {
        removeFile(tempPath);
        updateProgress({
            step: `Initializing ${environment} environment`,
            message: `Downloaded distribution file is invalid or corrupt.`,
            state: "error",
        });
        throw new Error(`Downloaded distribution file is not a valid gzip tarball.`);
    }

    // keep the file only if it is exactly the file of the release
    const digest = await hashPipelineFile(environment, tempPath);
    if (digest !== asset.digest) {
        removeFile(tempPath);
        throw new ChecksumMismatchError(`The downloaded pipeline file v${getVersionString(releaseTag)} has the SHA-256 ` +
            `${digest}, but GitHub reports ${asset.digest}.`);
    }
    fs.renameSync(tempPath, expectedPath);
    writeDigestRecord(getDownloadRecordPath(expectedPath), digest, path.basename(expectedPath));
    logToDevTools(`Downloaded and verified ${expectedPath} (SHA-256 ${digest})`);
}

/**
 * Download and verify the pipeline file, and try once more if the checksum does not match.
 */
async function downloadVerifiedPipelineFile(environment: Environment, releaseTag: SemVer, asset: IImageReleaseAsset, expectedPath: string) {
    try {
        await downloadDistributionTar(environment, releaseTag, asset, expectedPath);
    } catch (error) {
        if (!(error instanceof ChecksumMismatchError)) {
            throw error;
        }
        logToDevTools(`${error.message} Downloading again.`, 'warn');
        await downloadDistributionTar(environment, releaseTag, asset, expectedPath);
    }
}

/**
 * Path of the downloaded pipeline file (WSL image) of a version.
 */
async function getExpectedDistributionTarPath(environment: Environment, releaseTag: SemVer) {
    return path.join(getPipelineDownloadRoot(), `${await getImageName(environment, releaseTag)}.tar.gz`);
}

/**
 * Path of the record holding the SHA-256 the downloaded file was verified with.
 */
function getDownloadRecordPath(filePath: string) {
    return `${filePath}.sha256`;
}

/**
 * Path of the record holding the SHA-256 of the file a WSL distribution was registered from.
 */
async function getRegistrationRecordPath(environment: Environment, releaseTag: SemVer) {
    return path.join(getWslDistributionRoot(), await getImageName(environment, releaseTag), 'source.sha256');
}

/**
 * Versions up to 1.0.1-rc.3 downloaded the pipeline file to the temp folder. Move such a file to the download folder,
 * where it is verified before it is used.
 */
function moveLegacyDownload(expectedPath: string) {
    const legacyPath = path.join(app.getPath('temp'), path.basename(expectedPath));
    if (!fs.existsSync(legacyPath) || fs.existsSync(expectedPath)) {
        return;
    }
    try {
        fs.mkdirSync(path.dirname(expectedPath), {recursive: true});
        fs.copyFileSync(legacyPath, expectedPath);  // the folders may be on different drives
        fs.rmSync(legacyPath, {force: true});
        logToDevTools(`Moved ${legacyPath} to ${expectedPath}`);
    } catch (error) {
        logToDevTools(`Could not move ${legacyPath}: ${error}`, 'warn');
        removeFile(expectedPath);
    }
}

async function getDistributionInstallLocation(environment: Environment, releaseTag: SemVer) {
    // outside the installation folder, which Squirrel deletes when the application is installed again
    const installDir = path.join(getWslDistributionRoot(), await getImageName(environment, releaseTag));

    // make sure the path exists
    if (!fs.existsSync(installDir)) {
        fs.mkdirSync(installDir, {recursive: true});
    }
    logToDevTools(`Distribution will be installed to ${installDir}`);

    return installDir;
}

/**
 * Delete all downloaded pipeline files of an environment, with their checksum records and unfinished downloads.
 * Also removes files that versions up to 1.0.1-rc.3 left in the temp folder.
 * @returns The number of pipeline files deleted.
 */
export async function deleteAllDistributionTarFiles(environment: Environment): Promise<number> {
    const prefix = `${getWslBaseName(environment)}_`;
    let count = 0;
    for (const directory of [getPipelineDownloadRoot(), app.getPath('temp')]) {
        if (!fs.existsSync(directory)) {
            continue;
        }
        for (const file of fs.readdirSync(directory)) {
            if (file.startsWith(prefix) && /\.tar\.gz(\.tmp|\.sha256)?$/.test(file)) {
                fs.unlinkSync(path.join(directory, file));
                logToDevTools(`Deleted cached file: ${file}`);
                if (file.endsWith('.tar.gz')) {
                    count++;
                }
            }
        }
    }
    return count;
}

export async function deleteTar(image: IImage) {
    const semVer = semVerFromGitHubTag(`v${image.tag}`);
    const tarPath = await getExpectedDistributionTarPath(Environment.TACTIC, semVer);
    removeFile(tarPath);
    removeFile(getDownloadRecordPath(tarPath));
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


function runWslImport(distributionName: string, installLocation: string, tarBallPath: string): Promise<void> {
    // the dependency I used before for WSL imports used the shell to run the import
    // this caused issues with paths containing tildes
    return new Promise((resolve, reject) => {
        const proc = child_process.spawn(
            "wsl.exe",
            ["--import", distributionName, installLocation, tarBallPath],
            { shell: false, windowsHide: true }
        );

        proc.stdout?.on("data", (buf: Buffer) => {
            // eslint-disable-next-line no-control-regex
            const msg = buf.toString("utf8").replace(/\x00/g, "");
            logToDevTools(msg);
        });
        proc.stderr?.on("data", (buf: Buffer) => {
            // eslint-disable-next-line no-control-regex
            const msg = buf.toString("utf8").replace(/\x00/g, "");
            logToDevTools(msg);
        });

        proc.on("error", reject);
        proc.on("close", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`wsl --import exited with code ${code}`));
        });
    });
}

/**
 * Register the WSL distribution from a verified pipeline file and record the file's SHA-256 with it.
 */
async function registerWslDistribution(environment: Environment, releaseTag: SemVer, tarBall: string, digest: string) {
    const installLocation = await getDistributionInstallLocation(environment, releaseTag);
    const distributionName = await getImageName(environment, releaseTag);
    logToDevTools(`Importing distribution ${distributionName} from ${tarBall} to ${installLocation}`);
    updateProgress({
        step: `Initializing ${environment} environment`,
        message: `Registering ${environment} WSL distribution v${getVersionString(releaseTag)}`,
        state: "running",
    });
    try {
        await runWslImport(distributionName, installLocation, tarBall);
    } catch (error) {
        logToDevTools(`WSL import failed for ${distributionName}: ${error}. Cleaning up install directory.`);
        removeDirectory(installLocation);
        throw error;
    }
    writeDigestRecord(await getRegistrationRecordPath(environment, releaseTag), digest, path.basename(tarBall));
}

/**
 * Unregister a WSL distribution and delete its folder, e.g., because it was not registered from the expected file.
 */
async function unregisterWslDistribution(environment: Environment, releaseTag: SemVer) {
    const distribution = await getImageName(environment, releaseTag);
    logToDevTools(`Unregistering WSL distribution ${distribution}`);
    updateProgress({
        step: `Initializing ${environment} environment`,
        message: `Removing unverified WSL distribution v${getVersionString(releaseTag)}`,
        state: "running",
    });
    await runSubprocess(WSL.command, ["--terminate", distribution]);
    await runSubprocess(WSL.command, ["--unregister", distribution]);
    if ((await listWslDistributions(environment)).includes(distribution)) {
        throw new Error(`Could not unregister the WSL distribution ${distribution}.`);
    }
    removeDirectory(path.join(getWslDistributionRoot(), distribution));
}

/**
 * Make sure the registered WSL distribution of the version comes from the file GitHub publishes for the release,
 * by comparing SHA-256 checksums. Downloads, registers or replaces the distribution as needed.
 */
async function prepareVerifiedWslDistribution(environment: Environment, releaseTag: SemVer) {
    const step = `Initializing ${environment} environment`;
    const version = getVersionString(releaseTag);
    const distribution = await getImageName(environment, releaseTag);
    const filePath = await getExpectedDistributionTarPath(environment, releaseTag);
    moveLegacyDownload(filePath);

    updateProgress({step, message: `Checking TACTIC pipeline v${version}`, state: "running"});
    let asset: IImageReleaseAsset | null = null;
    try {
        asset = await getImageReleaseAsset(environment, releaseTag);
    } catch (error) {
        if (!(error instanceof ReleaseUnreachableError)) {
            throw error;
        }
        logToDevTools(`Could not reach GitHub to verify pipeline v${version}: ${error.message}`, 'warn');
    }

    const registered = (await listWslDistributions(environment)).includes(distribution);
    const fileDigest = fs.existsSync(filePath) ? await hashPipelineFile(environment, filePath) : null;
    const decision = decidePipelineFileAction({
        expectedDigest: asset?.digest ?? null,
        registered,
        registrationDigest: readDigestRecord(await getRegistrationRecordPath(environment, releaseTag)),
        fileDigest,
        downloadDigest: readDigestRecord(getDownloadRecordPath(filePath)),
    }, version);
    logToDevTools(`Pipeline v${version}: registered ${registered}, file ${fileDigest ?? 'missing'}, ` +
        `expected ${asset?.digest ?? 'unknown (offline)'}: ${decision.action}`);

    switch (decision.action) {
        case 'use':
            if (decision.devWarning) {
                logToDevTools(decision.devWarning, 'warn');
            }
            if (decision.warning) {
                logToDevTools(decision.warning, 'warn');
                logToSection(LogSection.PREPARE_BACKEND, `Warning: ${decision.warning}`);
            }
            logToDevTools(`WSL distribution ${distribution} is registered and verified.`);
            return;
        case 'register':
            await registerWslDistribution(environment, releaseTag, filePath, fileDigest!);
            return;
        case 'download':
            removeFile(filePath);
            removeFile(getDownloadRecordPath(filePath));
            await downloadVerifiedPipelineFile(environment, releaseTag, asset!, filePath);
            await registerWslDistribution(environment, releaseTag, filePath, asset!.digest);
            return;
        case 'reregister':
            logToDevTools(`WSL distribution ${distribution} was not registered from the expected file; replacing it`, 'warn');
            await unregisterWslDistribution(environment, releaseTag);
            if (!decision.reuseFile) {
                removeFile(filePath);
                removeFile(getDownloadRecordPath(filePath));
                await downloadVerifiedPipelineFile(environment, releaseTag, asset!, filePath);
            }
            await registerWslDistribution(environment, releaseTag, filePath, asset!.digest);
            return;
        case 'fail':
            throw new Error(decision.error);
    }
}

/**
 * Get the name of the image excluding the version tag.
 */
/**
 * Prefix of the names of the WSL distributions of the environment.
 */
function getWslBaseName(environment: Environment) {
    const repo = getRepository(environment);
    return `${repo.owner}.${repo.repo}`;
}

async function getImageBaseName(environment: Environment) {
    const backend = await getBackend();
    const repo = getRepository(environment);
    switch (backend.type) {
        case DOCKER.type:
            return `${CONTAINER_REGISTRY}/${repo.owner}/${repo.repo}`;
        case WSL.type:
            return getWslBaseName(environment);
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
    await ensureWslDistributionsMigrated();
    const distribution = await getImageName(environment, releaseTag);
    // download, register or replace the distribution, so that it comes from the file of the release
    await prepareVerifiedWslDistribution(environment, releaseTag);

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
            const imageExists = images.some((imageInfo) => {
                // untagged images have no RepoTags
                return imageInfo.RepoTags?.includes(image) ?? false;
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
                await docker.pull(image).then((stream: NodeJS.ReadableStream) => {
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

const STOP_TIMEOUT_MS = 30 * 1000;  // how long to wait for the pipeline to stop
// set when the pipeline is stopped on request, so that the interrupted run is not reported as failed
let terminationRequested = false;

/**
 * Stop the pipeline. Resolves only once it is verified that nothing of it is running anymore.
 * @throws Error if the pipeline could not be stopped
 */
export async function terminateBackend(environment: Environment) {
    terminationRequested = true;
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
            await terminateWslBackend(environment);
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

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Names of the running WSL distributions of the environment. Uses the quiet listing, which only holds the names,
 * as the state shown by the verbose listing is translated to the language of Windows.
 */
async function listWslDistributions(environment: Environment, {running = false} = {}): Promise<string[]> {
    const baseName = getWslBaseName(environment);
    let output = "";
    // exits with a non-zero code if no distribution is registered or running
    await runSubprocess(WSL.command, ["--list", ...(running ? ["--running"] : []), "--quiet"], (msg, isStderr) => {
        if (!isStderr) {
            output += msg;
        }
    });
    // remove null bytes as WSL likes to output them
    // eslint-disable-next-line no-control-regex
    return output.replace(/\x00/g, "").split(/\r?\n/).map((line) => line.trim())
        .filter((name) => name.startsWith(baseName));
}

function listRunningWslDistributions(environment: Environment): Promise<string[]> {
    return listWslDistributions(environment, {running: true});
}

function removeDirectory(directory: string) {
    try {
        fs.rmSync(directory, {recursive: true, force: true});
    } catch (error) {
        logToDevTools(`Could not remove ${directory}: ${error}`, 'warn');
    }
}

/**
 * Move the WSL distributions out of the folder where versions up to 1.0.1-rc.1 stored them: the installation folder
 * of Squirrel, which Squirrel deletes when the application is installed again. That failed on the locked disk of a
 * running distribution, or would have deleted the disk of a registered distribution.
 * A distribution is moved with `wsl --manage --move`; if this WSL version cannot move it, it is unregistered and
 * imported again when it is needed.
 */
async function migrateWslDistributions(environment: Environment) {
    const legacyRoot = getLegacyWslDistributionRoot();
    if (legacyRoot === null || !fs.existsSync(legacyRoot)) {
        return;
    }
    const registered = await listWslDistributions(environment);
    for (const distribution of fs.readdirSync(legacyRoot)) {
        const legacyLocation = path.join(legacyRoot, distribution);
        if (registered.includes(distribution)) {
            const newLocation = path.join(getWslDistributionRoot(), distribution);
            fs.mkdirSync(newLocation, {recursive: true});
            await runSubprocess(WSL.command, ["--terminate", distribution]);
            const moved = await runSubprocess(WSL.command, ["--manage", distribution, "--move", newLocation]);
            if (moved === 0) {
                logToDevTools(`Moved WSL distribution ${distribution} to ${newLocation}`);
            } else {
                logToDevTools(`Could not move WSL distribution ${distribution} (exit code ${moved}); unregistering it`, 'warn');
                await runSubprocess(WSL.command, ["--unregister", distribution]);
                removeDirectory(newLocation);
            }
        }
        removeDirectory(legacyLocation);
    }
    if (fs.readdirSync(legacyRoot).length === 0) {
        removeDirectory(legacyRoot);
    }
}

let wslMigration: Promise<void> | null = null;

/**
 * Make sure the WSL distributions are migrated out of the installation folder. Runs once per start of the application.
 */
export function ensureWslDistributionsMigrated(): Promise<void> {
    if (wslMigration === null) {
        wslMigration = migrateWslDistributions(Environment.TACTIC).catch((error) => {
            logToDevTools(`Could not migrate the WSL distributions: ${error}`, 'warn');
        });
    }
    return wslMigration;
}

/**
 * Unregister all WSL distributions of the environment and delete the folder with their disks, e.g., on uninstall.
 * Does not depend on the selected backend, as distributions may remain from when WSL was selected.
 */
export async function removeWslDistributions(environment: Environment) {
    for (const distribution of await listWslDistributions(environment)) {
        logToDevTools(`Unregistering WSL distribution ${distribution}`);
        await runSubprocess(WSL.command, ["--unregister", distribution]);
    }
    removeDirectory(getWslDistributionRoot());
    removeDirectory(getPipelineDownloadRoot());
}

/**
 * Stop the pipeline in WSL. Killing the wsl.exe process that started the pipeline does not reliably stop the
 * processes inside the distribution, so the distributions of the application are terminated, which stops all of them.
 */
async function terminateWslBackend(environment: Environment) {
    for (const distribution of await listRunningWslDistributions(environment)) {
        logToDevTools(`Terminating WSL distribution ${distribution}`);
        const code = await runSubprocess(WSL.command, ["--terminate", distribution]);
        if (code !== 0) {
            logToDevTools(`wsl --terminate ${distribution} exited with code ${code}`, 'warn');
        }
    }
    // the wsl.exe processes end with their distribution; kill any that are left
    for (const childProcess of runningWslMainProcesses) {
        logToDevTools(`Killing process ${childProcess.pid}`);
        childProcess.kill();
    }

    // verify that nothing is running anymore
    const deadline = Date.now() + STOP_TIMEOUT_MS;
    let running = await listRunningWslDistributions(environment);
    while (running.length > 0 || runningWslMainProcesses.size > 0) {
        if (Date.now() > deadline) {
            const left = running.length > 0 ? running.join(', ') : 'wsl.exe';
            throw new Error(`The pipeline did not stop within ${STOP_TIMEOUT_MS / 1000} seconds (still running: ${left}).`);
        }
        await sleep(1000);
        running = await listRunningWslDistributions(environment);
    }
    logToDevTools("Pipeline stopped: no WSL distribution of the application is running");
}

/**
 * Whether the container is running; false if it was removed.
 */
async function isContainerRunning(container: Dockerode.Container) {
    try {
        return (await container.inspect()).State.Running;
    } catch (error) {
        if ((error as { statusCode?: number }).statusCode === 404) {
            return false;  // removed, as containers are started with AutoRemove
        }
        throw error;
    }
}

/**
 * Stop the pipeline in Docker and verify that its containers are not running anymore.
 */
async function terminateDockerBackend() {
    await Promise.all(Array.from(runningContainers).map(async (containerId) => {
        const container = docker.getContainer(containerId);
        logToDevTools(`Stopping container ${containerId}`);
        try {
            await container.stop({t: 10});  // SIGTERM, and SIGKILL after 10 seconds
        } catch {
            // already stopped or removed, or stopping failed: kill to make sure
            await container.kill().catch(() => undefined);
        }
        const deadline = Date.now() + STOP_TIMEOUT_MS;
        while (await isContainerRunning(container)) {
            if (Date.now() > deadline) {
                throw new Error(`The pipeline did not stop within ${STOP_TIMEOUT_MS / 1000} seconds (container ${containerId}).`);
            }
            await sleep(1000);
        }
        logToDevTools(`Pipeline stopped: container ${containerId} is not running`);
    }));
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
    releaseSelections.delete(environment);  // select again with the new strategy
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
 * Get the newest installed image of the environment that is compatible, or null if there is none.
 */
/**
 * Get the installed images of the environment that are compatible, which can be used without internet access.
 */
async function getInstalledCompatibleReleaseTags(environment: Environment): Promise<SemVer[]> {
    let images: IImage[];
    try {
        images = await getAssociatedImages(environment);
    } catch (error) {
        logToDevTools(`Could not list installed images: ${error}`, 'warn');
        return [];
    }
    const installedTags = images.flatMap((image) => {
        try {
            return [new SemVer(image.tag)];
        } catch {
            return [];  // e.g., an image tagged "latest"
        }
    });
    return getMatchingVersions(installedTags, getAllowedRange(environment));
}

/**
 * Get the versions of the installed compatible images, sorted from oldest to newest.
 */
export async function getInstalledReleaseTagStrings(environment: Environment): Promise<string[]> {
    const tags = await getInstalledCompatibleReleaseTags(environment);
    tags.sort((a, b) => a.compare(b));
    return [...new Set(tags.map((tag) => getVersionString(tag)))];
}

/**
 * Get the newest installed image of the environment that is compatible, or null if there is none.
 */
async function getLatestInstalledCompatibleReleaseTag(environment: Environment): Promise<SemVer | null> {
    return getLatestVersion(await getInstalledCompatibleReleaseTags(environment)) ?? null;
}

/**
 * Get the version to use: the fixed version from storage, or else the latest compatible release on GitHub.
 * If GitHub cannot be queried, the newest compatible installed version is used, and a warning explains why.
 */
async function resolveReleaseTag(environment: Environment): Promise<{ releaseTag: SemVer, warning: string | null }> {
    const fixedTag = getImageTag(environment);
    if (fixedTag !== null) {
        logToDevTools(`Expecting image version: ${getVersionString(fixedTag)}`);
        return {releaseTag: fixedTag, warning: null};
    }
    logToDevTools("No image version specified in storage, querying GitHub for latest version");
    try {
        const releaseTag = await getLatestCompatibleImageReleaseTag(environment);
        logToDevTools(`Latest compatible version: ${getVersionString(releaseTag)}`);
        return {releaseTag, warning: null};
    } catch (error) {
        const installedTag = await getLatestInstalledCompatibleReleaseTag(environment);
        if (installedTag === null) {
            throw error;
        }
        const reason = error instanceof Error ? error.message : String(error);
        return {
            releaseTag: installedTag,
            warning: `Could not check for newer pipeline versions (${reason}). ` +
                `Using the installed version v${getVersionString(installedTag)}.`,
        };
    }
}

export interface IReleaseSelection {
    releaseTag: SemVer;
    warning: string | null;  // set if the latest version could not be checked and an installed version is used
}

// the version selected for each environment; shared by all steps until the selection is made again
const releaseSelections = new Map<Environment, Promise<IReleaseSelection>>();

/**
 * Check again which version of the environment to use, asking GitHub afresh, e.g., when the user starts the wizard.
 * The selection is then used by all later steps, so that discovery, initialization and the run use the same version.
 */
export function selectReleaseTag(environment: Environment): Promise<IReleaseSelection> {
    releaseCache.delete(environment);
    const selection = resolveReleaseTag(environment);
    releaseSelections.set(environment, selection);
    selection.then(({releaseTag, warning}) => {
        logToDevTools(`Selected ${environment} version v${getVersionString(releaseTag)}`);
        if (warning) {
            logToDevTools(warning, 'warn');
        }
    }, (error) => {
        // forget a failed selection, so that the next step tries again
        if (releaseSelections.get(environment) === selection) {
            releaseSelections.delete(environment);
        }
        logToDevTools(`Could not select a ${environment} version: ${error}`, 'error');
    });
    return selection;
}

function getReleaseSelection(environment: Environment): Promise<IReleaseSelection> {
    return releaseSelections.get(environment) ?? selectReleaseTag(environment);
}

/**
 * Get the selected version: the fixed version from storage or the latest compatible version.
 */
export async function getImageTagOrLatestCompatible(environment: Environment) {
    return (await getReleaseSelection(environment)).releaseTag;
}

/**
 * Prepare the backend by downloading and registering the image if necessary.
 */
export async function initializeBackend(environment: Environment) {
    const step = `Initializing ${environment} environment`;
    updateProgress({step, message: step, state: "running"});
    try {
        // get the version of the image
        const {releaseTag, warning} = await getReleaseSelection(environment);
        if (warning) {
            logToDevTools(warning, 'warn');
            logToSection(LogSection.PREPARE_BACKEND, `Warning: ${warning}`);
        }
        // this will download and register the image if necessary
        const backend = await getBackend();
        switch (backend.type) {
            case DOCKER.type:
                logToDevTools(`Initializing Docker backend`);
                await initializeDockerBackend(environment, releaseTag);
                updateProgress({step, message: "Finished initializing Docker backend", state: "done"});
                break;
            case WSL.type:
                logToDevTools(`Initializing WSL backend`);
                await initializeWslBackend(environment, releaseTag);
                break;
            default:
                throw new Error(`Backend ${backend.type} not supported`);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logToDevTools(`${step} failed: ${message}`, 'error');
        logToSection(LogSection.PREPARE_BACKEND, `${step} failed: ${message}`);
        updateProgress({step, message: `Failed: ${message}`, state: "error"});
        throw error;
    }
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
    return new Promise<IImage[]>((resolve, reject) => {
        getImageBaseName(environment).then((baseName) => {
            // filter for images where the name starts with the base name
            docker.listImages().then(async (images: Dockerode.ImageInfo[]) => {
                const associatedImages = images.filter((imageInfo: { RepoTags?: string[] }) => {
                    return imageInfo.RepoTags ? imageInfo.RepoTags.some((imageName: string) => {
                        return imageName.startsWith(baseName);
                    }) : false;
                });
                // convert to IImage using the first tag
                const ret = [];
                for (const imageInfo of associatedImages) {
                    const imageName = imageInfo.RepoTags?.[0];
                    if (!imageName) continue;
                    const image: IImage = await getNameAndTagFromImageName(imageName);
                    ret.push(image);
                    console.debug(`Found associated image: ${JSON.stringify(image)}`);
                }
                resolve(ret);
            }).catch(reject);
        }).catch(reject);
    });
}

/**
 * Identify images associated with the application at the WSL backend.
 */
async function getAssociatedImagesWsl(environment: Environment): Promise<IImage[]> {
    await ensureWslDistributionsMigrated();
    return new Promise<IImage[]>((resolve, reject) => {
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
            }).catch(reject);
        }).catch(reject);
    });
}

/**
 * Delete a given image from the backend.
 * Optionally also delete the cached tarball (WSL only).
 * @param name Name of the image excluding the version tag.
 * @param tag Version tag of the image.
 * @param deleteCache Whether to delete the cached tarball; no effect for Docker Backend.
 */
export async function deleteImage(name: string, tag: string, deleteCache: boolean = true) {
    const image: IImage = {name, tag};
    const backend = await getBackend();
    switch (backend.type) {
        case DOCKER.type:
            return await deleteImageDocker(image);
        case WSL.type:
            await deleteImageWsl(image);
            if (deleteCache) {
                logToDevTools(`Deleting cached tarball for WSL distribution ${image.name}:v${image.tag}`);
                await deleteTar(image);
            }
            return;
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
        }).catch((error: Error) => {
            logToDevTools(`Error deleting WSL distribution ${distroName}: ${error}`);
            // somehow this fails even if the distribution is deleted
        }).finally(() => {
            // also remove the folder with the record of the file it was registered from
            removeDirectory(path.join(getWslDistributionRoot(), distroName));
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
 * TacticRun a command using the backend.
 * @param environment The environment for which to run the command.
 * @param entrypoint The entrypoint to run (automatically done for Docker).
 * @param options Options may include bind mounts.
 * @param argumentList The argument list to run as an array of strings.
 */
export async function run(
    environment: Environment,
    entrypoint: string,
    options: IRunOptions = {binds: []},
    argumentList: string[]
) {
    terminationRequested = false;
    const backend = await getBackend();
    let statusCode: number;
    switch (backend.type) {
        case DOCKER.type:
            statusCode = await runWithDocker(environment, entrypoint, argumentList, options);
            break;
        case WSL.type:
            statusCode = await runWithWsl(environment, entrypoint, argumentList, options);
            break;
        default:
            throw new Error(`Backend ${backend.type} not supported`);
    }
    // report a run stopped on request like one ended by SIGTERM, so that it is shown as terminated, not as failed
    return terminationRequested ? 143 : statusCode;
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
 * TacticRun a command using Docker as the backend.
 * @param environment The environment for which to run the command.
 * @param entrypoint The entrypoint to run.
 * @param argumentList The command to run as an array of strings.
 * @param options Options may include bind mounts.
 */
async function runWithDocker(
    environment: Environment, entrypoint: string, argumentList: string[], options: IRunOptions) {
    console.log(`Running command with Docker: ${argumentList}`);
    const image = await getImageName(environment, await getImageTagOrLatestCompatible(environment));
    console.log(`Running command ${entrypoint} ${argumentList.join(' ')} at image ${image} with binds ${JSON.stringify(options.binds)}`);
    const container = await docker.createContainer({
        Image: image,
        Entrypoint: [entrypoint],
        Cmd: argumentList,
        HostConfig: {
            AutoRemove: true,
            Binds: getDockerBindFormat(options.binds ?? []),
        },
        Tty: true,  // needed to get clean stdout and stderr
    });
    // start and get the stdout
    await container.start();
    runningContainers.add(container.id);
    container.attach({stream: true, stdout: true, stderr: true}, function (err, stream) {
        if (err || !stream) {
            logToDevTools(`Could not attach to container output: ${err}`, 'warn');
            return;
        }
        // pass on complete lines only: the stream merges lines written shortly after each other into one chunk
        const lines = new LineBuffer((line) => logToSection(LogSection.CONTAINER_STREAM, line));
        stream.on('data', (data: Buffer) => lines.push(data));
        stream.on('end', () => lines.flush());
    });
    const statusCode: { StatusCode: number } = await container.wait();
    runningContainers.delete(container.id);
    return statusCode.StatusCode;
}


/**
 * TacticRun a command using WSL as the backend.
 * @param environment The environment for which to run the command.
 * @param argumentList The command to run as an array of strings.
 * @param options Options may include bind mounts.
 */
async function runWithWsl(
    environment: Environment, entrypoint: string, argumentList: string[], options: IRunOptions
) {
    const backend = await getBackend();
    console.log(`Running command with WSL: ${argumentList}`);
    const distribution = await getImageName(environment, await getImageTagOrLatestCompatible(environment));

    // run command to make bind mounts
    logToSection(LogSection.PREPARE_ENVIRONMENT, `Running setup (bind mounts)`);
    for (const bind of (options.binds ?? [])) {
        const source = windowsToWsl(bind.source);
        const target = bind.target;

        console.log(`Preparing mount point ${target}`);
        logToSection(LogSection.PREPARE_ENVIRONMENT, `Preparing mount point ${target}`);
        logToSection(LogSection.PREPARE_ENVIRONMENT, "Clearing previous mounts...");
        await runSubprocess(backend.command, ["--distribution", distribution, "--", "umount", target], (msg) => {
            logToDevTools(msg);
        });  // might return non-zero if the mount point is not used

        if (fs.lstatSync(bind.source).isDirectory()) {
            logToSection(LogSection.PREPARE_ENVIRONMENT, "Ensuring mount point exists...");
            const mkdirProc = await runSubprocess(backend.command, ["--distribution", distribution, "--", "mkdir", "-p", target], (msg) => {
                logToDevTools(msg);
            }); // flag -p creates parent directories if necessary and ignores errors if the directory already exists
            if (mkdirProc !== 0) {
                throw new Error(`Failed to create directory ${target}`);
            }
        } else {
            // create parent directory if necessary
            logToSection(LogSection.PREPARE_ENVIRONMENT, "Ensuring mount point parent exists...");
            const parent = path.dirname(target);
            const mkdirProcNeeded = await runSubprocess(backend.command, ["--distribution", distribution, "--", "mkdir", "-p", parent], (msg) => {
                logToDevTools(msg);
            }); // flag -p creates parent directories if necessary and ignores errors if the directory already exists
            if (mkdirProcNeeded !== 0) {
                throw new Error(`Failed to create directory ${parent}`);
            }
            // touch file
            logToSection(LogSection.PREPARE_ENVIRONMENT, "Ensuring mount point file exists...");
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
        logToSection(LogSection.PREPARE_ENVIRONMENT, `Remounting drive ${driveIdentifier} to ${driveMountPath}...`);
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
        logToSection(LogSection.PREPARE_ENVIRONMENT, `Bind mounting ${source} to ${target}`);
        const exitCode = await runSubprocess(backend.command, ["--distribution", distribution, "--", "mount", "--bind", source, target], (msg) => {
            logToDevTools(msg);
        });
        if (exitCode !== 0) {
            throw new Error(`Failed to mount ${source} to ${target}`);
        }
    }

    logToSection(LogSection.PREPARE_ENVIRONMENT, `Running command`);
    runningDistributions.add(distribution);
    const args = ["--distribution", distribution, "--", entrypoint, ...argumentList];
    // pass on complete lines only, separately for stdout and stderr, as chunks do not align with lines
    const stdoutLines = new LineBuffer((line) => logToSection(LogSection.CONTAINER_STREAM, line));
    const stderrLines = new LineBuffer((line) => logToSection(LogSection.CONTAINER_STREAM, line));
    return await runSubprocess(backend.command, args, (msg: string, isStderr: boolean) => {
        (isStderr ? stderrLines : stdoutLines).push(msg);
    }, runningWslMainProcesses).finally(() => {
        stdoutLines.flush();
        stderrLines.flush();
        runningDistributions.delete(distribution);
    });
}
