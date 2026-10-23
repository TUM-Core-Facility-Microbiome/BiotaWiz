import * as crypto from "crypto";
import * as fs from "fs";

/**
 * Get the SHA-256 from the digest GitHub reports for a release file, e.g., "sha256:1d27…".
 * @returns The digest as lowercase hex, or null if there is none.
 */
export function parseSha256Digest(digest: unknown): string | null {
    if (typeof digest !== 'string') {
        return null;
    }
    const match = digest.trim().match(/^sha256:([A-Fa-f0-9]{64})$/);
    return match ? match[1].toLowerCase() : null;
}

/**
 * Compute the SHA-256 of a file, reading it as a stream.
 * @param onProgress called with the share of the file read so far, from 0 to 1
 */
export function sha256File(filePath: string, onProgress?: (fraction: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
        const size = fs.statSync(filePath).size;
        const hash = crypto.createHash('sha256');
        let read = 0;
        let lastReported = -1;
        fs.createReadStream(filePath)
            .on('data', (chunk: Buffer | string) => {
                hash.update(chunk);
                read += chunk.length;
                const percent = size > 0 ? Math.floor((read * 100) / size) : 100;
                if (onProgress && percent !== lastReported) {
                    lastReported = percent;
                    onProgress(percent / 100);
                }
            })
            .on('error', reject)
            .on('end', () => resolve(hash.digest('hex')));
    });
}

/**
 * Read a digest record: a file holding the SHA-256 of the file it belongs to.
 * @returns The digest, or null if there is no valid record.
 */
export function readDigestRecord(recordPath: string): string | null {
    try {
        const match = fs.readFileSync(recordPath, 'utf8').trim().match(/^([A-Fa-f0-9]{64})\b/);
        return match ? match[1].toLowerCase() : null;
    } catch {
        return null;
    }
}

/**
 * Write a digest record in the format of sha256sum, so it can also be checked by hand.
 */
export function writeDigestRecord(recordPath: string, digest: string, fileName: string) {
    fs.writeFileSync(recordPath, `${digest}  ${fileName}\n`);
}

export interface PipelineFileState {
    expectedDigest: string | null;  // reported by GitHub for the selected version; null if GitHub could not be reached
    registered: boolean;  // a WSL distribution of the selected version is registered
    registrationDigest: string | null;  // record of the file the distribution was registered from
    fileDigest: string | null;  // SHA-256 of the downloaded file; null if there is none
    downloadDigest: string | null;  // record written when the downloaded file was verified against GitHub
}

export type PipelineFileAction =
    | { action: 'use', warning?: string, devWarning?: string }  // use the registered distribution
    | { action: 'register' }  // register from the verified local file
    | { action: 'download' }  // download the file, verify it and register from it
    | { action: 'reregister', reuseFile: boolean }  // unregister, then register from the local file or a new download
    | { action: 'fail', error: string };

/**
 * Decide how to get a verified WSL distribution of the selected version. A distribution is only used if it was
 * registered from a file whose SHA-256 matches the one GitHub reports for the release.
 * If GitHub cannot be reached, the records written when the file was verified are used instead.
 */
export function decidePipelineFileAction(state: PipelineFileState, version: string): PipelineFileAction {
    const {expectedDigest, registered, registrationDigest, fileDigest, downloadDigest} = state;

    if (expectedDigest !== null) {
        const fileMatches = fileDigest === expectedDigest;
        if (registered) {
            // the registration must come from the expected file, and a downloaded file must be the expected one
            if (registrationDigest === expectedDigest && (fileDigest === null || fileMatches)) {
                return {action: 'use'};
            }
            return {action: 'reregister', reuseFile: fileMatches};
        }
        return fileMatches ? {action: 'register'} : {action: 'download'};
    }

    // GitHub cannot be reached: check against the records instead
    if (registered) {
        if (registrationDigest === null) {
            return {
                action: 'use',
                devWarning: `The registered pipeline v${version} has no checksum record and cannot be verified ` +
                    `without internet access. Using it unverified.`,
            };
        }
        if (fileDigest !== null && fileDigest === registrationDigest) {
            return {action: 'use'};
        }
        return {
            action: 'use',
            warning: `Could not verify the installed TACTIC pipeline v${version} against GitHub, ` +
                `as there is no internet access. Using the installed version.`,
        };
    }
    if (fileDigest !== null && fileDigest === downloadDigest) {
        return {action: 'register'};
    }
    return {
        action: 'fail',
        error: `Internet access is needed to download and verify the TACTIC pipeline v${version}.`,
    };
}
