import {app, BrowserWindow, ipcMain, shell} from 'electron';
import {getPlatform} from "../utils/platform";
import {
    checkBackendConnection,
    deleteAllDistributionTarFiles,
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
import {
    getAutoUpdateCheck,
    getBackend,
    getTacticBaseDirectory,
    setAutoUpdateCheck,
    setTacticBaseDirectory
} from "../utils/storage";
import {countSamples, detectStudyFolders} from "../utils/file-explorer";
import {describeFastqDiscoveryRules, FastqDiscoveryRules, fastqDiscoveryRulesFor} from "../utils/fastqDiscovery";
import {SemVer} from "semver";
import {Environment, TacticAnalysisMode, SpikeMode} from "../enums";
import {taskQueue} from '../utils/taskQueue';
import {tacticConfiguration} from "../utils/tacticConfiguration";
import {openCommunityDiscussions, openIssues} from "../electron/browserLinks";
import {logToDevTools} from "../utils/logHandler";
import {getVersionString} from "../utils/releasetag";
import {getMachineThreads, getRecommendedThreads} from "../utils/machine";
import {
    checkForUpdates,
    dismissUpdate,
    downloadUpdate,
    getUpdateState,
    openReleasePage,
    quitAndInstall,
    startAutoCheck,
    stopAutoCheck
} from "../utils/updater";

ipcMain.handle('app:getName', () => {
    return app.getName();
});

ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
});

ipcMain.handle('update:getState', () => {
    return getUpdateState();
});

ipcMain.handle('update:check', async () => {
    return await checkForUpdates({manual: true});
});

ipcMain.handle('update:download', () => {
    downloadUpdate();
});

ipcMain.handle('update:install', async () => {
    await quitAndInstall();
});

ipcMain.handle('update:openReleasePage', async () => {
    await openReleasePage();
});

ipcMain.handle('update:dismiss', () => {
    dismissUpdate();
});

ipcMain.handle('update:getAutoCheck', () => {
    return getAutoUpdateCheck();
});

ipcMain.handle('update:setAutoCheck', async (event, enabled: boolean) => {
    await setAutoUpdateCheck(enabled);
    if (enabled) {
        startAutoCheck();
    } else {
        stopAutoCheck();
    }
});

ipcMain.handle('openExternal', async (event, url: string) => {
    return await shell.openExternal(url);
});

