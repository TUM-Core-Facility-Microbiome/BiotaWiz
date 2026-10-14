import {EventEmitter} from "events";

const send = jest.fn();
const showMessageBox = jest.fn();
const openExternal = jest.fn();
const autoUpdater = Object.assign(new EventEmitter(), {
    setFeedURL: jest.fn(),
    checkForUpdates: jest.fn(),
    quitAndInstall: jest.fn(),
});
const app = {
    getVersion: jest.fn(() => '0.1.6'),
    getName: jest.fn(() => 'BiotaWiz'),
    isPackaged: true,
};
const terminateBackend = jest.fn();
const getAutoUpdateCheck = jest.fn(() => true);

jest.mock('electron', () => ({
    app,
    autoUpdater,
    BrowserWindow: {fromId: () => ({webContents: {send}})},
    dialog: {showMessageBox},
    shell: {openExternal},
}));
// avoid loading the real backend and storage modules (WSL, Docker, electron-json-storage)
jest.mock('../../../src/utils/backend', () => ({terminateBackend}));
jest.mock('../../../src/utils/storage', () => ({getAutoUpdateCheck}));
jest.mock('../../../src/utils/logHandler', () => ({logToDevTools: jest.fn()}));
jest.mock('../../../src/utils/command-line-arguments', () => ({cmArgs: {'allow-prerelease-tags': false}}));

const originalPlatform = process.platform;

function setPlatform(platform: string) {
    Object.defineProperty(process, 'platform', {value: platform});
}

function mockLatestRelease(tag: string, ok = true, status = 200) {
    global.fetch = jest.fn().mockResolvedValue({
        ok,
        status,
        json: async () => ({tag_name: tag, html_url: `https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/releases/tag/${tag}`}),
    }) as jest.Mock;
}

type Updater = typeof import('../../../src/utils/updater');

// load a fresh copy of the module so that its state does not leak between tests
function loadUpdater(): Updater {
    let updater!: Updater;
    jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        updater = require('../../../src/utils/updater');
    });
    return updater;
}

beforeEach(() => {
    jest.clearAllMocks();
    autoUpdater.removeAllListeners();
    app.isPackaged = true;
    getAutoUpdateCheck.mockReturnValue(true);
    setPlatform('win32');
});

afterAll(() => {
    setPlatform(originalPlatform);
});

