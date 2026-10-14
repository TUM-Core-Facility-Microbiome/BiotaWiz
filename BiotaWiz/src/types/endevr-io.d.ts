// Type declarations for the @endevr-io WSL packages, which do not ship their own.
// Only the functions used by this application are declared.

declare module '@endevr-io/wsl-api' {
    interface ListVerboseObject {
        default: boolean;
        name: string;
        state: string;
        version: number;
    }

    function listVerbose(): Promise<ListVerboseObject[]>;
    function isInstalled(distribution: string): Promise<boolean>;
    function setVersion(distribution: string, version: number): Promise<void>;
    function runDistribution(distribution?: string | null, user?: string | null): Promise<void>;
    function waitForRunning(distribution: string, poll?: number): Promise<void>;
    function unregister(distribution: string): Promise<void>;

    const wsl: {
        listVerbose: typeof listVerbose;
        isInstalled: typeof isInstalled;
        setVersion: typeof setVersion;
        runDistribution: typeof runDistribution;
        waitForRunning: typeof waitForRunning;
        unregister: typeof unregister;
    };
    export default wsl;
}

declare module '@endevr-io/wsl-path' {
    export function windowsToWsl(absolutePath: string): string;
    export function wslToWindows(absolutePath: string): string;
}
