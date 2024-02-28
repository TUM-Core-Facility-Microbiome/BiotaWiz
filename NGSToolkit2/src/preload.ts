// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import {contextBridge, ipcRenderer} from "electron";
import {Environment} from "./enums";

const indexBridge = {
    // renderer to main
    openExternal: async (url: string) => {
        return new Promise<void>((resolve, reject) => {
            ipcRenderer.invoke('openExternal', url).then(() => {
                resolve();
            }).catch((error: Error) => {
                reject(error);
            });
        });
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
    getBackend: async (): Promise<IBackend> => {
        return ipcRenderer.invoke('getBackend');
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
    publishTicBaseDirectory: async (baseDirectory: string) => {
        return ipcRenderer.invoke('publish:ticBaseDirectory', baseDirectory);
    },
    publishSamples: async (samples: IFileSystemNode[]) => {
        return ipcRenderer.invoke('publish:ticSamples', samples);
    },
    publishSpikeMode: async (spikeModeName: string) => {
        return ipcRenderer.invoke('publish:spikeMode', spikeModeName);
    },
    publishTicParameters: async (parameters: ITicPipelineArguments) => {
        return ipcRenderer.invoke('publish:ticParameters', parameters);
    },
    runTicPipeline: async () => {
        return ipcRenderer.invoke('tic:run');
    },
    openExternalLink: async (url: string) => {
        return ipcRenderer.invoke('openExternalLink', url);
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
    handleLogsForEnvironment: (callback: (environment: Environment, logMessage: string) => void) => {
        ipcRenderer.on('logsForEnvironment', (event, environment: Environment, logMessage: string) => {
            callback(environment, logMessage);
        });
    }
}

contextBridge.exposeInMainWorld('indexBridge', indexBridge);