ipcMain.handle('dialog:handleFolderOpen', async (event, defaultPath?: string) => {
    return await handleFolderOpen(defaultPath);
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

ipcMain.handle("checkBackendConnection", async () => {
    return checkBackendConnection();
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

ipcMain.handle("deleteAllDistributionTarFiles", async (event, environment: Environment): Promise<number> => {
    return await deleteAllDistributionTarFiles(environment);
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

ipcMain.handle("tactic:getBaseDirectory", async () => {
    return await getTacticBaseDirectory();
});

/**
 * Choose the FASTQ discovery rules of the pipeline version that will run the analysis, and log the choice.
 */
async function chooseFastqDiscoveryRules(): Promise<{ rules: FastqDiscoveryRules, message: string }> {
    let version: SemVer | null = null;
    try {
        version = await getImageTagOrLatestCompatible(Environment.TACTIC) ?? null;
    } catch (error) {
        logToDevTools(`FASTQ discovery: could not determine the pipeline version: ${error}`, 'warn');
    }
    const rules = fastqDiscoveryRulesFor(version);
    const pipeline = version ? `pipeline v${getVersionString(version)}` : 'unknown pipeline version';
    return {rules, message: `FASTQ discovery: ${describeFastqDiscoveryRules(rules)} for ${pipeline}`};
}

ipcMain.handle("loadStudiesFromBaseDirectory", async (): Promise<IFileSystemNode> => {
    const baseDirectory = await getTacticBaseDirectory();
    const {rules, message} = await chooseFastqDiscoveryRules();
    const studies = detectStudyFolders(baseDirectory, rules);
    logToDevTools(`${message}: ${countSamples(studies)} samples found in ${baseDirectory}`);
    tacticConfiguration.setFastqDiscoveryMessage(message);
    return studies;
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

ipcMain.handle("tactic:setAnalysisMode", async (event, analysisMode: TacticAnalysisMode) => {
    console.log(`Setting TACTIC analysis mode to ${analysisMode}`);
    tacticConfiguration.setAnalysisMode(analysisMode);
});

ipcMain.handle("tactic:getAnalysisMode", async () => {
    return tacticConfiguration.getAnalysisMode();
});

ipcMain.handle("tactic:setPreprocessToIndividualZOTUs", async(event, preprocessToIndividualZOTUs: boolean) => {
    console.log(`Setting TACTIC preprocess to individual ZOTUs to ${preprocessToIndividualZOTUs}`);
    tacticConfiguration.setPreprocessToIndividualZOTUs(preprocessToIndividualZOTUs);
});

ipcMain.handle("tactic:setSkipNonBacterialFilter", async(event, skipNonBacterialFilter: boolean) => {
   console.log(`Setting TACTIC skip non-bacterial filter to ${skipNonBacterialFilter}`);
   tacticConfiguration.setSkipNonBacterialFilter(skipNonBacterialFilter);
});

ipcMain.handle("tactic:setBaseDirectory", async (event, baseDirectory: string) => {
    console.log(`Setting TACTIC base directory to ${baseDirectory}`);
    tacticConfiguration.setBaseDirectory(baseDirectory);
    console.log(tacticConfiguration);
    await setTacticBaseDirectory(baseDirectory);
});

ipcMain.handle("tactic:setAnalysisDirectory", async (event, analysisDirectory: string) => {
    console.log(`Setting TACTIC analysis directory to ${analysisDirectory}`);
    tacticConfiguration.setAnalysisDirectory(analysisDirectory);
    console.log(tacticConfiguration);
});

ipcMain.handle("tactic:setSpikeInSequencesDirectory", async (event, spikeInSequencesDirectory: string) => {
    console.log(`Setting spike-in directory to ${spikeInSequencesDirectory}`);
    tacticConfiguration.setSpikeInSequencesDirectory(spikeInSequencesDirectory);
    console.log(tacticConfiguration);
});

ipcMain.handle("tactic:openAnalysisDirectory", async () => {
    console.log("Opening analysis directory");
    await tacticConfiguration.openAnalysisDirectory();
});

ipcMain.handle("tactic:setSamples", async (event, samples: IFileSystemSample[]) => {
    console.log(`Setting TACTIC samples to ${JSON.stringify(samples)}`);
    tacticConfiguration.setSamples(samples);
    console.log(tacticConfiguration);
});

ipcMain.handle("tactic:setSpikeMode", async (event, spikeModeName: string) => {
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
    tacticConfiguration.setSpikeMode(mode);
    return tacticConfiguration.getSpikeMode();
});

ipcMain.handle("tactic:getDefaultParameters", async () => {
    return tacticConfiguration.getDefaultParameters();
});

ipcMain.handle("tactic:setParameters", async (event, parameters: ITacticArguments) => {
    tacticConfiguration.setParameters(parameters);
    console.log(tacticConfiguration);
});

ipcMain.handle("tactic:setThreads", async (event, threads: number) => {
    tacticConfiguration.setThreads(threads);
    console.log(tacticConfiguration);
});

ipcMain.handle("tactic:openMappingFile", async () => {
    console.log("Opening mapping file");
    await tacticConfiguration.openMappingFile();
});

ipcMain.handle("tactic:convertMapping", async () => {
    console.log("Converting mapping file");
    return tacticConfiguration.convertMappingFileFormatXlsxToTsv();
});

ipcMain.handle("tactic:checkMapping", async () => {
    console.log("Checking mapping file");
    return tacticConfiguration.checkMapping();
});

ipcMain.handle("tactic:run", async () => {
    console.log("Running TACTIC pipeline");
    tacticConfiguration.runPipeline();
});

ipcMain.handle("tactic:terminateBackend", async () => {
    console.log("Stopping TACTIC pipeline");
    return await terminateBackend(Environment.TACTIC);
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
