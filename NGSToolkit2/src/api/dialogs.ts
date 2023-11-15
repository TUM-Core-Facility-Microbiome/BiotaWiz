import {dialog} from "electron";

export async function handleFolderOpen(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        dialog.showOpenDialog({
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
