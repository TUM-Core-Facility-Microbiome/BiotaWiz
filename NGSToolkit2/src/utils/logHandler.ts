import {BrowserWindow} from "electron";

export function logToDevTools(message: string, level = 'info') {
    const window = BrowserWindow.getFocusedWindow();
    window.webContents.send('logRequest', message, level);
    // also log to console
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
