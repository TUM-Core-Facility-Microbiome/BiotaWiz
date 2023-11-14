import {ipcMain} from 'electron';
import {getPlatform} from "../utils/platform";
import {runMockProcess} from "../utils/process";

ipcMain.handle("getPlatformName", () => {
    return getPlatform();
});

ipcMain.handle("runMockProcess", () => {
    console.log("runMockProcess");
    runMockProcess();
});
