import {BrowserWindow, ipcMain, shell} from 'electron';
import {getPlatform} from "../utils/platform";
import {
    getCompatibleReleaseTagStrings, getFixedImageTagString,
    initializeBackend,
    resetToDefaultBackend,
    setBackendByType, setFixedImageTagString
} from "../utils/backend";
import {getBackendVersion, runMockProcess} from "../utils/process";
import {handleFolderOpen} from "./dialogs";
import {getBackend, getTicBaseDirectory, setTicBaseDirectory} from "../utils/storage";
import {detectStudyFolders} from "./file-explorer";
import {SpikeMode} from "../enums";

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

ipcMain.handle("setBackendByType", async (event, backend) => {
    return await setBackendByType(backend);
});

ipcMain.handle("resetBackend", async () => {
    return resetToDefaultBackend();
});

ipcMain.handle("getCompatibleReleaseTagStrings", async (): Promise<string[]> => {
    return await getCompatibleReleaseTagStrings();
});

ipcMain.handle("getFixedImageTagString", async () => {
    return await getFixedImageTagString();
});

ipcMain.handle("setFixedImageTagString", async (event, tag: string) => {
    return await setFixedImageTagString(tag);
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

ipcMain.handle("publish:spikeMode", async (event, spikeModeName: string) => {
    // parse spike mode
    let mode;
    if (spikeModeName === SpikeMode.SPIKED) {
        mode = SpikeMode.SPIKED;
    } else if (spikeModeName === SpikeMode.PARTIAL) {
        mode = SpikeMode.PARTIAL;
    } else {
        mode = SpikeMode.NONE;
    }
    console.log(`Selected spike mode: ${mode}`);

    // save prefilled mapping file to baseDirectory
    const baseDirectory = await getTicBaseDirectory();
    const path = `${baseDirectory}/mapping.tsv`;
    const fs = require('fs');
    const content = "#SampleID\ttotal_weight_in_g\tamount_spike\tparent_path\n"; // TODO: fill with selected samples
    fs.writeFile(path, content, (err: string) => {
        console.error(err);
    });

    // open mapping file in default editor
    if (mode == SpikeMode.SPIKED) {
        shell.openPath(path).then(() => {
            console.log(`Opened mapping file in default editor`);
        }).catch((err: string) => {
            console.error(err);
        });
    }
});
