export function getVersionString(version: SemanticVersion) {
    return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Parse a GitHub tag into a semver object
 * @param tag
 */
export function semVerFromGitHubTag(tag: string) {
    const match = tag.match(/^v(\d+)\.(\d+)\.(\d+)$/);
    if (!match) {
        throw new Error(`Invalid tag ${tag}`);
    }
    return {
        major: parseInt(match[1]),
        minor: parseInt(match[2]),
        patch: parseInt(match[3]),
    };
}

/**
 * Check if the given version number matches the number or range.
 * @param versionNumber
 * @param matcher
 */
function matchesLevel(versionNumber: number, matcher: number | NumberRange | null) {
    if (matcher === null) {
        return true;
    }
    if (typeof matcher === 'object') {
        const min = matcher.min;
        const max = matcher.max;
        // check if the version number is in the range
        // bounds can be null, which means an open interval
        if (min !== null && versionNumber < min) {
            return false;
        }
        if (max !== null && versionNumber > max) {
            return false;
        }
        return true;
    } else {
        return versionNumber === matcher;
    }
}

export function getMatchingVersions(versions: SemanticVersion[], matcher: SemanticVersionMatcher) {
    return versions.filter((version) => {
        if (!matchesLevel(version.major, matcher.major)) {
            return false;
        }
        if (!matchesLevel(version.minor, matcher.minor)) {
            return false;
        }
        return matchesLevel(version.patch, matcher.patch);
    });
}

/**
 * Return the latest version matching the given matcher.
 * @param versions
 * @param matcher
 */
export function getLatestMatchingVersion(versions: SemanticVersion[], matcher: SemanticVersionMatcher) {
    const matchingVersions = getMatchingVersions(versions, matcher);
    if (matchingVersions.length === 0) {
        return null;
    }
    console.debug(`Found ${matchingVersions.length} compatible versions: ${matchingVersions.map((version) => `${version.major}.${version.minor}.${version.patch}`).join(', ')}`);

    return matchingVersions.reduce((prev, curr) => {
        if (prev.major > curr.major) {
            return prev;
        }
        if (prev.minor > curr.minor) {
            return prev;
        }
        if (prev.patch > curr.patch) {
            return prev;
        }
        return curr;
    });
}
