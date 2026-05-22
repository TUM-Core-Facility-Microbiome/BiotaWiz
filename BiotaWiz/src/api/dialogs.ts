import {BrowserWindow, dialog, OpenDialogOptions} from "electron";

export async function handleFolderOpen(defaultPath?: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        const openOptions: OpenDialogOptions = defaultPath
            ? { properties: ['openDirectory'], defaultPath }
            : { properties: ['openDirectory'] };
        const promise = focusedWindow
            ? dialog.showOpenDialog(focusedWindow, openOptions)
            : dialog.showOpenDialog(openOptions);
        promise.then((result) => {
            if (result.canceled) {
                reject("User canceled");
            }
            resolve(result.filePaths[0]);
        }, (error) => {
            reject(error);
        });
    });
}

export async function handleFileOpen(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        const openOptions: OpenDialogOptions = { properties: ['openFile'] };
        const promise = focusedWindow
            ? dialog.showOpenDialog(focusedWindow, openOptions)
            : dialog.showOpenDialog(openOptions);
        promise.then((result) => {
            if (result.canceled) {
                reject("User canceled");
            }
            resolve(result.filePaths[0]);
        }, (error) => {
            reject(error);
        });
    });
}
