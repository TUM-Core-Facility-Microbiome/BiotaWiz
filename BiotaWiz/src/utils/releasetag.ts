import semver, {SemVer} from "semver";
import {cmArgs} from "./command-line-arguments";
import {Environment} from "../enums";

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
        case Environment.TIC:
            return cmArgs['tic-pipeline-vrange'];
        case Environment.SHINY_RHEA:
            return cmArgs['shiny-rhea-vrange'];
        default:
            throw new Error(`Unknown environment: ${environment}`);
    }
}

export function getMatchingVersions(tags: SemVer[], allowedRange: string) {
    const range: string | null = semver.validRange(allowedRange);
    if (!range) {
        throw new Error(`Invalid semantic version range ${allowedRange}`);
    }
    return tags.filter((version: SemVer) =>
        semver.satisfies(version, range, {
            includePrerelease: cmArgs['allow-prerelease-tags']  // default: false; set by command line argument
        })
    );
}

/**
 * Return the latest version.
 * @param tags
 */
export function getLatestVersion(tags: SemVer[]) {
    // sort by descending version
    tags.sort((a, b) => semver.rcompare(a, b));
    console.debug(`Sorted: ${tags.map(getVersionString).join(', ')}`);
    return tags[0];
}
