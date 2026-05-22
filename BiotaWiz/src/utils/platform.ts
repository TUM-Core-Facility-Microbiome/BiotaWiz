// adapted from https://www.freecodecamp.org/news/how-to-write-os-specific-code-in-electron-bf6379c62ff6/
import * as os from 'os';
import {findHandlerOrDefault} from "./handler";

export const platforms: IDictionary<string> = {
    WINDOWS: 'WINDOWS',
    MAC: 'MAC',
    LINUX: 'LINUX',
    SUN: 'SUN',
    OPENBSD: 'OPENBSD',
    ANDROID: 'ANDROID',
    AIX: 'AIX',
};

// mapping of os.platform() names to our platforms
const osIdentifierMapping: IDictionary<string> = {
    win32: platforms.WINDOWS,
    darwin: platforms.MAC,
    linux: platforms.LINUX,
    sunos: platforms.SUN,
    openbsd: platforms.OPENBSD,
    android: platforms.ANDROID,
    aix: platforms.AIX,
};

// current platform to match against a given object with handlers
const currentPlatform: string = osIdentifierMapping[os.platform()];

export const byOS = findHandlerOrDefault.bind(null, currentPlatform);

// usage
export const getPlatform: () => string = (byOS({
    [platforms.LINUX]: () => platforms.LINUX,
    [platforms.WINDOWS]: () => platforms.WINDOWS,
    [platforms.MAC]: () => platforms.MAC,
    default: () => `unknown`,
}) as () => string);
