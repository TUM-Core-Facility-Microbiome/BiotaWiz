import * as os from "os";
import {Environment} from "../../../src/enums";
import {clearReleaseCache, getCompatibleReleaseTagStrings} from "../../../src/utils/backend";

// backend.ts pulls in Electron and the settings storage, which cannot run outside of Electron
jest.mock('electron', () => ({
    app: {getPath: () => os.tmpdir()},
    BrowserWindow: {fromId: () => null},
}));
jest.mock('../../../src/utils/storage', () => ({}));

function release(tag: string, {name = tag, prerelease = false} = {}) {
    return {tag_name: tag, name, prerelease};
}

// the GitHub API returns releases newest first, at most 100 per page
const OLD_RELEASES = Array.from({length: 90}, (_, i) => release(`v0.0.${i + 1}`));
const PAGES = [
    [
        release('v2.0.0'),
        release('v1.10.0'),
        release('v1.9.10'),
        release('v1.9.9'),
        release('v1.2.0'),
        release('v0.8.0'),
        release('v0.7.6'),
        release('v0.7.5-alpha', {prerelease: true}),
        release('v0.7.5'),
        release('v0.7.4', {name: 'TACTIC 0.7.4'}),  // release title differs from the tag
        ...OLD_RELEASES,
    ],
    [
        release('v0.7.3'),
        release('v0.7.2'),
        release('v0.7.2-beta-1', {prerelease: true}),
    ],
];

beforeEach(() => {
    clearReleaseCache();
    global.fetch = jest.fn(async (url: string) => {
        const page = Number(new URL(url).searchParams.get('page'));
        return {ok: true, status: 200, json: async () => PAGES[page - 1] ?? []};
    }) as jest.Mock;
});

describe('getCompatibleReleaseTagStrings', () => {
    test('offers all pipeline versions from v0.7.3 up to v1.9.9, from all pages', async () => {
        expect(PAGES[0]).toHaveLength(100);
        expect(await getCompatibleReleaseTagStrings(Environment.TACTIC)).toEqual(
            ['0.7.3', '0.7.4', '0.7.5', '0.7.6', '0.8.0', '1.2.0', '1.9.9']
        );
        const urls = (global.fetch as jest.Mock).mock.calls.map(call => call[0]);
        expect(urls).toEqual([
            'https://api.github.com/repos/mpourjam/tactic-pipeline/releases?per_page=100&page=1',
            'https://api.github.com/repos/mpourjam/tactic-pipeline/releases?per_page=100&page=2',
        ]);
    });

    test('stops after the last page', async () => {
        PAGES.push([]);  // would be requested if the second page was not recognized as the last
        try {
            await getCompatibleReleaseTagStrings(Environment.TACTIC);
            expect(global.fetch).toHaveBeenCalledTimes(2);
        } finally {
            PAGES.pop();
        }
    });

    test('fails when GitHub returns an error', async () => {
        global.fetch = jest.fn().mockResolvedValue({ok: false, status: 403}) as jest.Mock;
        await expect(getCompatibleReleaseTagStrings(Environment.TACTIC)).rejects.toThrow('HTTP 403');
    });

    test('reports when the GitHub rate limit is reached', async () => {
        const headers = new Map([['x-ratelimit-remaining', '0'], ['x-ratelimit-reset', '1792675200']]);
        global.fetch = jest.fn().mockResolvedValue({ok: false, status: 403, headers}) as jest.Mock;
        await expect(getCompatibleReleaseTagStrings(Environment.TACTIC)).rejects.toThrow(
            /^GitHub API rate limit reached \(HTTP 403\)\. Please try again after /
        );
    });

    test('gives up when GitHub does not respond in time', async () => {
        global.fetch = jest.fn((url: string, init: RequestInit) => {
            expect(init.signal).toBeInstanceOf(AbortSignal);
            return Promise.reject(Object.assign(new Error('aborted'), {name: 'TimeoutError'}));
        }) as jest.Mock;
        await expect(getCompatibleReleaseTagStrings(Environment.TACTIC)).rejects.toThrow(
            'GitHub did not respond within 15 seconds.'
        );
    });

    test('names the cause of network errors', async () => {
        const error = new TypeError('fetch failed', {cause: {code: 'ENOTFOUND'}});
        global.fetch = jest.fn().mockRejectedValue(error) as jest.Mock;
        await expect(getCompatibleReleaseTagStrings(Environment.TACTIC)).rejects.toThrow(
            'Could not connect to GitHub (ENOTFOUND). Please check your internet connection.'
        );
    });
});
