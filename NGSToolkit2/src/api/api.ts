import {ipcMain} from 'electron';
import {getPlatform} from "../utils/platform";
import {getBackendVersion, runMockProcess} from "../utils/process";
import {handleFolderOpen} from "./dialogs";
import {getBackend} from "./storage";
import {detectStudyFolders} from "./file-explorer";


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

ipcMain.handle("loadStudiesFromBaseDirectory", async (event, baseDirectory: string): Promise<IFileSystemNode[]> => {
    return new Promise<IFileSystemNode[]>((resolve) => {
        resolve(detectStudyFolders(baseDirectory));
    });
});