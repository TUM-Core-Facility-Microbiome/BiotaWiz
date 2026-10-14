import {app, autoUpdater, BrowserWindow, dialog, shell} from 'electron';
import {SemVer} from "semver";

import {APP_GITHUB_REPO, APP_UPDATE_FEED_URL} from "../config";
import {Environment} from "../enums";
import {isNewerVersion, semVerFromGitHubTag} from "./releasetag";
import {logToDevTools} from "./logHandler";
import {getAutoUpdateCheck} from "./storage";
import {taskQueue} from "./taskQueue";
import {terminateBackend} from "./backend";

export type UpdateState =
    | { status: 'idle' }
    | { status: 'checking' }
    | { status: 'up-to-date' }
    | { status: 'available', version: string, releaseUrl: string, canAutoInstall: boolean }
    | { status: 'downloading', version: string }
    | { status: 'downloaded', version: string }
    | { status: 'error', message: string };

const AUTO_CHECK_DELAY_MS = 10 * 1000;  // wait a bit after startup before the first check
const AUTO_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;  // check every 6 hours
const CHECK_TIMEOUT_MS = 15 * 1000;  // give up on the GitHub API after this time

let state: UpdateState = {status: 'idle'};
let dismissedVersion: string | null = null;  // version the user chose to skip for this session
let releaseUrl: string | null = null;  // page of the release being offered, as a fallback if the download fails
let feedConfigured = false;
let installingUpdate = false;
let autoCheckTimers: NodeJS.Timeout[] = [];

export function getUpdateState(): UpdateState {
    return state;
}

export function isInstallingUpdate(): boolean {
    return installingUpdate;
}

/**
 * Automatic installation is only supported for the packaged Windows (Squirrel) build.
 * Everywhere else we only notify the user and link to the release page.
 */
export function canAutoInstall(): boolean {
    return process.platform === 'win32' && app.isPackaged;
}

function setState(newState: UpdateState) {
    state = newState;
    const window = BrowserWindow.fromId(1);
    if (window) {
        window.webContents.send('updateState', state);
    }
}

/**
 * Turn errors of the update check into messages that can be shown to the user.
 */
function describeCheckError(error: unknown): string {
    // compare by name, as the DOMException thrown on timeout is not necessarily an instance of Error
    const name = (error as { name?: string } | null)?.name;
    if (name === 'TimeoutError') {
        return 'The update server did not respond in time. Please try again later.';
    }
    if (name === 'TypeError') {
        // fetch() rejects with a TypeError on network failures
        return 'Could not connect to GitHub. Please check your internet connection.';
    }
    return error instanceof Error ? error.message : String(error);
}

async function fetchLatestRelease(): Promise<{ version: SemVer, releaseUrl: string }> {
    // /releases/latest excludes drafts and pre-releases
    const response = await fetch(`https://api.github.com/repos/${APP_GITHUB_REPO}/releases/latest`, {
        signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });
    if (!response.ok) {
        switch (response.status) {
            case 404:  // also returned while the repository is private
                throw new Error('No published release was found.');
            case 403:
            case 429:
                throw new Error('Too many update checks. Please try again later.');
            default:
                throw new Error(`GitHub returned an unexpected response (HTTP ${response.status}).`);
        }
    }
    const release: { tag_name: string, html_url: string } = await response.json();
    let version: SemVer;
    try {
        version = semVerFromGitHubTag(release.tag_name);
    } catch {
        throw new Error(`The latest release has an invalid version tag (${release.tag_name}).`);
    }
    return {version, releaseUrl: release.html_url};
}

/**
 * Check GitHub for a newer release of the application.
 * This only checks; downloading is started separately via downloadUpdate() so the user can decide.
 * @param manual true if triggered by the user; shows a dialog with the result
 */
