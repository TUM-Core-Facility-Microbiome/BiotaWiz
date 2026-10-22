import * as fs from "fs";
import * as path from "path";

/**
 * Hosts the pipeline downloads the SILVA database from: the worker for prebuilt databases (DEFAULT_WORKER_URL in the
 * pipeline's silva_remote.py) and the SILVA FTP server it falls back to. Reaching either of them is enough.
 */
export const SILVA_HOST_URLS = [
    "https://silva-downloads-worker.mohsenpm50.workers.dev/",
    "https://ftp.arb-silva.de/",
];

/**
 * Written by the pipeline into SILVA.sidx.success once a SILVA release is verified and indexed.
 * Must match SUCCESS_MARKER in the pipeline's silva_remote.py.
 */
export const SILVA_SUCCESS_MARKER = "d3fa056627656a96abf4006b9f5d928b";

const PROBE_TIMEOUT_SECONDS = 8;

export interface InternetStatus {
    hostOnline: boolean;
    backendOnline: boolean | null;  // null if it could not be checked inside the backend
    localDatabaseVersion: string | null;
}

export interface InternetWarning {
    severity: "warning" | "error";
    title: string;
    detail: string;
}

/**
 * Arguments for wget to check whether a URL is reachable without downloading it.
 */
export function wgetProbeArguments(url: string): string[] {
    return ["wget", "-q", "--spider", "--tries=1", `--timeout=${PROBE_TIMEOUT_SECONDS}`, url];
}

/**
 * Interpret the exit code of wgetProbeArguments.
 * @returns true if the server answered (even with an HTTP error), false if it could not be reached,
 * null if the result says nothing about the network (e.g., wget is missing).
 */
export function wgetExitCodeToReachability(code: number): boolean | null {
    switch (code) {
        case 0:  // success
        case 6:  // authentication failure
        case 8:  // server issued an error response
            return true;
        case 4:  // network failure, including DNS
        case 5:  // TLS verification failure, e.g., behind a proxy that intercepts HTTPS
            return false;
        default:
            return null;
    }
}

/**
 * Combine the results of probing several hosts: online if any host was reached.
 */
export function combineReachability(results: (boolean | null)[]): boolean | null {
    if (results.includes(true)) {
        return true;
    }
    return results.includes(false) ? false : null;
}

/**
 * Check whether this computer reaches any of the URLs. Any HTTP response counts as reachable.
 */
export async function checkHostInternetAccess(urls: string[]): Promise<boolean> {
    const results = await Promise.all(urls.map(async (url) => {
        try {
            await fetch(url, {method: "HEAD", signal: AbortSignal.timeout(PROBE_TIMEOUT_SECONDS * 1000)});
            return true;
        } catch {
            return false;
        }
    }));
    return results.includes(true);
}

function compareVersions(a: string, b: string): number {
    const partsA = a.split(/[._]/).map((part) => parseInt(part, 10) || 0);
    const partsB = b.split(/[._]/).map((part) => parseInt(part, 10) || 0);
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
        const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
        if (diff !== 0) {
            return diff;
        }
    }
    return 0;
}

/**
 * Find the newest SILVA release in the database directory that the pipeline verified and indexed,
 * using the same rule as the pipeline: SILVA/<release>/SILVA.arb exists and SILVA.sidx.success holds the marker.
 * @returns The release, e.g. "138.2", or null if there is none.
 */
export function findLocalSilvaVersion(databaseDirectory: string): string | null {
    const silvaDirectory = path.join(databaseDirectory, "SILVA");
    let releases: string[];
    try {
        releases = fs.readdirSync(silvaDirectory);
    } catch {
        return null;
    }
    const verified = releases.filter((release) => {
        const releaseDirectory = path.join(silvaDirectory, release);
        try {
            return fs.statSync(path.join(releaseDirectory, "SILVA.arb")).isFile()
                && fs.readFileSync(path.join(releaseDirectory, "SILVA.sidx.success"), "utf8").includes(SILVA_SUCCESS_MARKER);
        } catch {
            return false;
        }
    });
    if (verified.length === 0) {
        return null;
    }
    return verified.reduce((newest, release) => compareVersions(release, newest) > 0 ? release : newest);
}

/**
 * Get the warning to show for the internet status, or null if the pipeline can reach the SILVA servers.
 * If it could not be checked inside the backend, the result for this computer is used.
 */
export function describeInternetStatus(status: InternetStatus): InternetWarning | null {
    if (status.backendOnline ?? status.hostOnline) {
        return null;
    }
    // only WSL is checked separately, so the backend being offline while the computer is online is a WSL problem
    const wslOnly = status.hostOnline;
    const title = wslOnly ? "WSL has no internet access, although Windows has." : "No internet connection.";
    const cause = wslOnly ? " This is often caused by a VPN, proxy or firewall that blocks the network of WSL." : "";
    if (status.localDatabaseVersion !== null) {
        return {
            severity: "warning",
            title,
            detail: "Updates of the SILVA database cannot be checked. The pipeline will use the local SILVA database " +
                `version ${status.localDatabaseVersion}.${cause}`,
        };
    }
    return {
        severity: "error",
        title,
        detail: `The pipeline needs internet access to download the SILVA database and will fail without it.${cause}`,
    };
}
