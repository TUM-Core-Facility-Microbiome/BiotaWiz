// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import {contextBridge, ipcRenderer} from "electron";
import {Environment, Imngs2CoreAnalysisMode} from "./enums";
import {logToDevTools} from "./utils/logHandler";

const indexBridge = {
    // renderer to main
    updateAvailable: async (): Promise<string> => {
        return ipcRenderer.invoke('app:updateAvailable');
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
    handleFolderOpen: async () => {
        return new Promise<string>((resolve, reject) => {
            ipcRenderer.invoke('dialog:handleFolderOpen').then((result: string) => {
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
    publishImngs2CoreAnalysisMode: async (analysisMode: Imngs2CoreAnalysisMode) => {
        return ipcRenderer.invoke('imngs2core:setAnalysisMode', analysisMode);
    },
    getImngs2CoreAnalysisMode: async (): Promise<Imngs2CoreAnalysisMode> => {
        return ipcRenderer.invoke('imngs2core:getAnalysisMode');
    },
    publishImngs2CoreBaseDirectory: async (baseDirectory: string) => {
        return ipcRenderer.invoke('imngs2core:setBaseDirectory', baseDirectory);
    },
    publishImngs2CoreAnalysisDirectory: async (analysisDirectory: string) => {
        return ipcRenderer.invoke('imngs2core:setAnalysisDirectory', analysisDirectory);
    },
    openImngs2CoreAnalysisDirectory: async () => {
        return ipcRenderer.invoke('imngs2core:openAnalysisDirectory');
    },
    getImngs2CoreBaseDirectory: async (): Promise<string> => {
        return ipcRenderer.invoke('imngs2core:getBaseDirectory');
    },
    publishSamples: async (samples: IFileSystemNode[]) => {
        return ipcRenderer.invoke('imngs2core:setSamples', samples);
    },
    publishSpikeMode: async (spikeModeName: string) => {
        return ipcRenderer.invoke('imngs2core:setSpikeMode', spikeModeName);
    },
    openMappingFile: async () => {
        return ipcRenderer.invoke('imngs2core:openMappingFile');
    },
    checkMappingFile: async () => {
        return ipcRenderer.invoke('imngs2core:checkMapping');
    },
    getImngs2coreDefaultParameters: async () =>{
        return ipcRenderer.invoke('imngs2core:getDefaultParameters');
    },
    publishImngs2CoreParameters: async (parameters: IImngs2CoreArguments) => {
        return ipcRenderer.invoke('imngs2core:setParameters', parameters);
    },
    publishImngs2CoreThreads: async (threads: Number) => {
        return ipcRenderer.invoke('imngs2core:setThreads', threads);
    },
    runImngs2Core: async () => {
        return ipcRenderer.invoke('imngs2core:run');
    },
    terminateImngs2CoreBackend: async () => {
        return new Promise<void>((resolve, reject) => {
            ipcRenderer.invoke('imngs2core:terminateBackend').then(() => {
                logToDevTools("imngs2core terminated (preload)")
                resolve();
            }).catch(() => {
                reject();
            });
        });
    },
    openExternalLink: async (url: string) => {
        return ipcRenderer.invoke('openExternalLink', url);
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
    }
}

contextBridge.exposeInMainWorld('indexBridge', indexBridge);