export async function checkForUpdates({manual = false} = {}): Promise<UpdateState> {
    // do not interrupt an update that is already in progress
    if (state.status === 'downloading' || state.status === 'downloaded') {
        if (manual) {
            await showResultDialog();
        }
        return state;
    }

    logToDevTools('Checking for application updates');
    const previousState = state;
    // keep showing an available update while checking in the background
    const keepAvailable = !manual && previousState.status === 'available';
    if (!keepAvailable) {
        setState({status: 'checking'});
    }
    try {
        const latest = await fetchLatestRelease();
        const version = latest.version;
        releaseUrl = latest.releaseUrl;
        const versionString = version.format();
        if (!isNewerVersion(new SemVer(app.getVersion()), version)) {
            setState({status: 'up-to-date'});
        } else if (!manual && versionString === dismissedVersion) {
            logToDevTools(`Update to ${versionString} was dismissed for this session`);
            setState({status: 'idle'});
        } else {
            logToDevTools(`New version available: ${versionString}`);
            setState({status: 'available', version: versionString, releaseUrl: latest.releaseUrl, canAutoInstall: canAutoInstall()});
        }
    } catch (error) {
        logToDevTools(`Update check failed: ${error}`, 'warn');
        if (keepAvailable) {
            // a failed background check should not hide an update that was already found
            setState(previousState);
        } else {
            setState({status: 'error', message: describeCheckError(error)});
        }
    }

    if (manual) {
        await showResultDialog();
    }
    return state;
}

async function showResultDialog() {
    const window = BrowserWindow.fromId(1);
    const options = (() => {
        switch (state.status) {
            case 'up-to-date':
                return {type: 'info' as const, message: `You are using the latest version of ${app.getName()} (v${app.getVersion()}).`, buttons: ['OK']};
            case 'available':
                return {
                    type: 'info' as const,
                    message: `Version ${state.version} of ${app.getName()} is available.`,
                    detail: `You are using v${app.getVersion()}.`,
                    buttons: [state.canAutoInstall ? 'Download and install' : 'Open download page', 'Later'],
                    defaultId: 0,
                    cancelId: 1,
                };
            case 'downloading':
                return {type: 'info' as const, message: `Version ${state.version} is being downloaded.`, buttons: ['OK']};
            case 'downloaded':
                return null;  // handled by the restart prompt
            case 'error':
                return {type: 'warning' as const, message: 'Could not check for updates.', detail: state.message, buttons: ['OK']};
            default:
                return null;
        }
    })();

    if (state.status === 'downloaded') {
        await promptRestart();
        return;
    }
    if (!options) {
        return;
    }

    const {response} = window ? await dialog.showMessageBox(window, options) : await dialog.showMessageBox(options);
    if (state.status === 'available') {
        if (response === 0) {
            if (state.canAutoInstall) {
                downloadUpdate();
            } else {
                await openReleasePage();
            }
        } else {
            dismissUpdate();
        }
    }
}

function configureFeed() {
    if (feedConfigured) {
        return;
    }
    // Squirrel.Windows fetches RELEASES and the nupkg relative to this URL, which GitHub redirects to the latest release
    autoUpdater.setFeedURL({url: APP_UPDATE_FEED_URL});

    autoUpdater.on('update-downloaded', () => {
        const version = 'version' in state ? state.version : 'unknown';
        logToDevTools(`Update ${version} downloaded`);
        setState({status: 'downloaded', version});
        promptRestart();
    });
    autoUpdater.on('update-not-available', () => {
        // the API reported a newer release but the Squirrel feed did not (e.g., assets not yet uploaded)
        logToDevTools('Update feed reported no update available', 'warn');
        handleDownloadError('The update is not yet available for download. Please try again later.');
    });
    autoUpdater.on('error', (error: Error) => {
        logToDevTools(`Error while updating: ${error.message}`, 'error');
        handleDownloadError(error.message);
    });
    feedConfigured = true;
}

/**
 * Download the update in the background (Windows only).
 * Squirrel downloads as soon as checkForUpdates() finds an update and emits 'update-downloaded' when done.
 */