describe('checkForUpdates', () => {
    test('reports a newer release as available', async () => {
        mockLatestRelease('v0.2.0');
        const updater = loadUpdater();
        const state = await updater.checkForUpdates();
        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.github.com/repos/TUM-Core-Facility-Microbiome/BiotaWiz/releases/latest',
            {signal: expect.any(AbortSignal)},
        );
        expect(state).toEqual({
            status: 'available',
            version: '0.2.0',
            releaseUrl: 'https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/releases/tag/v0.2.0',
            canAutoInstall: true,
        });
        expect(send).toHaveBeenLastCalledWith('updateState', state);
    });

    test.each(['v0.1.6', 'v0.1.5'])('reports up-to-date for release %s', async (tag) => {
        mockLatestRelease(tag);
        const updater = loadUpdater();
        expect((await updater.checkForUpdates()).status).toBe('up-to-date');
    });

    test.each([
        [404, 'No published release was found.'],
        [403, 'Too many update checks. Please try again later.'],
        [500, 'GitHub returned an unexpected response (HTTP 500).'],
    ])('reports a readable error for HTTP %s', async (status, message) => {
        mockLatestRelease('v0.2.0', false, status);
        const updater = loadUpdater();
        expect(await updater.checkForUpdates()).toEqual({status: 'error', message});
    });

    test('reports an error for an invalid release tag', async () => {
        mockLatestRelease('0.2.0');
        const updater = loadUpdater();
        expect(await updater.checkForUpdates()).toEqual({status: 'error', message: 'The latest release has an invalid version tag (0.2.0).'});
    });

    test('reports network failures', async () => {
        global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed')) as jest.Mock;
        const updater = loadUpdater();
        expect(await updater.checkForUpdates()).toEqual({status: 'error', message: 'Could not connect to GitHub. Please check your internet connection.'});
    });

    test('gives up when GitHub does not respond in time', async () => {
        const timeout = jest.spyOn(AbortSignal, 'timeout');
        // fetch rejects like this once the timeout signal aborts
        global.fetch = jest.fn().mockRejectedValue(new DOMException('The operation was aborted due to timeout', 'TimeoutError')) as jest.Mock;
        const updater = loadUpdater();
        expect(await updater.checkForUpdates()).toEqual({status: 'error', message: 'The update server did not respond in time. Please try again later.'});
        expect(timeout).toHaveBeenCalledWith(15 * 1000);
        timeout.mockRestore();
    });

    test('shows the error in a dialog when checking manually', async () => {
        mockLatestRelease('v0.2.0', false, 404);
        showMessageBox.mockResolvedValue({response: 0});
        const updater = loadUpdater();
        await updater.checkForUpdates({manual: true});
        expect(showMessageBox.mock.calls[0][1]).toMatchObject({message: 'Could not check for updates.', detail: 'No published release was found.'});
    });

    test('keeps an available update when a background check fails', async () => {
        mockLatestRelease('v0.2.0');
        const updater = loadUpdater();
        const available = await updater.checkForUpdates();
        mockLatestRelease('v0.2.0', false, 500);
        send.mockClear();
        expect(await updater.checkForUpdates()).toEqual(available);
        // the notice is never hidden while checking
        expect(send.mock.calls.map(call => call[1].status)).not.toContain('checking');
    });

    test('reports the error when a manual check fails after an update was found', async () => {
        mockLatestRelease('v0.2.0');
        showMessageBox.mockResolvedValue({response: 0});
        const updater = loadUpdater();
        await updater.checkForUpdates();
        mockLatestRelease('v0.2.0', false, 500);
        expect((await updater.checkForUpdates({manual: true})).status).toBe('error');
    });

    test.each([
        ['linux', true],
        ['win32', false],
    ])('cannot auto-install on %s (packaged: %s)', async (platform, isPackaged) => {
        setPlatform(platform);
        app.isPackaged = isPackaged;
        mockLatestRelease('v0.2.0');
        const updater = loadUpdater();
        const state = await updater.checkForUpdates();
        expect(state).toMatchObject({status: 'available', canAutoInstall: false});
    });

    test('does not notify again about a dismissed version unless checked manually', async () => {
        mockLatestRelease('v0.2.0');
        showMessageBox.mockResolvedValue({response: 1});  // "Later"
        const updater = loadUpdater();
        await updater.checkForUpdates();
        updater.dismissUpdate();
        expect((await updater.checkForUpdates()).status).toBe('idle');
        expect(showMessageBox).not.toHaveBeenCalled();
        await updater.checkForUpdates({manual: true});
        expect(showMessageBox.mock.calls[0][1].message).toContain('Version 0.2.0');
    });

    test('manual check shows the result in a dialog', async () => {
        mockLatestRelease('v0.1.6');
        showMessageBox.mockResolvedValue({response: 0});
        const updater = loadUpdater();
        await updater.checkForUpdates({manual: true});
        expect(showMessageBox).toHaveBeenCalledTimes(1);
        expect(showMessageBox.mock.calls[0][1].message).toContain('latest version');
    });
});

