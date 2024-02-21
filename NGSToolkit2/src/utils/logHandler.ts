import {BrowserWindow} from "electron";
import {Environment} from "../enums";

export function logToDevTools(message: string, level = 'info') {
    try {
        const window = BrowserWindow.fromId(1);
        if (window) {
            window.webContents.send('logRequest', message, level);
        }
    } finally {
        // log to console
        if (level == 'trace') {
            console.trace(message);
        } else if (level == 'debug') {
            console.debug(message);
        } else if (level == 'info') {
            console.info(message);
        } else if (level == 'warn') {
            console.warn(message);
        } else if (level == 'error') {
            console.error(message);
        } else {
            console.log(message);
        }
    }
}


export function updateProgress(progress: Progress) {
    const window = BrowserWindow.fromId(1);
    if (window) {
        window.webContents.send('progressUpdate', progress);
    }
}

export function logForEnvironment(environment: Environment, logMessage: string) {
    const window = BrowserWindow.fromId(1);
    if (window) {
        window.webContents.send('logsForEnvironment', environment, logMessage);
    }
}
