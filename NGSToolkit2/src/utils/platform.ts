// adapted from https://www.freecodecamp.org/news/how-to-write-os-specific-code-in-electron-bf6379c62ff6/
import * as os from 'os';

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

// find a handler for the current platform or return the default handler
const findHandlerOrDefault = (handlerName: string, dictionary: IDictionary<() => never>): () => never => {
    const handler = dictionary[handlerName];

    if (handler) {
        return handler;
    }

    if (dictionary.default) {
        return dictionary.default;
    }

    return () => {
        throw new Error(`No handler for platform ${handlerName} found`);
    };
};

export const byOS = findHandlerOrDefault.bind(null, currentPlatform);

// usage
export const getPlatform: () => string = byOS({
    [platforms.LINUX]: () => platforms.LINUX,
    [platforms.WINDOWS]: () => platforms.WINDOWS,
    [platforms.MAC]: () => platforms.MAC,
    default: () => `unknown`,
});