describe('downloadUpdate', () => {
    test('configures the feed and starts the download', async () => {
        mockLatestRelease('v0.2.0');
        const updater = loadUpdater();
        await updater.checkForUpdates();
        updater.downloadUpdate();
        expect(autoUpdater.setFeedURL).toHaveBeenCalledWith({url: 'https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/releases/latest/download'});
        expect(autoUpdater.checkForUpdates).toHaveBeenCalledTimes(1);
        expect(updater.getUpdateState()).toEqual({status: 'downloading', version: '0.2.0'});
    });

    test('does nothing when the update cannot be installed automatically', async () => {
        setPlatform('linux');
        mockLatestRelease('v0.2.0');
        const updater = loadUpdater();
        await updater.checkForUpdates();
        updater.downloadUpdate();
        expect(autoUpdater.checkForUpdates).not.toHaveBeenCalled();
    });

    test('prompts to restart once downloaded and installs on confirmation', async () => {
        mockLatestRelease('v0.2.0');
        showMessageBox.mockResolvedValue({response: 0});  // "Restart now"
        const updater = loadUpdater();
        await updater.checkForUpdates();
        updater.downloadUpdate();
        autoUpdater.emit('update-downloaded');
        expect(updater.getUpdateState()).toEqual({status: 'downloaded', version: '0.2.0'});

        // let the dialog promise and cleanup resolve
        await new Promise(resolve => setImmediate(resolve));
        expect(terminateBackend).toHaveBeenCalled();
        expect(updater.isInstallingUpdate()).toBe(true);
        expect(autoUpdater.quitAndInstall).toHaveBeenCalled();
    });

    test('keeps the downloaded update for the next start when restart is postponed', async () => {
        mockLatestRelease('v0.2.0');
        showMessageBox.mockResolvedValue({response: 1});  // "Later"
        const updater = loadUpdater();
        await updater.checkForUpdates();
        updater.downloadUpdate();
        autoUpdater.emit('update-downloaded');
        await new Promise(resolve => setImmediate(resolve));
        expect(autoUpdater.quitAndInstall).not.toHaveBeenCalled();
        expect(updater.getUpdateState().status).toBe('downloaded');
    });

    test('reports download errors and offers the release page', async () => {
        mockLatestRelease('v0.2.0');
        showMessageBox.mockResolvedValue({response: 0});  // "Open download page"
        const updater = loadUpdater();
        await updater.checkForUpdates();
        updater.downloadUpdate();
        autoUpdater.emit('error', new Error('network down'));
        expect(updater.getUpdateState()).toEqual({status: 'error', message: 'network down'});

        await new Promise(resolve => setImmediate(resolve));
        expect(showMessageBox.mock.calls[0][1]).toMatchObject({message: 'The update could not be downloaded.'});
        expect(openExternal).toHaveBeenCalledWith('https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/releases/tag/v0.2.0');
    });

    test('reports when the update feed has no update', async () => {
        mockLatestRelease('v0.2.0');
        showMessageBox.mockResolvedValue({response: 1});  // "Close"
        const updater = loadUpdater();
        await updater.checkForUpdates();
        updater.downloadUpdate();
        autoUpdater.emit('update-not-available');
        expect(updater.getUpdateState().status).toBe('error');
        await new Promise(resolve => setImmediate(resolve));
        expect(showMessageBox).toHaveBeenCalledTimes(1);
        expect(openExternal).not.toHaveBeenCalled();
    });

    test('reports when starting the download throws', async () => {
        mockLatestRelease('v0.2.0');
        showMessageBox.mockResolvedValue({response: 1});
        autoUpdater.checkForUpdates.mockImplementationOnce(() => {
            throw new Error('Update.exe not found');
        });
        const updater = loadUpdater();
        await updater.checkForUpdates();
        updater.downloadUpdate();
        expect(updater.getUpdateState()).toEqual({status: 'error', message: 'Update.exe not found'});
        expect(showMessageBox).toHaveBeenCalledTimes(1);
    });
});

describe('startAutoCheck', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockLatestRelease('v0.2.0');
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('checks after startup and periodically', () => {
        const updater = loadUpdater();
        updater.startAutoCheck();
        expect(global.fetch).not.toHaveBeenCalled();
        jest.advanceTimersByTime(10 * 1000);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        jest.advanceTimersByTime(6 * 60 * 60 * 1000);
        expect(global.fetch).toHaveBeenCalledTimes(2);
        updater.stopAutoCheck();
    });

    test('does not check when disabled in the settings', () => {
        getAutoUpdateCheck.mockReturnValue(false);
        const updater = loadUpdater();
        updater.startAutoCheck();
        jest.advanceTimersByTime(7 * 60 * 60 * 1000);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('does not check in development', () => {
        app.isPackaged = false;
        const updater = loadUpdater();
        updater.startAutoCheck();
        jest.advanceTimersByTime(7 * 60 * 60 * 1000);
        expect(global.fetch).not.toHaveBeenCalled();
    });
});
