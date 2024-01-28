import {BrowserWindow} from "electron";

export function logToDevTools(message: string, level = 'info') {
    const window = BrowserWindow.getFocusedWindow();
    window.webContents.send('logRequest', message, level);
    // also log to console
    if (level === 'error') {
        console.error(message);
    } else if (level === 'warn') {
        console.warn(message);
    } else {
        console.log(message);
    }
}
