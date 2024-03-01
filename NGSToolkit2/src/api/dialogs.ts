import {BrowserWindow, dialog} from "electron";

export async function handleFolderOpen(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        dialog.showOpenDialog(focusedWindow, {
            properties: ['openDirectory']
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
