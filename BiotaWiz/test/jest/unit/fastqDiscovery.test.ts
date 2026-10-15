import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {SemVer} from "semver";
import {
    fastqDiscoveryRulesFor,
    getBaseName,
    isFastqExtension,
    isForwardFile,
    isReverseFile,
    isSeqFile,
    pairSeqFiles,
    predictReverseToken,
    stripIlluminaSuffix,
} from "../../../src/utils/fastqDiscovery";

/**
 * The expected results come from the pipeline's own code (test/fixtures/fastq-discovery/generate.py), for the
 * fixture tree in tree.json. Regenerate them when the pipeline's FASTQ discovery changes.
 */
const FIXTURES = path.join(__dirname, '../../fixtures/fastq-discovery');
const tree = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'tree.json'), 'utf8'));
const expected = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'expected-v1.json'), 'utf8'));

let baseDirectory: string;

beforeAll(() => {
    baseDirectory = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fastq-discovery-')), 'inputs');
    for (const [relative, kind] of tree.files as [string, string][]) {
        const file = path.join(baseDirectory, relative);
        fs.mkdirSync(path.dirname(file), {recursive: true});
        fs.writeFileSync(file, Buffer.from(expected.content[kind], 'base64'));
    }
    for (const [relative, target] of tree.symlinks as [string, string][]) {
        const link = path.join(baseDirectory, relative);
        fs.mkdirSync(path.dirname(link), {recursive: true});
        fs.symlinkSync(target, link);
    }
});

afterAll(() => {
    fs.rmSync(path.dirname(baseDirectory), {recursive: true, force: true});
});

describe('FASTQ discovery port of the pipeline (v1.0.0 rules)', () => {
    test('was compared with the pipeline code', () => {
        expect(expected.pipeline_commit).toMatch(/^[0-9a-f]{40}$/);
        expect(expected.python).toMatch(/^3\.12\./);  // the pipeline image's Python
    });

    test.each(Object.entries(expected.names))('handles file name %j like the pipeline', (name, result) => {
        expect({
            is_fastq_extension: isFastqExtension(name),
            base_name: getBaseName(name),
            is_forward: isForwardFile(name),
            is_reverse: isReverseFile(name),
            strip_illumina_suffix: stripIlluminaSuffix(name),
        }).toEqual(result);
    });

    test.each(Object.entries(expected.tokens))('predicts the reverse token of %j like the pipeline', (token, result) => {
        expect(predictReverseToken(token)).toBe(result);
    });

    test.each(Object.entries(expected.is_seq_file))('checks the content of %s like the pipeline', (relative, result) => {
        expect(isSeqFile(path.join(baseDirectory, relative))).toBe(result);
    });

    test('pairs the files like the pipeline', () => {
        const pairs = pairSeqFiles(baseDirectory).map(({forward, reverse}) => [forward, reverse ?? '']);
        expect(pairs).toEqual(expected.pairs);
    });

    test('derives the sample IDs like the pipeline', () => {
        for (const {forward} of pairSeqFiles(baseDirectory)) {
            expect(getBaseName(path.posix.basename(forward))).toBe(expected.base_names[forward]);
        }
    });

    test('writes samples that the pipeline resolves to the same files', () => {
        // BiotaWiz writes the discovered samples to the mapping file; the pipeline resolves each of them with
        // find_fastq_pair_for_sample, which must give the same files
        const differences = (expected.mapping as {sample_id: string, pair: string[], resolved: string[]}[])
            .filter((sample) => JSON.stringify(sample.pair) !== JSON.stringify(sample.resolved));
        expect(differences).toEqual([]);
    });
});

describe('fastqDiscoveryRulesFor', () => {
    test.each([
        ['0.7.3', 'legacy'],
        ['0.7.6', 'legacy'],
        ['0.9.9', 'legacy'],
        ['1.0.0-rc.1', 'pipeline-v1'],
        ['1.0.0', 'pipeline-v1'],
        ['1.9.9', 'pipeline-v1'],
    ])('uses the right rules for pipeline v%s', (version, rules) => {
        expect(fastqDiscoveryRulesFor(new SemVer(version))).toBe(rules);
    });

    test('uses the rules of the current pipeline when the version is unknown', () => {
        expect(fastqDiscoveryRulesFor(null)).toBe('pipeline-v1');
    });
});
