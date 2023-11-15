import {ipcMain} from 'electron';
import {getPlatform} from "../utils/platform";
import {getBackendVersion, runMockProcess} from "../utils/process";
import {handleFolderOpen} from "./dialogs";
import {getBackend} from "./storage";


ipcMain.handle('dialog:handleFolderOpen', async () => {
    return await handleFolderOpen();
});

ipcMain.handle("getPlatformName", () => {
    return getPlatform();
});

ipcMain.handle("getBackend", () => {
    return getBackend();
});

ipcMain.handle("getBackendVersion", async () => {
    return getBackendVersion();
});

ipcMain.handle("runMockProcess", async () => {
    console.log("runMockProcess");
    return runMockProcess();
});