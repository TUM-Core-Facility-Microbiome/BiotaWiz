import {getDefaultBackend} from "./backend";
import storage from "electron-json-storage";

export function getBackend() {
    return new Promise<IBackend>((resolve, reject) => {
        console.debug("getBackend");
        let backendInStorage = null;
        storage.get('backend', (error, data) => {
            if (data) {
                backendInStorage = data;
            }
        });

        if (backendInStorage != null && backendInStorage != {}) {
            console.debug("Resolving backend from storage");
            resolve(backendInStorage);
        } else {
            console.debug("Resolving default backend");
            const defaultBackend = getDefaultBackend();
            storage.set('backend', defaultBackend, (error) => {
                console.error(error);
            });
            resolve(getDefaultBackend());
        }
    });
}
