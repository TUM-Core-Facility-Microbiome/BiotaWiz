import {app} from "electron";
import path from 'path';
import {byOS, platforms} from "../platform";

/**
 * Returns the path to the user's application data directory.
 *
 * This function first checks if the LOCALAPPDATA environment variable is set.
 * This folder is used for application data that should not roam with the user profile.
 * If it is not set, it falls back to using Electron's app.getPath('userData') method.
 * The 'userData' path is a directory for storing user data, such as settings, databases, etc.
 *
 * @returns {string} The path to the user's application data directory.
 */
export function getLocalAppDataPath() {
    return byOS({
        [platforms.WINDOWS]: () => {
            // avoid using userData as this is a roaming profile, try using an app folder in %LOCALAPPDATA%
            const localAppData = process.env.LOCALAPPDATA;
            if (localAppData === undefined) {
                return app.getPath('userData');  // fallback when environment variable is not set
            }
            return path.join(localAppData, app.name);
        },
        default: () => app.getPath('userData'),
    })();
}
