import {getDefaultBackend} from "./backend";
import jsonStorage from "electron-json-storage";

function isEmpty(obj: object) {
    for (const prop in obj) {
        if (Object.hasOwn(obj, prop)) {
            return false;
        }
    }

    return true;
}

export function getBackend() {
    console.debug("getBackend");
    let backendInStorage = null;
    jsonStorage.get('backend', (error, data) => {
        if (data) {
            backendInStorage = data;
        }
    });

    if (backendInStorage != null && backendInStorage != {}) {
        console.debug("Resolving backend from storage");
        return backendInStorage;
    } else {
        console.debug("Resolving default backend");
        const defaultBackend = getDefaultBackend();
        jsonStorage.set('backend', defaultBackend, (error) => {
            console.error(error);
        });
        return getDefaultBackend();
    }
}

export function setTicBaseDirectory(baseDirectory: string) {
    return new Promise<void>((resolve, reject) => {
        const baseDirectoryObj: ITicBaseDirectory = {path: baseDirectory};

        jsonStorage.set('ticBaseDirectory', baseDirectoryObj, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

export function getTicBaseDirectory() {
    return new Promise<string>((resolve, reject) => {
        jsonStorage.get('ticBaseDirectory', (error, data: ITicBaseDirectory) => {
            if (error) {
                reject(error);
            } else {
                resolve(data.path);
            }
        });
    });
}

export function setImageTag(version: SemanticVersion) {
    return new Promise<void>((resolve, reject) => {
        if (version == null) {
            reject("Version cannot be null");
        }
        jsonStorage.set('imageTag', version, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

export function getImageTag() {
    const imageTag = jsonStorage.getSync('imageTag');
    if (isEmpty(imageTag)) {
        console.debug(`No image tag found in storage at ${jsonStorage.getDataPath()}`);
        return null;
    } else {
        console.debug(`Resolving image tag from storage at ${jsonStorage.getDataPath()}`);
        return imageTag as SemanticVersion;
    }
}