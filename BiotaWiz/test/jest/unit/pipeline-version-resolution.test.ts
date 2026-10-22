import * as os from "os";
import {Environment} from "../../../src/enums";
import {clearReleaseCache, getImageTagOrLatestCompatible, selectReleaseTag} from "../../../src/utils/backend";
import {getVersionString} from "../../../src/utils/releasetag";

// backend.ts pulls in Electron and the settings storage, which cannot run outside of Electron
jest.mock('electron', () => ({
    app: {getPath: () => os.tmpdir()},
    BrowserWindow: {fromId: () => null},
}));
// auto-update to the latest version with the Docker backend
jest.mock('../../../src/utils/storage', () => ({
    getImageTag: () => null,
    getBackend: async () => ({type: 'Docker', name: 'Docker', command: 'docker', argsPrefix: []}),
}));
const mockListImages = jest.fn();
jest.mock('../../../src/utils/makeDockerConnection', () => ({docker: {listImages: () => mockListImages()}}));

const IMAGE = 'ghcr.io/mpourjam/tactic-pipeline';

function releases(...tags: string[]) {
    return tags.map((tag) => ({tag_name: tag, name: tag, prerelease: false}));
}

function installedImages(...tags: string[]) {
    return tags.map((tag) => ({RepoTags: [`${IMAGE}:${tag}`]}));
}

async function resolvedVersion() {
    return getVersionString(await getImageTagOrLatestCompatible(Environment.TACTIC));
}

beforeEach(() => {
    clearReleaseCache();
    mockListImages.mockResolvedValue([]);
});

describe('auto-update to the latest pipeline version', () => {
    test('uses the latest compatible release on GitHub', async () => {
        global.fetch = jest.fn().mockResolvedValue({ok: true, status: 200, json: async () => releases('v2.0.0', 'v1.0.0', 'v0.7.6')});
        mockListImages.mockResolvedValue(installedImages('0.7.6'));
        expect(await resolvedVersion()).toBe('1.0.0');
    });

    test('asks GitHub only once for repeated lookups', async () => {
        global.fetch = jest.fn().mockResolvedValue({ok: true, status: 200, json: async () => releases('v1.0.0')});
        await resolvedVersion();
        await resolvedVersion();
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('falls back to the newest compatible installed version when GitHub cannot be reached', async () => {
        global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed', {cause: {code: 'ENOTFOUND'}}));
        mockListImages.mockResolvedValue([
            ...installedImages('0.7.5', '0.7.6', '2.0.0', 'latest'),
            {RepoTags: ['ubuntu:24.04']},  // not an image of the pipeline
        ]);
        expect(await resolvedVersion()).toBe('0.7.6');
    });

    test('falls back to the installed version when no release on GitHub is compatible', async () => {
        global.fetch = jest.fn().mockResolvedValue({ok: true, status: 200, json: async () => releases('v2.0.0')});
        mockListImages.mockResolvedValue(installedImages('1.0.0'));
        expect(await resolvedVersion()).toBe('1.0.0');
    });

    test('fails with the reason when GitHub cannot be reached and nothing is installed', async () => {
        global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed', {cause: {code: 'ENOTFOUND'}}));
        await expect(resolvedVersion()).rejects.toThrow('Could not connect to GitHub (ENOTFOUND)');
    });

    test('fails with the reason when installed images cannot be listed either', async () => {
        global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed', {cause: {code: 'ENOTFOUND'}}));
        mockListImages.mockRejectedValue(new Error('Docker daemon not running'));
        await expect(resolvedVersion()).rejects.toThrow('Could not connect to GitHub (ENOTFOUND)');
    });
});

describe('selecting the pipeline version when the wizard starts', () => {
    function githubOffers(...tags: string[]) {
        global.fetch = jest.fn().mockResolvedValue({ok: true, status: 200, json: async () => releases(...tags)});
    }

    test('asks GitHub afresh, even if the release list was just queried', async () => {
        githubOffers('v1.0.0');
        expect(await resolvedVersion()).toBe('1.0.0');
        githubOffers('v1.0.1', 'v1.0.0');  // a release published since
        expect(getVersionString((await selectReleaseTag(Environment.TACTIC)).releaseTag)).toBe('1.0.1');
    });

    test('is used by all later steps without asking GitHub again', async () => {
        githubOffers('v1.0.0');
        await selectReleaseTag(Environment.TACTIC);
        githubOffers('v1.0.1', 'v1.0.0');
        expect(await resolvedVersion()).toBe('1.0.0');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('reports when an installed version is used instead of the latest', async () => {
        global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed', {cause: {code: 'ENOTFOUND'}}));
        mockListImages.mockResolvedValue(installedImages('0.7.6'));
        const selection = await selectReleaseTag(Environment.TACTIC);
        expect(getVersionString(selection.releaseTag)).toBe('0.7.6');
        expect(selection.warning).toMatch(/^Could not check for newer pipeline versions \(Could not connect to GitHub \(ENOTFOUND\)/);
        expect(selection.warning).toMatch(/Using the installed version v0\.7\.6\.$/);
    });

    test('is tried again by the next step after it failed', async () => {
        global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed'));
        await expect(selectReleaseTag(Environment.TACTIC)).rejects.toThrow('Could not connect to GitHub');
        githubOffers('v1.0.0');
        expect(await resolvedVersion()).toBe('1.0.0');
    });
});