export function downloadUpdate() {
    if (state.status !== 'available' || !state.canAutoInstall) {
        return;
    }
    configureFeed();
    setState({status: 'downloading', version: state.version});
    try {
        autoUpdater.checkForUpdates();
    } catch (error) {
        handleDownloadError(error instanceof Error ? error.message : String(error));
    }
}

/**
 * Tell the user that the download failed and offer the release page as a fallback.
 */
async function handleDownloadError(message: string) {
    if (state.status !== 'downloading') {
        return;  // only report errors of a download the user started
    }
    setState({status: 'error', message});

    const options = {
        type: 'warning' as const,
        message: 'The update could not be downloaded.',
        detail: `${message}\n\nYou can download and install the new version manually from the release page.`,
        buttons: ['Open download page', 'Close'],
        defaultId: 0,
        cancelId: 1,
    };
    const window = BrowserWindow.fromId(1);
    const {response} = window ? await dialog.showMessageBox(window, options) : await dialog.showMessageBox(options);
    if (response === 0 && releaseUrl) {
        await shell.openExternal(releaseUrl);
    }
}

async function promptRestart() {
    if (state.status !== 'downloaded') {
        return;
    }
    const options = {
        type: 'info' as const,
        message: `Version ${state.version} has been downloaded.`,
        detail: `Restart ${app.getName()} now to apply the update, or it will be applied the next time you start the application.`,
        buttons: ['Restart now', 'Later'],
        defaultId: 0,
        cancelId: 1,
    };
    const window = BrowserWindow.fromId(1);
    const {response} = window ? await dialog.showMessageBox(window, options) : await dialog.showMessageBox(options);
    if (response === 0) {
        await quitAndInstall();
    }
}

/**
 * Restart the application and apply a downloaded update.
 * Runs the same cleanup as a normal quit before handing over to Squirrel.
 */
export async function quitAndInstall() {
    if (state.status !== 'downloaded') {
        return;
    }

    if (taskQueue.isBusy()) {
        const options = {
            type: 'warning' as const,
            message: 'An analysis is currently running.',
            detail: 'Restarting now will stop the running analysis.',
            buttons: ['Restart anyway', 'Cancel'],
            defaultId: 1,
            cancelId: 1,
        };
        const window = BrowserWindow.fromId(1);
        const {response} = window ? await dialog.showMessageBox(window, options) : await dialog.showMessageBox(options);
        if (response !== 0) {
            return;
        }
    }

    logToDevTools('Restarting to apply update');
    taskQueue.clear();
    try {
        await terminateBackend(Environment.TACTIC);
    } catch (e) {
        console.error('Error during cleanup:', e);
    }
    installingUpdate = true;  // lets the will-quit handler know that cleanup already happened
    autoUpdater.quitAndInstall();
}

export async function openReleasePage() {
    if (releaseUrl) {
        await shell.openExternal(releaseUrl);
    }
}

/**
 * Hide the notification for the available version until the next application start.
 */
export function dismissUpdate() {
    if (state.status === 'available') {
        dismissedVersion = state.version;
        setState({status: 'idle'});
    }
}

/**
 * Periodically check for updates in the background, if enabled in the settings.
 */
export function startAutoCheck() {
    stopAutoCheck();
    if (!app.isPackaged) {
        logToDevTools('Not checking for updates automatically in development');
        return;
    }
    // Squirrel holds a lock on the first run after installation
    if (process.argv.includes('--squirrel-firstrun')) {
        return;
    }
    if (!getAutoUpdateCheck()) {
        logToDevTools('Automatic update checks are disabled');
        return;
    }

    const check = () => {
        checkForUpdates().catch(error => console.error(error));
    };
    autoCheckTimers = [
        setTimeout(check, AUTO_CHECK_DELAY_MS),
        setInterval(check, AUTO_CHECK_INTERVAL_MS),
    ];
}

export function stopAutoCheck() {
    autoCheckTimers.forEach(timer => clearTimeout(timer));
    autoCheckTimers = [];
}
