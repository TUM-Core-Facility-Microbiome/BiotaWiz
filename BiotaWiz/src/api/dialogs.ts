import {BrowserWindow, dialog} from "electron";

export async function handleFolderOpen(defaultPath?: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        const openOptions = defaultPath ? {
            properties: ['openDirectory'],
            defaultPath: defaultPath
        } : {
            properties: ['openDirectory']
        };
        dialog.showOpenDialog(focusedWindow, openOptions).then((result) => {
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
        dialog.showOpenDialog(focusedWindow, {
            properties: ['openFile']
        }).then((result) => {
            if (result.canceled) {
                reject("User canceled");
            }
            resolve(result.filePaths[0]);
        }, (error) => {
            reject(error);
        });
    });
}
