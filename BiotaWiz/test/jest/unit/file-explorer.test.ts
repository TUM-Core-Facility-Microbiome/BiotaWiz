import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as zlib from 'zlib';
import { countSamples, detectStudyFolders, matchFastqFile } from '../../../src/utils/file-explorer';

describe('matchFastqFile', () => {
    it('should correctly capture the sample number and lane for Illumina-style files', () => {
        const fileName = 'TestSample_S001_L001_R1_001.fastq';
        const match = matchFastqFile(fileName);
        expect(match).not.toBeNull();
        expect(match![1]).toBe('TestSample_S001_L001');
    });

    it('should correctly capture the sample number and lane for compressed Illumina-style files', () => {
        const fileName = 'TestSample_S001_L001_R1_001.fastq.gz';
        const match = matchFastqFile(fileName);
        expect(match).not.toBeNull();
        expect(match![1]).toBe('TestSample_S001_L001');
    });

    it('should correctly capture the sample name for forward SRA-style files', () => {
        const fileName = 'SRR13005987_1.fastq';
        const match = matchFastqFile(fileName);
        expect(match).not.toBeNull();
        expect(match![1]).toBe('SRR13005987');
    });

    it('should correctly capture the sample name for compressed forward SRA-style files', () => {
        const fileName = 'SRR13005987_1.fastq.gz';
        const match = matchFastqFile(fileName);
        expect(match).not.toBeNull();
        expect(match![1]).toBe('SRR13005987');
    });

    it('should correctly capture the sample name for reverse SRA-style files', () => {
        const fileName = 'SRR13005987_2.fastq';
        const match = matchFastqFile(fileName);
        expect(match).not.toBeNull();
        expect(match![1]).toBe('SRR13005987');
    });

    it('should correctly capture the sample name for @notation files', () => {
        const fileName = 'SRR13005987@F.fq';
        const match = matchFastqFile(fileName);
        expect(match).not.toBeNull();
        expect(match![1]).toBe('SRR13005987');
    });

    it('should return null for invalid file names', () => {
        const fileName = 'invalid_file_name.fastq';
        const match = matchFastqFile(fileName);
        expect(match).toBeNull();
    });
});

describe('detectStudyFolders', () => {
    const FASTQ = '@r1\nACGT\n+\nIIII\n';
    let baseDirectory: string;

    beforeAll(() => {
        baseDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'studies-'));
        const files: [string, string | Buffer][] = [
            ['study/Sample_S1_L001_R1_001.fastq', FASTQ],
            ['study/Sample_S1_L001_R2_001.fastq', FASTQ],
            ['study/SRR5_1.fastq.gz', zlib.gzipSync(FASTQ)],
            ['study/metafile.tab', 'SampleID\ttotal_weight_in_g\tspike_amount\nSample_S1_L001\t0.5\t2\n'],
            ['study/nested/Single.fq', FASTQ],
            ['Analysis_20260101120000/Old_R1.fastq', FASTQ],
            ['Analysis_20260101120000/Old_R2.fastq', FASTQ],
        ];
        for (const [relative, content] of files) {
            fs.mkdirSync(path.dirname(path.join(baseDirectory, relative)), {recursive: true});
            fs.writeFileSync(path.join(baseDirectory, relative), content);
        }
    });

    afterAll(() => {
        fs.rmSync(baseDirectory, {recursive: true, force: true});
    });

    function samples(node: IFileSystemNode): IFileSystemSample[] {
        return node.type === 'sample' ? [node as IFileSystemSample] : (node.children ?? []).flatMap(samples);
    }

    it('shows the samples of the pipeline (v1.0.0 rules), except in Analysis_ folders', () => {
        const root = detectStudyFolders(baseDirectory, 'pipeline-v1');
        const found = samples(root).map(({name, isPaired, isCompressed, folder}) =>
            ({name, isPaired, isCompressed, folder: path.relative(baseDirectory, folder)}));
        expect(found).toEqual(expect.arrayContaining([
            {name: 'Sample_S1_L001', isPaired: true, isCompressed: false, folder: 'study'},
            {name: 'SRR5', isPaired: false, isCompressed: true, folder: 'study'},
            {name: 'Single', isPaired: false, isCompressed: false, folder: path.join('study', 'nested')},
        ]));
        expect(countSamples(root)).toBe(3);
    });

    it('attaches the metadata of metafile.tab', () => {
        const sample = samples(detectStudyFolders(baseDirectory, 'pipeline-v1')).find((s) => s.name === 'Sample_S1_L001');
        expect(sample?.metadata).toMatchObject({totalWeight: 0.5, spikeAmount: 2});
    });

    it('keeps the legacy rules for older pipelines', () => {
        const names = samples(detectStudyFolders(baseDirectory, 'legacy')).map((s) => s.name).sort();
        // the legacy rules do not find single-end files without a read indicator
        expect(names).toEqual(['SRR5', 'Sample_S1_L001']);
    });
});
