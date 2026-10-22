import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {parse} from "yaml";
import {TacticAnalysisMode} from "../../../src/enums";
import {ARGUMENT_FILE_FOOTER, TacticConfiguration} from "../../../src/utils/tacticConfiguration";

// tacticConfiguration.ts pulls in Electron and the backend, which cannot run outside of Electron
jest.mock('electron', () => ({
    app: {getPath: () => os.tmpdir()},
    BrowserWindow: {fromId: () => null},
    Notification: jest.fn(),
    shell: {openPath: jest.fn()},
}));
jest.mock('../../../src/utils/backend', () => ({run: jest.fn()}));

let baseDirectory: string;

beforeEach(() => {
    baseDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'tactic-args-'));
});

afterEach(() => {
    fs.rmSync(baseDirectory, {recursive: true, force: true});
});

/**
 * Write the default arguments for the analysis mode and read back the argument file passed to the pipeline.
 */
async function writtenArguments(mode: TacticAnalysisMode) {
    const configuration = new TacticConfiguration();
    configuration.setBaseDirectory(baseDirectory);
    configuration.setAnalysisMode(mode);
    const parameters = configuration.getDefaultParameters();
    expect(parameters).not.toBeNull();
    configuration.setParameters(parameters!);

    // the file is written asynchronously
    const file = path.join(baseDirectory, 'TACTICPipeline_args.yml');
    for (let i = 0; i < 100 && !(fs.existsSync(file) && fs.statSync(file).size > 0); i++) {
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
    return parse(fs.readFileSync(file, 'utf8'));
}

describe('argument file', () => {
    test('sets abund_limit to 0 and sample_wise_correction to false for TIC', async () => {
        const args = await writtenArguments(TacticAnalysisMode.TIC);
        expect(args.ComplexTICArgs).toEqual(
            {family_sim: 0.90, genus_sim: 0.95, species_sim: 0.987, abund_limit: 0, sample_wise_correction: false}
        );
    });

    test('sets abund_limit to 0 and sample_wise_correction to false for TAC', async () => {
        const args = await writtenArguments(TacticAnalysisMode.TAC);
        expect(args.TACClusterArgs).toEqual({abund_limit: 0, sample_wise_correction: false, cluster_thr: 0.987});
    });

    test('keeps abund_limit and sample_wise_correction for zOTU picking and UPARSE', async () => {
        const args = await writtenArguments(TacticAnalysisMode.DE_NOVO);
        expect(args.ClusterZOTUsArgs).toMatchObject({abund_limit: expect.any(Number), sample_wise_correction: false});
        expect(args.DeNovoClusterOTUsArgs).toEqual({minsize: 8, abund_limit: 0.0025, sample_wise_correction: false});
    });

    test('still passes fastq_truncqual and ends with a comment that the pipeline mutes it', async () => {
        const args = await writtenArguments(TacticAnalysisMode.TIC);
        expect(args.FilterBothSidesArgs.fastq_truncqual).toBe(10);
        expect(args.FilterOneSideArgs.fastq_truncqual).toBe(10);
        const content = fs.readFileSync(path.join(baseDirectory, 'TACTICPipeline_args.yml'), 'utf8');
        expect(content.endsWith(ARGUMENT_FILE_FOOTER)).toBe(true);
        expect(ARGUMENT_FILE_FOOTER).toMatch(/^# fastq_truncqual .*>=0\.7\.3/);
    });
});
