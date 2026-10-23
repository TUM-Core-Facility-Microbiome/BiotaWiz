import * as crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as zlib from "zlib";
import {EventEmitter} from "events";
import {SemVer} from "semver";

// simulate Windows with the WSL backend: backend.ts pulls in Electron, the settings storage and WSL
let mockTemp = os.tmpdir();
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
}));
const mockRunSubprocess = jest.fn();
jest.mock('../../../src/utils/process', () => ({
    runSubprocess: (...args: unknown[]) => mockRunSubprocess(...args),
}));
const mockSpawn = jest.fn();
jest.mock('node:child_process', () => ({
    ...jest.requireActual('node:child_process'),
    spawn: (...args: unknown[]) => mockSpawn(...args),
}));
jest.mock('@endevr-io/wsl-api', () => ({
    __esModule: true,
    default: {
        listVerbose: async () => [{name: 'mpourjam.tactic-pipeline_1.0.0', version: 2, state: 'Running', default: false}],
        setVersion: async () => undefined,
        runDistribution: async () => undefined,
        waitForRunning: async () => undefined,
    },
}));

import {initializeWslBackend} from "../../../src/utils/backend";
import {Environment} from "../../../src/enums";

const DISTRIBUTION = 'mpourjam.tactic-pipeline_1.0.0';
const RELEASE = new SemVer('1.0.0');
const GOOD_FILE = zlib.gzipSync('the pipeline image');
const BAD_FILE = zlib.gzipSync('a different image');
const sha256 = (data: Buffer) => crypto.createHash('sha256').update(data).digest('hex');

let localAppData: string;
let registered: string[];
let githubReachable: boolean;
let downloads: Buffer[];  // what each download of the file returns, in order
let releaseDigest: string | null;

const downloadFolder = () => path.join(localAppData, 'BiotaWiz-Data', 'downloads');
const downloadedFile = () => path.join(downloadFolder(), `${DISTRIBUTION}.tar.gz`);
const registrationRecord = () => path.join(localAppData, 'BiotaWiz-Data', 'wsl-distro', DISTRIBUTION, 'source.sha256');

function placeDownload(data: Buffer, record?: string) {
    fs.mkdirSync(downloadFolder(), {recursive: true});
    fs.writeFileSync(downloadedFile(), data);
    if (record) {
        fs.writeFileSync(`${downloadedFile()}.sha256`, `${record}  ${DISTRIBUTION}.tar.gz\n`);
    }
}

function placeRegistration(record?: string) {
    registered.push(DISTRIBUTION);
    fs.mkdirSync(path.dirname(registrationRecord()), {recursive: true});
    if (record) {
        fs.writeFileSync(registrationRecord(), `${record}  ${DISTRIBUTION}.tar.gz\n`);
    }
}

const imports = () => mockSpawn.mock.calls.filter((call) => call[1][0] === '--import');
const unregisters = () => mockRunSubprocess.mock.calls.filter((call) => call[1][0] === '--unregister');
const fileDownloads = () => (global.fetch as jest.Mock).mock.calls.filter((call) => String(call[0]).includes('/assets/'));

