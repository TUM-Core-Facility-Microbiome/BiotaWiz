import {app} from "electron";
import path from 'path';
import {byOS, platforms} from "./platform";

/**
 * Returns the directory with the pipeline's databases, mounted to /base/databases when running the pipeline.
 */
export function getDatabaseDirectory(): string {
    return path.join(app.getPath("appData"), app.getName(), "resources", "databases");
}

/**
 * Returns the directory for large application data that should not roam with the user profile, e.g., WSL distributions.
 *
 * On Windows, this is %LOCALAPPDATA%\BiotaWiz-Data. It must not be %LOCALAPPDATA%\BiotaWiz: that is the installation
 * folder of Squirrel, which deletes it when the application is installed again.
 * If LOCALAPPDATA is not set, and on other platforms, Electron's userData directory is used.
 */
export function getLocalDataPath(): string {
    return (byOS({
        [platforms.WINDOWS]: () => {
            const localAppData = process.env.LOCALAPPDATA;
            if (localAppData === undefined) {
                return app.getPath('userData');  // fallback when environment variable is not set
            }
            return path.join(localAppData, `${app.name}-Data`);
        },
        default: () => app.getPath('userData'),
    }) as () => string)();
}

/**
 * Returns the directory where the WSL distributions are stored.
 */
export function getWslDistributionRoot(): string {
    return path.join(getLocalDataPath(), 'wsl-distro');
}

/**
 * Returns the directory where the downloaded pipeline files (WSL images) and their checksum records are stored.
 * Not the temp folder, which Windows cleans up on its own.
 */
export function getPipelineDownloadRoot(): string {
    return path.join(getLocalDataPath(), 'downloads');
}

/**
 * Returns the directory where versions up to 1.0.1-rc.1 stored the WSL distributions, inside the installation folder
 * of Squirrel, or null if there is none.
 */
export function getLegacyWslDistributionRoot(): string | null {
    return (byOS({
        [platforms.WINDOWS]: () => {
            const localAppData = process.env.LOCALAPPDATA;
            return localAppData === undefined ? null : path.join(localAppData, app.name, 'wsl-distro');
        },
        default: () => null,
    }) as () => string | null)();
}
