import {getDefaultBackend} from "./backend";
import jsonStorage from "electron-json-storage";
import {SemVer} from "semver";

function isEmpty(obj: object) {
    for (const prop in obj) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (Object.hasOwn(obj, prop)) {
            return false;
        }
    }

    return true;
}


export async function setBackend(backend: IBackend) {
    return new Promise<void>((resolve, reject) => {
        jsonStorage.set('backend', backend, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}


export async function getBackend() {
    return new Promise<IBackend>((resolve, reject) => {
        jsonStorage.get('backend', (error, data) => {
            if (error) {
                console.error(error);
                reject("Could not get backend from storage or default");
            }

            let backendInStorage = null;
            if (data) {
                backendInStorage = data;
            }

            if (backendInStorage != null && backendInStorage != {}) {
                console.debug("Resolving backend from storage");
                resolve(backendInStorage as IBackend);
            } else {
                console.debug("Resolving default backend");
                const defaultBackend = getDefaultBackend();
                jsonStorage.set('backend', defaultBackend, (error) => {
                    console.error(error);
                });
                resolve(defaultBackend);
            }
        });
    });
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

export function setImageTag(version: SemVer) {
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
        return imageTag as SemVer;
    }
}