beforeEach(() => {
    localAppData = fs.mkdtempSync(path.join(os.tmpdir(), 'biotawiz-verify-'));
    mockTemp = path.join(localAppData, 'Temp');
    fs.mkdirSync(mockTemp);
    process.env.LOCALAPPDATA = localAppData;
    registered = [];
    githubReachable = true;
    downloads = [GOOD_FILE];
    releaseDigest = `sha256:${sha256(GOOD_FILE)}`;

    global.fetch = jest.fn(async (url: string) => {
        if (!githubReachable) {
            throw new TypeError('fetch failed', {cause: {code: 'ENOTFOUND'}});
        }
        if (url.includes('/releases/tags/')) {
            return new Response(JSON.stringify({assets: [{
                name: 'image.tar.gz', url: 'https://api.github.com/assets/1', size: GOOD_FILE.length, digest: releaseDigest,
            }]}), {status: 200});
        }
        const data = downloads.shift() ?? GOOD_FILE;
        return new Response(new Uint8Array(data), {status: 200, headers: {"content-length": String(data.length)}});
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

    mockSpawn.mockReset().mockImplementation((command: string, args: string[]) => {
        // wsl --import succeeds and registers the distribution
        const proc = Object.assign(new EventEmitter(), {stdout: new EventEmitter(), stderr: new EventEmitter()});
        setImmediate(() => {
            registered.push(args[1]);
            proc.emit('close', 0);
        });
        return proc;
    });
});

afterEach(() => {
    fs.rmSync(localAppData, {recursive: true, force: true});
    delete process.env.LOCALAPPDATA;
});

const initialize = () => initializeWslBackend(Environment.TACTIC, RELEASE);

describe('preparing the WSL distribution with GitHub reachable', () => {
    test('downloads, verifies and registers if nothing is there, and records the checksum', async () => {
        await initialize();
        expect(fileDownloads()).toHaveLength(1);
        expect(imports()).toHaveLength(1);
        expect(imports()[0][1]).toEqual(['--import', DISTRIBUTION, path.dirname(registrationRecord()), downloadedFile()]);
        expect(fs.readFileSync(`${downloadedFile()}.sha256`, 'utf8')).toContain(sha256(GOOD_FILE));
        expect(fs.readFileSync(registrationRecord(), 'utf8')).toContain(sha256(GOOD_FILE));
    });

    test('downloads again once if the checksum does not match', async () => {
        downloads = [BAD_FILE, GOOD_FILE];
        await initialize();
        expect(fileDownloads()).toHaveLength(2);
        expect(fs.readFileSync(downloadedFile())).toEqual(GOOD_FILE);
        expect(imports()).toHaveLength(1);
    });

    test('fails without registering if the checksum does not match twice', async () => {
        downloads = [BAD_FILE, BAD_FILE];
        await expect(initialize()).rejects.toThrow('GitHub reports');
        expect(fs.existsSync(downloadedFile())).toBe(false);
        expect(imports()).toHaveLength(0);
    });

    test('registers a verified downloaded file without downloading it again', async () => {
        placeDownload(GOOD_FILE);
        await initialize();
        expect(fileDownloads()).toHaveLength(0);
        expect(imports()).toHaveLength(1);
    });

    test('uses a registration from the expected file', async () => {
        placeDownload(GOOD_FILE, sha256(GOOD_FILE));
        placeRegistration(sha256(GOOD_FILE));
        await initialize();
        expect(imports()).toHaveLength(0);
        expect(unregisters()).toHaveLength(0);
    });

    test('replaces a registration without a record', async () => {
        placeDownload(GOOD_FILE, sha256(GOOD_FILE));
        placeRegistration();
        await initialize();
        expect(unregisters()).toEqual([[expect.anything(), ['--unregister', DISTRIBUTION]]]);
        expect(fileDownloads()).toHaveLength(0);  // the downloaded file is the expected one
        expect(imports()).toHaveLength(1);
        expect(fs.readFileSync(registrationRecord(), 'utf8')).toContain(sha256(GOOD_FILE));
    });

    test('replaces a registration and the download if the release has a different file', async () => {
        placeDownload(BAD_FILE, sha256(BAD_FILE));
        placeRegistration(sha256(BAD_FILE));
        await initialize();
        expect(unregisters()).toHaveLength(1);
        expect(fileDownloads()).toHaveLength(1);
        expect(fs.readFileSync(downloadedFile())).toEqual(GOOD_FILE);
        expect(imports()).toHaveLength(1);
    });

    test('fails if GitHub reports no checksum for the file', async () => {
        releaseDigest = null;
        await expect(initialize()).rejects.toThrow('GitHub did not provide a checksum');
        expect(imports()).toHaveLength(0);
    });

    test('verifies a file that an older version left in the temp folder', async () => {
        fs.writeFileSync(path.join(mockTemp, `${DISTRIBUTION}.tar.gz`), GOOD_FILE);
        await initialize();
        expect(fileDownloads()).toHaveLength(0);
        expect(fs.existsSync(path.join(mockTemp, `${DISTRIBUTION}.tar.gz`))).toBe(false);
        expect(imports()).toHaveLength(1);
    });
});

describe('preparing the WSL distribution without internet access', () => {
    beforeEach(() => {
        githubReachable = false;
    });

    test('uses a registration without a record, warning only in the console', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        placeRegistration();
        await initialize();
        expect(unregisters()).toHaveLength(0);
        expect(imports()).toHaveLength(0);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('has no checksum record'));
        warn.mockRestore();
    });

    test('registers a downloaded file that matches the record of its verified download', async () => {
        placeDownload(GOOD_FILE, sha256(GOOD_FILE));
        await initialize();
        expect(imports()).toHaveLength(1);
    });

    test('fails if nothing is downloaded', async () => {
        await expect(initialize()).rejects.toThrow('Internet access is needed');
        expect(imports()).toHaveLength(0);
    });
});
