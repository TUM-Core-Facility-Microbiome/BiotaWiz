import {ipcMain, shell} from 'electron';
import {getPlatform} from "../utils/platform";
import {
    deleteImage,
    getAssociatedImages,
    getCompatibleReleaseTagStrings,
    getFixedImageTagString,
    initializeBackend,
    resetToDefaultBackend,
    setBackendByType,
    setFixedImageTagString
} from "../utils/backend";
import {getBackendVersion, runMockProcess} from "../utils/process";
import {handleFileOpen, handleFolderOpen} from "./dialogs";
import {getBackend, getTicBaseDirectory, setTicBaseDirectory} from "../utils/storage";
import {detectStudyFolders} from "../utils/file-explorer";
import {Environment, SpikeMode} from "../enums";
import {taskQueue} from '../utils/taskQueue';
import {ticConfiguration} from "../utils/ticConfiguration";


ipcMain.handle('openExternal', async (event, url: string) => {
    return await shell.openExternal(url);
});

ipcMain.handle('dialog:handleFolderOpen', async () => {
    return await handleFolderOpen();
});

ipcMain.handle('dialog:handleFileOpen', async () => {
    return await handleFileOpen();
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

ipcMain.handle("getCompatibleReleaseTagStrings", async (event, environment: Environment): Promise<string[]> => {
    return await getCompatibleReleaseTagStrings(environment);
});

ipcMain.handle("getFixedImageTagString", async (event, environment: Environment) => {
    return await getFixedImageTagString(environment);
});

ipcMain.handle("setFixedImageTagString", async (event, environment: Environment, tag: string) => {
    return await setFixedImageTagString(environment, tag);
});

ipcMain.handle("getAssociatedImages", async (event, environment: Environment): Promise<IImage[]> => {
    const res = await getAssociatedImages(environment);
    console.log(res);
    return res;
});

ipcMain.handle("deleteImage", async (event, name: string, tag: string) => {
    return await deleteImage(name, tag);
});

ipcMain.handle("runMockProcess", async () => {
    console.log("runMockProcess");
    return runMockProcess();
});

ipcMain.handle("loadStudiesFromBaseDirectory", async (): Promise<IFileSystemNode[]> => {
    return new Promise<IFileSystemNode[]>((resolve) => {
        getTicBaseDirectory().then((baseDirectory) => {
            resolve(detectStudyFolders(baseDirectory));
        });
    });
});

ipcMain.handle("initializeEnvironment", async (event, environment: Environment) => {
    return await taskQueue.defer(async () => {
        return new Promise<void>((resolve) => {
            initializeBackend(environment).then(() => {
                console.log(`${environment} environment initialized`);
                resolve();
            }).catch((err) => {
                console.error(err);
                resolve();
            });
        });
    });
});

ipcMain.handle("publish:ticBaseDirectory", async (event, baseDirectory: string) => {
    console.log(`Setting TIC base directory to ${baseDirectory}`);
    ticConfiguration.setBaseDirectory(baseDirectory);
    console.log(ticConfiguration);
    await setTicBaseDirectory(baseDirectory);
});

ipcMain.handle("publish:ticSamples", async (event, samples: IFileSystemNode[]) => {
    console.log(`Setting TIC samples to ${JSON.stringify(samples)}`);
    ticConfiguration.setSamples(samples);
    console.log(ticConfiguration);
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
    ticConfiguration.setSpikeMode(mode);
    return ticConfiguration.getSpikeMode();
});

ipcMain.handle("publish:ticParameters", async (event, parameters: ITicPipelineArguments) => {
    ticConfiguration.setParameters(parameters);
    console.log(ticConfiguration);
});

ipcMain.handle("publish:usearchBinary", async (event, path: string) => {
    await ticConfiguration.setUsearchBinaryPath(path);
});

ipcMain.handle("tic:openMappingFile", async () => {
    console.log("Opening mapping file");
    await ticConfiguration.openMappingFile();
});

ipcMain.handle("tic:checkMapping", async () => {
    console.log("Checking mapping file");
    return ticConfiguration.checkMapping();
});

ipcMain.handle("tic:run", async () => {
    console.log("Running TIC pipeline");
    ticConfiguration.runPipeline();
});

ipcMain.handle("openExternalLink", async (event, url: string) => {
    return await shell.openExternal(url);
});
