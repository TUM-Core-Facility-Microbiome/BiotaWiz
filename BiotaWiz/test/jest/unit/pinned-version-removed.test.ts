import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {SemVer} from "semver";

// simulate Windows with the WSL backend and a pinned pipeline version
let mockTemp = os.tmpdir();
let mockPinned: SemVer | null = null;
const mockDeleteImageTag = jest.fn(async () => {
    mockPinned = null;
});
jest.mock('electron', () => ({
    app: {getPath: () => mockTemp, name: 'BiotaWiz', getName: () => 'BiotaWiz'},
    BrowserWindow: {fromId: () => null},
}));
jest.mock('../../../src/utils/platform', () => ({
    platforms: {WINDOWS: 'WINDOWS', MAC: 'MAC', LINUX: 'LINUX'},
    byOS: (handlers: Record<string, unknown>) => handlers.WINDOWS ?? handlers.default,
    getPlatform: () => 'WINDOWS',
}));
jest.mock('../../../src/utils/storage', () => ({
    getBackend: async () => ({type: 'WSL', name: 'Windows Subsystem for Linux', command: 'wsl', argsPrefix: []}),
    getImageTag: () => mockPinned,
    deleteImageTag: () => mockDeleteImageTag(),
}));
const mockRunSubprocess = jest.fn();
jest.mock('../../../src/utils/process', () => ({
    runSubprocess: (...args: unknown[]) => mockRunSubprocess(...args),
}));

import {clearReleaseCache, selectReleaseTag} from "../../../src/utils/backend";
import {Environment} from "../../../src/enums";

const PINNED = 'mpourjam.tactic-pipeline_1.0.0';
const OTHER = 'mpourjam.tactic-pipeline_0.7.6';

let localAppData: string;
let registered: string[];
let releases: object[] | null;  // null: GitHub cannot be reached
let releaseStatus: number;

const distributionFolder = (name: string) => path.join(localAppData, 'BiotaWiz-Data', 'wsl-distro', name);
const downloadedFile = (name: string) => path.join(localAppData, 'BiotaWiz-Data', 'downloads', `${name}.tar.gz`);

/**
 * Create the distribution, its folder with the record, and the downloaded file with its record.
 */
function install(name: string) {
    registered.push(name);
    fs.mkdirSync(distributionFolder(name), {recursive: true});
    fs.writeFileSync(path.join(distributionFolder(name), 'source.sha256'), 'record');
    fs.mkdirSync(path.dirname(downloadedFile(name)), {recursive: true});
    fs.writeFileSync(downloadedFile(name), 'file');
    fs.writeFileSync(`${downloadedFile(name)}.sha256`, 'record');
}

function isInstalled(name: string) {
    return registered.includes(name) || fs.existsSync(distributionFolder(name)) || fs.existsSync(downloadedFile(name));
}

const release = (tag: string, prerelease = false) => ({tag_name: tag, name: tag, prerelease});
const unregisters = () => mockRunSubprocess.mock.calls.filter((call) => call[1][0] === '--unregister');
const selectedVersion = async () => (await selectReleaseTag(Environment.TACTIC)).releaseTag.format();

beforeEach(() => {
    clearReleaseCache();
    localAppData = fs.mkdtempSync(path.join(os.tmpdir(), 'biotawiz-pinned-'));
    mockTemp = path.join(localAppData, 'Temp');
    fs.mkdirSync(mockTemp);
    process.env.LOCALAPPDATA = localAppData;
    mockPinned = new SemVer('1.0.0');
    mockDeleteImageTag.mockClear();
    registered = [];
    releases = [release('v1.0.1'), release('v1.0.0'), release('v0.7.6')];
    releaseStatus = 200;
    install(PINNED);
    install(OTHER);

    global.fetch = jest.fn(async () => {
        if (releases === null) {
            throw new TypeError('fetch failed', {cause: {code: 'ENOTFOUND'}});
        }
        return {ok: releaseStatus === 200, status: releaseStatus, json: async () => releases};
    }) as jest.Mock;

    mockRunSubprocess.mockReset().mockImplementation(async (command: string, args: string[], logHandler?: (msg: string, isStderr: boolean) => void) => {
        if (args[0] === '--list') {
            logHandler?.(registered.join('\r\n'), false);
            return registered.length > 0 ? 0 : 1;
        }
        if (args[0] === '--unregister') {
            registered = registered.filter((name) => name !== args[1]);
        }
        return 0;
    });
});

afterEach(() => {
    fs.rmSync(localAppData, {recursive: true, force: true});
    delete process.env.LOCALAPPDATA;
});

describe('a pinned version that was removed from GitHub', () => {
    beforeEach(() => {
        releases = [release('v1.0.1'), release('v0.7.6')];
    });

    test('is deleted completely and unpinned, with an explanation', async () => {
        fs.writeFileSync(path.join(mockTemp, `${PINNED}.tar.gz`), 'file left by an older version');
        await expect(selectReleaseTag(Environment.TACTIC)).rejects.toThrow(
            'The pinned TACTIC pipeline version v1.0.0 was removed from GitHub'
        );
        expect(unregisters()).toEqual([[expect.anything(), ['--unregister', PINNED]]]);
        expect(isInstalled(PINNED)).toBe(false);
        expect(fs.existsSync(`${downloadedFile(PINNED)}.sha256`)).toBe(false);
        expect(fs.existsSync(path.join(mockTemp, `${PINNED}.tar.gz`))).toBe(false);
        expect(mockDeleteImageTag).toHaveBeenCalledTimes(1);
    });

    test('leaves other versions alone', async () => {
        await expect(selectReleaseTag(Environment.TACTIC)).rejects.toThrow('removed from GitHub');
        expect(isInstalled(OTHER)).toBe(true);
    });

    test('lets the next selection use the latest version', async () => {
        await expect(selectReleaseTag(Environment.TACTIC)).rejects.toThrow('removed from GitHub');
        expect(await selectedVersion()).toBe('1.0.1');
    });
});

describe('a pinned version is kept', () => {
    test('if it is still on GitHub', async () => {
        expect(await selectedVersion()).toBe('1.0.0');
        expect(isInstalled(PINNED)).toBe(true);
        expect(mockDeleteImageTag).not.toHaveBeenCalled();
    });

    test('if it is a release candidate on GitHub, even when release candidates are not shown', async () => {
        mockPinned = new SemVer('1.0.2-rc.1');
        releases = [release('v1.0.2-rc.1', true), release('v1.0.1')];
        expect(await selectedVersion()).toBe('1.0.2-rc.1');
        expect(unregisters()).toEqual([]);
    });

    test.each([
        ['GitHub cannot be reached', () => { releases = null; }],
        ['GitHub returns an error', () => { releaseStatus = 404; }],
        ['GitHub returns no releases at all', () => { releases = []; }],
    ])('if %s', async (name, setUp) => {
        setUp();
        expect(await selectedVersion()).toBe('1.0.0');
        expect(isInstalled(PINNED)).toBe(true);
        expect(unregisters()).toEqual([]);
        expect(mockDeleteImageTag).not.toHaveBeenCalled();
    });
});
