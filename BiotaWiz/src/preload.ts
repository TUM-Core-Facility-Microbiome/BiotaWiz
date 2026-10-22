// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import {contextBridge, ipcRenderer} from "electron";
import {Environment, TacticAnalysisMode, LogSection} from "./enums";
import {logToDevTools} from "./utils/logHandler";
import type {UpdateState} from "./utils/updater";
import type {InternetWarning} from "./utils/internetCheck";

const indexBridge = {
    // renderer to main
    getUpdateState: async (): Promise<UpdateState> => {
        return ipcRenderer.invoke('update:getState');
    },
    checkForUpdates: async (): Promise<UpdateState> => {
        return ipcRenderer.invoke('update:check');
    },
    downloadUpdate: async (): Promise<void> => {
        return ipcRenderer.invoke('update:download');
    },
    installUpdate: async (): Promise<void> => {
        return ipcRenderer.invoke('update:install');
    },
    openUpdateReleasePage: async (): Promise<void> => {
        return ipcRenderer.invoke('update:openReleasePage');
    },
    dismissUpdate: async (): Promise<void> => {
        return ipcRenderer.invoke('update:dismiss');
    },
    getAutoUpdateCheck: async (): Promise<boolean> => {
        return ipcRenderer.invoke('update:getAutoCheck');
    },
    setAutoUpdateCheck: async (enabled: boolean): Promise<void> => {
        return ipcRenderer.invoke('update:setAutoCheck', enabled);
    },
    getMachineThreads: async (): Promise<number> => {
        return ipcRenderer.invoke('getMachineThreads');
    },
    getRecommendedThreads: async (): Promise<number> => {
        return ipcRenderer.invoke('getRecommendedThreads');
    },
    getName: async () => {
        return ipcRenderer.invoke('app:getName');
    },
    getVersion: async () => {
        return ipcRenderer.invoke('app:getVersion');
    },
    openExternal: async (url: string) => {
        return new Promise<void>((resolve, reject) => {
            ipcRenderer.invoke('openExternal', url).then(() => {
                resolve();
            }).catch((error: Error) => {
                reject(error);
            });
        });
    },
    openIssues: async () => {
        return ipcRenderer.invoke('openIssues');
    },
    openCommunityDiscussions: async () => {
        return ipcRenderer.invoke('openCommunityDiscussions');
    },
    getPlatformName: async (): Promise<string> => {
        return ipcRenderer.invoke('getPlatformName')
    },
    checkWslAvailable: async () => {
        return new Promise<boolean>((resolve, reject) => {
            ipcRenderer.invoke('checkWslAvailable').then((result: boolean) => {
                resolve(result);
            }).catch((error: Error) => {
                reject(error);
            });
        });
    },
    runMockProcess: async () => {
        return new Promise<number>((resolve, reject) => {
            ipcRenderer.invoke('runMockProcess').then((code: number) => {
                resolve(code);
            }).catch((code: number) => {
                reject(code);
            });
        });
    },
    handleFolderOpen: async (defaultPath?: string) => {
        return new Promise<string>((resolve, reject) => {
            ipcRenderer.invoke('dialog:handleFolderOpen', defaultPath).then((result: string) => {
                resolve(result);
            }).catch((error: Error) => {
                reject(error);
            });
        });
    },
    handleFileOpen: async () => {
        return new Promise<string>((resolve, reject) => {
            ipcRenderer.invoke('dialog:handleFileOpen').then((result: string) => {
                resolve(result);
            }).catch((error: Error) => {
                reject(error);
            });
        });
    },
    getBackend: async (): Promise<IBackend> => {
        return ipcRenderer.invoke('getBackend');
    },
    checkBackendConnection: async () => {
        return ipcRenderer.invoke('checkBackendConnection');
    },
    checkInternetAccess: async (): Promise<InternetWarning | null> => {
        return ipcRenderer.invoke('checkInternetAccess');
    },
    setBackendByType: async (backendType: string) => {
        return ipcRenderer.invoke('setBackendByType', backendType);
    },
    resetBackend: async () => {
        return ipcRenderer.invoke('resetBackend');
    },
    getBackendVersion: async (): Promise<string> => {
        return ipcRenderer.invoke('getBackendVersion');
    },
    loadStudiesFromBaseDirectory: async (): Promise<IFileSystemNode[]> => {
        return ipcRenderer.invoke('loadStudiesFromBaseDirectory');
    },
    initializeEnvironment: async (environment: Environment) => {
        return ipcRenderer.invoke('initializeEnvironment', environment);
    },
    getCompatibleReleaseTagStrings: async (environment: Environment): Promise<string[]> => {
        return ipcRenderer.invoke('getCompatibleReleaseTagStrings', environment);
    },
    getFixedImageTagString: async (environment: Environment): Promise<string> => {
        return ipcRenderer.invoke('getFixedImageTagString', environment);
    },
    setFixedImageTagString: async (environment: Environment, tag: string) => {
        return ipcRenderer.invoke('setFixedImageTagString', environment, tag);
    },
    getAssociatedImages: async (environment: Environment): Promise<IImage[]> => {
        return ipcRenderer.invoke('getAssociatedImages', environment);
    },
    deleteImage: async (name: string, tag: string) => {
        return ipcRenderer.invoke('deleteImage', name, tag);
    },
    deleteAllDistributionTarFiles: async (environment: Environment): Promise<number> => {
        return ipcRenderer.invoke('deleteAllDistributionTarFiles', environment);
    },
    publishTacticAnalysisMode: async (analysisMode: TacticAnalysisMode) => {
        return ipcRenderer.invoke('tactic:setAnalysisMode', analysisMode);
    },
    publishTacticPreprocessToIndividualZOTUs: async (preprocessIndividualZOTUs: boolean) => {
        return ipcRenderer.invoke('tactic:setPreprocessToIndividualZOTUs', preprocessIndividualZOTUs);
    },
    publishTacticSkipNonBacterialFilter: async (skipNonBacterialFilter: boolean) => {
        return ipcRenderer.invoke('tactic:setSkipNonBacterialFilter', skipNonBacterialFilter);
    },
    getTacticAnalysisMode: async (): Promise<TacticAnalysisMode> => {
        return ipcRenderer.invoke('tactic:getAnalysisMode');
    },
    publishTacticBaseDirectory: async (baseDirectory: string) => {
        return ipcRenderer.invoke('tactic:setBaseDirectory', baseDirectory);
    },
    publishTacticAnalysisDirectory: async (analysisDirectory: string) => {
        return ipcRenderer.invoke('tactic:setAnalysisDirectory', analysisDirectory);
    },
    publishSpikeInSequencesDirectory: async (spikeInSequencesDirectory: string) => {
        return ipcRenderer.invoke('tactic:setSpikeInSequencesDirectory', spikeInSequencesDirectory);
    },
    openTacticAnalysisDirectory: async () => {
        return ipcRenderer.invoke('tactic:openAnalysisDirectory');
    },
    getTacticBaseDirectory: async (): Promise<string> => {
        return ipcRenderer.invoke('tactic:getBaseDirectory');
    },
    publishSamples: async (samples: IFileSystemNode[]) => {
        return ipcRenderer.invoke('tactic:setSamples', samples);
    },
    publishSpikeMode: async (spikeModeName: string) => {
        return ipcRenderer.invoke('tactic:setSpikeMode', spikeModeName);
    },
    openMappingFile: async () => {
        return ipcRenderer.invoke('tactic:openMappingFile');
    },
    convertMapping: async () => {
        return ipcRenderer.invoke('tactic:convertMapping');
    },
    checkMappingFile: async () => {
        return ipcRenderer.invoke('tactic:checkMapping');
    },
    getTacticDefaultParameters: async () =>{
        return ipcRenderer.invoke('tactic:getDefaultParameters');
    },
    publishTacticParameters: async (parameters: ITacticArguments) => {
        return ipcRenderer.invoke('tactic:setParameters', parameters);
    },
    publishTacticThreads: async (threads: number) => {
        return ipcRenderer.invoke('tactic:setThreads', threads);
    },
    runTactic: async () => {
        return ipcRenderer.invoke('tactic:run');
    },
    terminateTacticBackend: async () => {
        return new Promise<void>((resolve, reject) => {
            ipcRenderer.invoke('tactic:terminateBackend').then(() => {
                logToDevTools("tactic terminated (preload)")
                resolve();
            }).catch(() => {
                reject();
            });
        });
    },
    openExternalLink: async (url: string) => {
        return ipcRenderer.invoke('openExternalLink', url);
    },
    confirmStartOver: async (): Promise<boolean> => {
        return ipcRenderer.invoke('confirmStartOver');
    },
    selectPipelineVersion: async (environment: Environment): Promise<{ version: string, pinned: boolean, warning: string | null }> => {
        return ipcRenderer.invoke('selectPipelineVersion', environment);
    },
    changeEnvironment: async (environment: Environment | null) => {
        return ipcRenderer.invoke('changeEnvironment', environment);
    },
    // main to renderer
    handleChangeRouteTo: (callback: (route: string) => void) => {
        ipcRenderer.on('changeRouteTo', (event, route) => {
            callback(route);
        });
    },
    handleLogRequests: (callback: (log: string, level: string) => void) => {
        ipcRenderer.on('logRequest', (event, log: string, level: string) => {
            callback(log, level);
        });
    },
    handleProgressUpdate: (callback: (progress: Progress) => void) => {
        ipcRenderer.on('progressUpdate', (event, progress: Progress) => {
            callback(progress);
        });
    },
    handleEnvChange: (callback: (environment: Environment | null, version: string) => void) => {
        ipcRenderer.on('envChange', (event, environment: Environment | null, version: string) => {
            callback(environment, version);
        });
    },
    handleLogsForEnvironment: (callback: (environment: Environment, logMessage: string) => void) => {
        ipcRenderer.on('logsForEnvironment', (event, environment: Environment, logMessage: string) => {
            callback(environment, logMessage);
        });
    },
    handleUpdateState: (callback: (state: UpdateState) => void) => {
        const listener = (event: Electron.IpcRendererEvent, state: UpdateState) => {
            callback(state);
        };
        ipcRenderer.on('updateState', listener);
        // return a function to remove the listener again
        return () => {
            ipcRenderer.removeListener('updateState', listener);
        };
    },
    handleLogToSection: (callback: (section: LogSection, logMessage: string) => void) => {
        ipcRenderer.removeAllListeners('logForSection');
        ipcRenderer.on('logForSection', (event, section: LogSection, logMessage: string) => {
            callback(section, logMessage);
        });
    }
}

contextBridge.exposeInMainWorld('indexBridge', indexBridge);
