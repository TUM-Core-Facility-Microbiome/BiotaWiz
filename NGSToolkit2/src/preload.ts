// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import {contextBridge, ipcRenderer} from "electron";


const indexBridge = {
    getPlatformName: async () => {
        return new Promise<string> ((resolve, reject) => {
            ipcRenderer.invoke('getPlatformName').then((result: string) => {
                resolve(result);
            }).catch((error: Error) => {
                reject(error);
            });
        });
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
        return new Promise<void> ((resolve, reject) => {
            ipcRenderer.invoke('runMockProcess').then(() => {
                resolve();
            }).catch((error: Error) => {
                reject(error);
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
    }
}

contextBridge.exposeInMainWorld('indexBridge', indexBridge);
