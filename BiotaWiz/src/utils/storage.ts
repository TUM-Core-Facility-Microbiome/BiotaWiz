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

export async function storeBackend(backend: IBackend) {
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

export function setTacticBaseDirectory(baseDirectory: string) {
    return new Promise<void>((resolve, reject) => {
        const baseDirectoryObj: ITacticBaseDirectory = {path: baseDirectory};

        jsonStorage.set('tacticBaseDirectory', baseDirectoryObj, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

export function getTacticBaseDirectory() {
    return new Promise<string>((resolve, reject) => {
        jsonStorage.get('tacticBaseDirectory', (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve((data as ITacticBaseDirectory).path);
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

export function setCurrentImageTag(environment: Environment, version: string) {
    return new Promise<void>((resolve, reject) => {
        if (version == null) {
            reject("Version cannot be null");
        }
        const imageTag: IImageTag = {version: version};
        jsonStorage.set(`imageTag-current-${environment}`, imageTag, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

export function getCurrentImageTag(environment: Environment) {
    const imageTag = jsonStorage.getSync(`imageTag-current-${environment}`);
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
export function setAutoUpdateCheck(enabled: boolean) {
    return new Promise<void>((resolve, reject) => {
        jsonStorage.set('autoUpdateCheck', {enabled: enabled}, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Developer setting: whether release candidates (pre-releases) of the pipeline are offered. Disabled by default.
 */
export function getShowPipelinePrereleases(): boolean {
    const setting = jsonStorage.getSync('showPipelinePrereleases') as { enabled?: boolean };
    return setting?.enabled === true;
}

export function setShowPipelinePrereleases(enabled: boolean) {
    return new Promise<void>((resolve, reject) => {
        jsonStorage.set('showPipelinePrereleases', {enabled: enabled}, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Whether the application should check for updates automatically. Enabled by default.
 */
export function getAutoUpdateCheck(): boolean {
    const setting = jsonStorage.getSync('autoUpdateCheck') as { enabled?: boolean };
    return setting?.enabled !== false;
}
