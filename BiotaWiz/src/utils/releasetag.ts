import semver, {SemVer} from "semver";
import {cmArgs} from "./command-line-arguments";
import {Environment} from "../enums";

// developer setting: offer release candidates (pre-releases) of the pipeline for pinning
let showPrereleases = false;

export function setShowPrereleases(enabled: boolean) {
    showPrereleases = enabled;
}

/**
 * Whether pre-releases of the pipeline are offered: set in the settings or by command line argument.
 */
export function prereleasesShown(): boolean {
    return showPrereleases || cmArgs['allow-prerelease-tags'] === true;
}

export function getVersionString(version: SemVer) {
    return version.format();
}

/**
 * Parse a GitHub tag into a semver object
 * @param tag
 */
export function semVerFromGitHubTag(tag: string): SemVer {
    // matcher defined in https://semver.org/ v2.0.0 but prefixed with v as we expect the GitHub tag to be prefixed with v
    // see https://regex101.com/r/MlEVLu/1
    const match = tag.match(/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/);
    if (!match) {
        throw new Error(`Invalid semantic version tag ${tag}. Tags are expected to be prefixed with v`);
    }
    return new SemVer(tag);
}

/**
 * Get the allowed version range for the given environment.
 * This is set by a command line argument for each environment.
 * The default values can be overridden by setting the arguments and are defined in the CMD module.
 * @param environment
 */
export function getAllowedRange(environment: Environment): string {
    switch (environment) {
        case Environment.TACTIC:
            return cmArgs['pipeline-vrange'];
        default:
            throw new Error(`Unknown environment: ${environment}`);
    }
}

export function getMatchingVersions(tags: SemVer[], allowedRange: string) {
    const range: string | null = semver.validRange(allowedRange);
    console.log(`using range ${range} for given range string ${allowedRange}`);
    if (!range) {
        throw new Error(`Invalid semantic version range ${allowedRange}`);
    }
    return tags.filter((version: SemVer) =>
        semver.satisfies(version, range, {
            includePrerelease: prereleasesShown()
        })
    );
}

/**
 * Return the latest version.
 * @param tags
 */
export function getLatestVersion(tags: SemVer[]) {
    // filter out pre-releases; the setting only offers them for pinning, auto-update keeps using stable releases
    if (!cmArgs['allow-prerelease-tags']) {
        tags = tags.filter(tag => !tag.prerelease.length);
    }
    // sort by descending version
    tags.sort((a, b) => semver.rcompare(a, b));
    console.debug(`Sorted: ${tags.map(getVersionString).join(', ')}`);
    return tags[0];
}

export function isNewerVersion(current: SemVer, latest: SemVer) {
    return semver.gt(latest, current);
}
