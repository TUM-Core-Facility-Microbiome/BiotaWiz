import {ipcMain} from 'electron';
import {getPlatform} from "../utils/platform";
import {runMockProcess} from "../utils/process";
import {handleFolderOpen} from "./dialogs";


ipcMain.handle('dialog:handleFolderOpen', async () => {
    return await handleFolderOpen();
});

ipcMain.handle("getPlatformName", () => {
    return getPlatform();
});

ipcMain.handle("runMockProcess", () => {
    console.log("runMockProcess");
    runMockProcess();
});
