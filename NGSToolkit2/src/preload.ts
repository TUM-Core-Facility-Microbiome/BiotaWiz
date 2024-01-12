// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import {contextBridge, ipcRenderer} from "electron";


const indexBridge = {
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
    getBackendVersion: async (): Promise<string> => {
        return ipcRenderer.invoke('getBackendVersion');
    },
    loadStudiesFromBaseDirectory: async (baseDirectory: string): Promise<IFileSystemNode[]> => {
        return ipcRenderer.invoke('loadStudiesFromBaseDirectory', baseDirectory);
    },
    initializeBackend: async () => {
        return ipcRenderer.invoke('initializeBackend');
    },
    // main to renderer
    handleChangeRouteTo: (callback: (route: string) => void) => {
        ipcRenderer.on('changeRouteTo', (event, route) => {
            callback(route);
        });
    },
    handleLogRequests: (callback: (log: string, level: string) => void) => {
        ipcRenderer.on('logRequests', (event, log: string, level: string) => {
            callback(log, level);
        });
    },
}

contextBridge.exposeInMainWorld('indexBridge', indexBridge);
