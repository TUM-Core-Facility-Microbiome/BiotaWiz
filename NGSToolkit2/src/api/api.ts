import {BrowserWindow, ipcMain, shell} from 'electron';
import {getPlatform} from "../utils/platform";
import {getDistributionTarPath} from "../utils/backend";
import {getBackendVersion, initializeBackend, runMockProcess} from "../utils/process";
import {handleFolderOpen} from "./dialogs";
import {getBackend, getTicBaseDirectory, setTicBaseDirectory} from "./storage";
import {detectStudyFolders} from "./file-explorer";

ipcMain.handle('openExternal', async (event, url: string) => {
    return await shell.openExternal(url);
});

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

ipcMain.handle("loadStudiesFromBaseDirectory", async (event): Promise<IFileSystemNode[]> => {
    return new Promise<IFileSystemNode[]>((resolve) => {
        getTicBaseDirectory().then((baseDirectory) => {
            resolve(detectStudyFolders(baseDirectory));
        });
    });
});

ipcMain.handle("initializeBackend", async () => {
    initializeBackend().then(() => {
        console.log(`Backend initialized`);
    });
});

ipcMain.handle("publish:ticBaseDirectory", async (event, baseDirectory: string) => {
    console.log(`Setting TIC base directory to ${baseDirectory}`);
    await setTicBaseDirectory(baseDirectory);
});
