import {app} from 'electron';

import {getLatestVersion, getVersionString, isNewerVersion, semVerFromGitHubTag} from "./releasetag";
import {SemVer} from "semver";
import {GITHUB_REPO} from "../config";
import {logToDevTools} from "./logHandler";

function newerVersion(tags: string[]) {
    if (tags.length === 0) {
        return null;
    }

    const semverTags: SemVer[] = [];
    tags.forEach(tag => {
        const semverTag = semVerFromGitHubTag(tag);
        semverTags.push(semverTag);
    });
    console.log("SemverTags:", semverTags);

    const currentVersion = new SemVer(app.getVersion());
    const latestVersion = getLatestVersion(semverTags);

    if (isNewerVersion(currentVersion, latestVersion)) {
        logToDevTools(`New version available: ${latestVersion}`);
        return getVersionString(latestVersion);
    }
    return null;
}

export async function checkForUpdates() {
    return new Promise<string>( (resolve, reject) => {
        logToDevTools('Checking for updates');
        fetch(`https://api.github.com/repos/${GITHUB_REPO}/tags`).then(response => {
            if (!response.ok) {
                reject(new Error(`GitHub API returned HTTP ${response.status}`));
                return;
            }
            response.json().then((tags: { name: string }[]) => {
                console.log(tags);
                const tagNames: string[] = tags.map((tag: { name: string }) => tag.name);
                console.log("Tag Names:", tagNames);
                const latestVersion: string | null = newerVersion(tagNames);
                if (latestVersion !== null) {
                    resolve(`v${latestVersion}`);
                } else {
                    reject('No new version available');
                }
            }).catch((error: Error) => {
                reject(error);
            });
        }).catch((error: Error) => {
            reject(error);
        });
    });
}
