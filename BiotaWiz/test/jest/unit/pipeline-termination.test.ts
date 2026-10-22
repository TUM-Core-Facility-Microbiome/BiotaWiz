import * as os from "os";
import {Environment} from "../../../src/enums";
import {terminateBackend} from "../../../src/utils/backend";

// backend.ts pulls in Electron and the settings storage, which cannot run outside of Electron
jest.mock('electron', () => ({
    app: {getPath: () => os.tmpdir()},
    BrowserWindow: {fromId: () => null},
}));
jest.mock('../../../src/utils/storage', () => ({
    getBackend: async () => ({type: 'WSL', name: 'Windows Subsystem for Linux', command: 'wsl', argsPrefix: []}),
}));
const mockRunSubprocess = jest.fn();
jest.mock('../../../src/utils/process', () => ({
    runSubprocess: (...args: unknown[]) => mockRunSubprocess(...args),
}));

const DISTRIBUTION = 'mpourjam.tactic-pipeline_1.0.0';

/**
 * Simulate wsl.exe with the given running distributions. Distributions in `stuck` ignore --terminate.
 */
function simulateWsl(running: string[], stuck: string[] = []) {
    mockRunSubprocess.mockImplementation(async (command: string, args: string[], logHandler?: (msg: string, isStderr: boolean) => void) => {
        if (args.join(' ') === '--list --running --quiet') {
            // WSL writes UTF-16, which shows up with null bytes
            logHandler?.(running.map((name) => name.split('').join('\x00')).join('\x00\r\x00\n\x00'), false);
            return running.length > 0 ? 0 : 1;
        }
        if (args[0] === '--terminate') {
            if (!stuck.includes(args[1])) {
                running = running.filter((name) => name !== args[1]);
            }
            return 0;
        }
        throw new Error(`unexpected call: ${command} ${args.join(' ')}`);
    });
}

function terminatedDistributions() {
    return mockRunSubprocess.mock.calls.filter((call) => call[1][0] === '--terminate').map((call) => call[1][1]);
}

afterEach(() => {
    jest.useRealTimers();
    mockRunSubprocess.mockReset();
});

describe('stopping the pipeline in WSL', () => {
    test('terminates the running distributions of the application and leaves others alone', async () => {
        simulateWsl([DISTRIBUTION, 'Ubuntu']);
        await terminateBackend(Environment.TACTIC);
        expect(terminatedDistributions()).toEqual([DISTRIBUTION]);
    });

    test('does nothing if no distribution of the application is running', async () => {
        simulateWsl(['Ubuntu']);
        await terminateBackend(Environment.TACTIC);
        expect(terminatedDistributions()).toEqual([]);
    });

    test('fails if the distribution does not stop', async () => {
        jest.useFakeTimers();
        simulateWsl([DISTRIBUTION], [DISTRIBUTION]);
        const result = expect(terminateBackend(Environment.TACTIC)).rejects.toThrow(
            `The pipeline did not stop within 30 seconds (still running: ${DISTRIBUTION}).`
        );
        await jest.advanceTimersByTimeAsync(31 * 1000);
        await result;
    });
});
