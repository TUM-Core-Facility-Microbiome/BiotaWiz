import {app, BrowserWindow, ipcMain, shell} from 'electron';
import {getPlatform} from "../utils/platform";
import {
    deleteImage,
    getAssociatedImages,
    getCompatibleReleaseTagStrings,
    getFixedImageTagString, getImageTagOrLatestCompatible,
    initializeBackend,
    resetToDefaultBackend,
    setBackendByType,
    setFixedImageTagString, terminateBackend
} from "../utils/backend";
import {getBackendVersion, runMockProcess} from "../utils/process";
import {handleFileOpen, handleFolderOpen} from "./dialogs";
import {getBackend, getImngs2CoreBaseDirectory, setImngs2CoreBaseDirectory} from "../utils/storage";
import {detectStudyFolders} from "../utils/file-explorer";
import {Environment, SpikeMode} from "../enums";
import {taskQueue} from '../utils/taskQueue';
import {imngs2CoreConfiguration} from "../utils/imngs2CoreConfiguration";
import {openCommunityDiscussions, openIssues} from "../electron/browserLinks";
import {logToDevTools} from "../utils/logHandler";
import {getVersionString} from "../utils/releasetag";
import {getMachineThreads, getRecommendedThreads} from "../utils/machine";

ipcMain.handle('app:getName', () => {
    return app.getName();
});

ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
});

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

ipcMain.handle("changeEnvironment", async (event, environment: Environment | null) => {
    const window = BrowserWindow.fromId(1);
    if (window) {
        window.webContents.send('envChange', environment, "");
        if (environment) {
            const releaseTag = await getImageTagOrLatestCompatible(environment);
            const vString = getVersionString(releaseTag);
            window.webContents.send('envChange', environment, `v${vString}`);
        }
    }
});

ipcMain.handle("runMockProcess", async () => {
    console.log("runMockProcess");
    return runMockProcess();
});

ipcMain.handle("imngs2core:getBaseDirectory", async () => {
    return await getImngs2CoreBaseDirectory();
});

ipcMain.handle("loadStudiesFromBaseDirectory", async (): Promise<IFileSystemNode[]> => {
    return new Promise<IFileSystemNode[]>((resolve) => {
        getImngs2CoreBaseDirectory().then((baseDirectory) => {
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

ipcMain.handle("imngs2core:setBaseDirectory", async (event, baseDirectory: string) => {
    console.log(`Setting IMNGS2-Core base directory to ${baseDirectory}`);
    imngs2CoreConfiguration.setBaseDirectory(baseDirectory);
    console.log(imngs2CoreConfiguration);
    await setImngs2CoreBaseDirectory(baseDirectory);
});

ipcMain.handle("imngs2core:setAnalysisDirectory", async (event, analysisDirectory: string) => {
    console.log(`Setting IMNGS2-Core analysis directory to ${analysisDirectory}`);
    imngs2CoreConfiguration.setAnalysisDirectory(analysisDirectory);
    console.log(imngs2CoreConfiguration);
    await setImngs2CoreBaseDirectory(analysisDirectory);
});

ipcMain.handle("imngs2core:openAnalysisDirectory", async () => {
    console.log("Opening analysis directory");
    await imngs2CoreConfiguration.openAnalysisDirectory();
});

ipcMain.handle("imngs2core:setSamples", async (event, samples: IFileSystemSample[]) => {
    console.log(`Setting IMNGS2-Core samples to ${JSON.stringify(samples)}`);
    imngs2CoreConfiguration.setSamples(samples);
    console.log(imngs2CoreConfiguration);
});

ipcMain.handle("imngs2core:setSpikeMode", async (event, spikeModeName: string) => {
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
    imngs2CoreConfiguration.setSpikeMode(mode);
    return imngs2CoreConfiguration.getSpikeMode();
});

ipcMain.handle("imngs2core:setParameters", async (event, parameters: IImngs2CoreArguments) => {
    imngs2CoreConfiguration.setParameters(parameters);
    console.log(imngs2CoreConfiguration);
});

ipcMain.handle("imngs2core:setThreads", async (event, threads: Number) => {
    imngs2CoreConfiguration.setThreads(threads);
    console.log(imngs2CoreConfiguration);
});

ipcMain.handle("imngs2core:openMappingFile", async () => {
    console.log("Opening mapping file");
    await imngs2CoreConfiguration.openMappingFile();
});

ipcMain.handle("imngs2core:checkMapping", async () => {
    console.log("Checking mapping file");
    return imngs2CoreConfiguration.checkMapping();
});

ipcMain.handle("imngs2core:run", async () => {
    console.log("Running IMNGS2-Core pipeline");
    imngs2CoreConfiguration.runPipeline();
});

ipcMain.handle("imngs2core:terminateBackend", async () => {
    console.log("Stopping IMNGS2-Core pipeline");
    return await terminateBackend(Environment.IMNGS2CORE);
});

ipcMain.handle("openExternalLink", async (event, url: string) => {
    return await shell.openExternal(url);
});

ipcMain.handle("openIssues", async () => {
    openIssues();
});

ipcMain.handle("openCommunityDiscussions", async () => {
    openCommunityDiscussions();
});

ipcMain.handle("getMachineThreads", () => {
    return getMachineThreads();
});

ipcMain.handle("getRecommendedThreads", () => {
    return getRecommendedThreads();
});
