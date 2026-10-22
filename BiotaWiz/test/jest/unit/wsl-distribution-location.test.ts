import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// simulate Windows: backend.ts and helpers.ts pull in Electron and the settings storage
jest.mock('electron', () => ({
    app: {getPath: () => require('os').tmpdir(), name: 'BiotaWiz', getName: () => 'BiotaWiz'},
    BrowserWindow: {fromId: () => null},
}));
jest.mock('../../../src/utils/platform', () => ({
    platforms: {WINDOWS: 'WINDOWS', MAC: 'MAC', LINUX: 'LINUX'},
    byOS: (handlers: Record<string, unknown>) => handlers.WINDOWS ?? handlers.default,
    getPlatform: () => 'WINDOWS',
}));
jest.mock('../../../src/utils/storage', () => ({
    getBackend: async () => ({type: 'WSL', name: 'Windows Subsystem for Linux', command: 'wsl', argsPrefix: []}),
}));
const mockRunSubprocess = jest.fn();
jest.mock('../../../src/utils/process', () => ({
    runSubprocess: (...args: unknown[]) => mockRunSubprocess(...args),
}));

const DISTRIBUTION = 'mpourjam.tactic-pipeline_1.0.0';
let localAppData: string;

/**
 * Simulate wsl.exe with the given registered distributions.
 */
function simulateWsl(registered: string[], {canMove = true} = {}) {
    mockRunSubprocess.mockImplementation(async (command: string, args: string[], logHandler?: (msg: string, isStderr: boolean) => void) => {
        if (args[0] === '--list') {
            logHandler?.(registered.map((name) => name.split('').join('\x00')).join('\x00\r\x00\n\x00'), false);
            return registered.length > 0 ? 0 : 1;
        }
        if (args[0] === '--terminate') {
            return 0;
        }
        if (args[0] === '--manage') {
            return canMove ? 0 : 1;  // older WSL versions do not know --manage
        }
        if (args[0] === '--unregister') {
            registered = registered.filter((name) => name !== args[1]);
            return 0;
        }
        throw new Error(`unexpected call: ${command} ${args.join(' ')}`);
    });
}

function wslCalls(subcommand: string) {
    return mockRunSubprocess.mock.calls.filter((call) => call[1][0] === subcommand).map((call) => call[1].slice(1));
}

/**
 * Create a distribution in the folder used up to 1.0.1-rc.1, inside the installation folder of Squirrel.
 */
function createLegacyDistribution(name: string) {
    const directory = path.join(localAppData, 'BiotaWiz', 'wsl-distro', name);
    fs.mkdirSync(directory, {recursive: true});
    fs.writeFileSync(path.join(directory, 'ext4.vhdx'), 'disk');
    return directory;
}

function loadBackend() {
    // load anew, so that the migration, which runs once per start, runs again
    return require('../../../src/utils/backend') as typeof import('../../../src/utils/backend');
}

beforeEach(() => {
    jest.resetModules();
    localAppData = fs.mkdtempSync(path.join(os.tmpdir(), 'biotawiz-localappdata-'));
    process.env.LOCALAPPDATA = localAppData;
    mockRunSubprocess.mockReset();
});

afterEach(() => {
    fs.rmSync(localAppData, {recursive: true, force: true});
    delete process.env.LOCALAPPDATA;
});

describe('location of the WSL distributions', () => {
    test('is outside the installation folder of Squirrel', () => {
        const {getWslDistributionRoot} = require('../../../src/utils/helpers');
        expect(getWslDistributionRoot()).toBe(path.join(localAppData, 'BiotaWiz-Data', 'wsl-distro'));
    });
});

describe('migrating distributions out of the installation folder', () => {
    test('moves a registered distribution and removes the old folder', async () => {
        const legacy = createLegacyDistribution(DISTRIBUTION);
        simulateWsl([DISTRIBUTION, 'Ubuntu']);
        await loadBackend().ensureWslDistributionsMigrated();
        expect(wslCalls('--manage')).toEqual([[DISTRIBUTION, '--move', path.join(localAppData, 'BiotaWiz-Data', 'wsl-distro', DISTRIBUTION)]]);
        expect(wslCalls('--unregister')).toEqual([]);
        expect(fs.existsSync(legacy)).toBe(false);
        expect(fs.existsSync(path.join(localAppData, 'BiotaWiz', 'wsl-distro'))).toBe(false);
    });

    test('unregisters a distribution that this WSL version cannot move', async () => {
        const legacy = createLegacyDistribution(DISTRIBUTION);
        simulateWsl([DISTRIBUTION], {canMove: false});
        await loadBackend().ensureWslDistributionsMigrated();
        expect(wslCalls('--unregister')).toEqual([[DISTRIBUTION]]);
        expect(fs.existsSync(legacy)).toBe(false);
    });

    test('removes leftovers of distributions that are not registered anymore', async () => {
        const legacy = createLegacyDistribution(DISTRIBUTION);
        simulateWsl(['Ubuntu']);
        await loadBackend().ensureWslDistributionsMigrated();
        expect(wslCalls('--manage')).toEqual([]);
        expect(wslCalls('--unregister')).toEqual([]);
        expect(fs.existsSync(legacy)).toBe(false);
    });

    test('does nothing when there is no old folder', async () => {
        simulateWsl([DISTRIBUTION]);
        await loadBackend().ensureWslDistributionsMigrated();
        expect(mockRunSubprocess).not.toHaveBeenCalled();
    });

    test('runs only once per start of the application', async () => {
        createLegacyDistribution(DISTRIBUTION);
        simulateWsl([DISTRIBUTION]);
        const backend = loadBackend();
        await Promise.all([backend.ensureWslDistributionsMigrated(), backend.ensureWslDistributionsMigrated()]);
        expect(wslCalls('--manage')).toHaveLength(1);
    });
});

describe('removing the distributions on uninstall', () => {
    test('unregisters only the distributions of the application and deletes their folder', async () => {
        const root = path.join(localAppData, 'BiotaWiz-Data', 'wsl-distro');
        fs.mkdirSync(path.join(root, DISTRIBUTION), {recursive: true});
        simulateWsl([DISTRIBUTION, 'mpourjam.tactic-pipeline_0.7.6', 'Ubuntu']);
        await loadBackend().removeWslDistributions(require('../../../src/enums').Environment.TACTIC);
        expect(wslCalls('--unregister')).toEqual([[DISTRIBUTION], ['mpourjam.tactic-pipeline_0.7.6']]);
        expect(fs.existsSync(root)).toBe(false);
    });
});
