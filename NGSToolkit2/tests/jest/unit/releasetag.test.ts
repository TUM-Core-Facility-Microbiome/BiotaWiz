import {SemVer} from "semver";
import {getMatchingVersions} from "../../../src/utils/releasetag";

describe('getMatchingVersions function', () => {
    test('should match release versions of given range', () => {
        const {getMatchingVersions} = require('../../../src/utils/releasetag');

        const shouldMatch = [
            new SemVer('v0.0.1'),
            new SemVer('v0.0.4'),
            new SemVer('v0.1.0'),
            new SemVer('v0.5.91'),
        ];
        const shouldNotMatch = [
            new SemVer('v1.0.5'),
            new SemVer('v2.1.3'),
            new SemVer('v0.0.4-alpha'),  // pre-release tags are not matched when cmArgs['allow-prerelease-tags'] is false
        ];
        const tags = [
            ...shouldMatch,
            ...shouldNotMatch,
        ];
        const allowedRange = '^0.*';
        expect(getMatchingVersions(tags, allowedRange)).toEqual([...shouldMatch]);
    });

    test('should match pre-release versions of given range', () => {
        // Mock the command-line-arguments module only for this test case
        jest.resetModules();
        jest.mock('../../../src/utils/command-line-arguments', () => ({
            cmArgs: {
                'force-tag': '',
                'allow-prerelease-tags': true, // Set allow-prerelease-tags to true for testing this specific test case
            },
        }));

        const {getMatchingVersions} = require('../../../src/utils/releasetag');
        const {SemVer} = require('semver');

        const shouldMatch = [
            new SemVer('v0.0.1'),
            new SemVer('v0.0.4'),
            new SemVer('v0.1.0'),
            new SemVer('v0.5.91'),
            // pre-release tags should be matched when cmArgs['allow-prerelease-tags'] is true
            new SemVer('v0.0.1-alpha'),
            new SemVer('v0.0.4-beta'),
            new SemVer('v0.1.0-alpha'),
            new SemVer('v0.5.91-alpha'),
        ];
        const shouldNotMatch = [
            new SemVer('v1.0.5'),
            new SemVer('v2.1.3'),
        ];
        const tags = [
            ...shouldMatch,
            ...shouldNotMatch,
        ];
        const allowedRange = '^0.*';
        expect(getMatchingVersions(tags, allowedRange)).toEqual([...shouldMatch]);
    });

    test('should throw an error for an invalid range', () => {
        const {getMatchingVersions} = require('../../../src/utils/releasetag');
        const {SemVer} = require('semver');

        const tags = [
            new SemVer('v0.0.1'),
            new SemVer('v0.5.91'),
        ];
        const allowedRange = 'invalid range';
        expect(() => getMatchingVersions(tags, allowedRange)).toThrowError('Invalid semantic version range invalid range');
    });
});

describe('getLatestVersion function', () => {
    test('should return the latest version', () => {
        const {getLatestVersion} = require('../../../src/utils/releasetag');
        const {SemVer} = require('semver');

        const tags = [
            new SemVer('v0.0.1'),
            new SemVer('v0.5.91'), // latest
            new SemVer('v0.0.4'),
            new SemVer('v0.5.90'),
        ];
        expect(getLatestVersion(tags)).toEqual(new SemVer('v0.5.91'));
    });

    test('should return the latest version when there are pre-release tags', () => {
        const {getLatestVersion} = require('../../../src/utils/releasetag');
        const {SemVer} = require('semver');

        const tags = [
            new SemVer('v0.0.1-alpha'),
            new SemVer('v0.5.91'),
            new SemVer('v0.5.92-alpha'),
            new SemVer('v0.5.90'),
        ];
        expect(getLatestVersion(tags)).toEqual(new SemVer('v0.5.92-alpha'));
    });

    test('should return the latest version when there are pre-release tags of the same patch', () => {
        const {getLatestVersion} = require('../../../src/utils/releasetag');
        const {SemVer} = require('semver');

        const tags = [
            new SemVer('v0.5.92'), // latest
            new SemVer('v0.5.92-alpha'),
            new SemVer('v0.5.92-beta'),
        ];
        expect(getLatestVersion(tags)).toEqual(new SemVer('v0.5.92'));
    });
});

describe('semVerFromGitHubTag function', () => {
    test('should return a SemVer object', () => {
        const {semVerFromGitHubTag} = require('../../../src/utils/releasetag');
        const {SemVer} = require('semver');

        expect(semVerFromGitHubTag('v0.5.91')).toEqual(new SemVer('v0.5.91'));
    });

    test('should throw an error for an invalid tag', () => {
        const {semVerFromGitHubTag} = require('../../../src/utils/releasetag');

        // Invalid tag: missing prefix
        expect(() => semVerFromGitHubTag('0.5.91')).toThrowError('Invalid semantic version tag 0.5.91. Tags are expected to be prefixed with v');
    });
});
