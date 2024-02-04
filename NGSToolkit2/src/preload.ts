// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import {contextBridge, ipcRenderer} from "electron";


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
        return new Promise<boolean> ((resolve, reject) => {
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
        return new Promise<string> ((resolve, reject) => {
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
    initializeBackend: async () => {
        return ipcRenderer.invoke('initializeBackend');
    },
    publishTicBaseDirectory: async (baseDirectory: string) => {
        return ipcRenderer.invoke('publish:ticBaseDirectory', baseDirectory);
    },
    publishSpikeMode: async (spikeModeName: string) => {
        return ipcRenderer.invoke('publish:spikeMode', spikeModeName);
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
}

contextBridge.exposeInMainWorld('indexBridge', indexBridge);
