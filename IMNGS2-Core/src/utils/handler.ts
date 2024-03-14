// find a handler for the current platform or return the default handler
// adapted from https://www.freecodecamp.org/news/how-to-write-os-specific-code-in-electron-bf6379c62ff6/
export function findHandlerOrDefault<T>(handlerName: string, dictionary: IDictionary<() => T>): () => T {
    const handler = dictionary[handlerName];

    if (handler) {
        return handler;
    }

    if (dictionary.default) {
        return dictionary.default;
    }

    return () => {
        throw new Error(`No handler for ${handlerName} found`);
    };
}
