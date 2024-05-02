import {getDefaultBackend} from "./backend";
import jsonStorage from "electron-json-storage";
import {semVerFromGitHubTag} from "./releasetag";
import {Environment} from "../enums";

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

            if (backendInStorage != null && !isEmpty(backendInStorage)) {
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

export function setImngs2CoreBaseDirectory(baseDirectory: string) {
    return new Promise<void>((resolve, reject) => {
        const baseDirectoryObj: IImngs2CoreBaseDirectory = {path: baseDirectory};

        jsonStorage.set('imngs2coreBaseDirectory', baseDirectoryObj, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

export function getImngs2CoreBaseDirectory() {
    return new Promise<string>((resolve, reject) => {
        jsonStorage.get('imngs2coreBaseDirectory', (error, data: IImngs2CoreBaseDirectory) => {
            if (error) {
                reject(error);
            } else {
                resolve(data.path);
            }
        });
    });
}

export function setImageTag(environment: Environment, version: string) {
    return new Promise<void>((resolve, reject) => {
        if (version == null) {
            reject("Version cannot be null");
        }
        const imageTag: IImageTag = {version: version};
        jsonStorage.set(`imageTag-${environment}`, imageTag, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

export function deleteImageTag(environment: Environment) {
    return new Promise<void>((resolve, reject) => {
        jsonStorage.remove(`imageTag-${environment}`, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

export function getImageTag(environment: Environment) {
    const imageTag = jsonStorage.getSync(`imageTag-${environment}`);
    console.log(`In storage: ${JSON.stringify(imageTag)}`);
    if (isEmpty(imageTag)) {
        console.debug(`No image tag found in storage at ${jsonStorage.getDataPath()}`);
        return null;
    } else {
        console.debug(`Resolving image tag from storage at ${jsonStorage.getDataPath()}`);
        if ((imageTag as IImageTag).version == null) {
            return null;
        }
        // reconstruct the SemVer object
        return semVerFromGitHubTag((imageTag as IImageTag).version);
    }
}
