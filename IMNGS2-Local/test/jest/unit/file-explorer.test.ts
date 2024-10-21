import { matchFastqFile, isFastqFile } from '../../../src/utils/file-explorer';
import fs from "fs";

describe('matchFastqFile', () => {
    it('should correctly capture the sample number and lane for Illumina-style files', () => {
        const fileName = 'TestSample_S001_L001_R1_001.fastq';
        const match = matchFastqFile(fileName);
        expect(match).not.toBeNull();
        expect(match[1]).toBe('TestSample_S001_L001');
    });

    it('should correctly capture the sample number and lane for compressed Illumina-style files', () => {
        const fileName = 'TestSample_S001_L001_R1_001.fastq.gz';
        const match = matchFastqFile(fileName);
        expect(match).not.toBeNull();
        expect(match[1]).toBe('TestSample_S001_L001');
    });

    it('should correctly capture the sample name for forward SRA-style files', () => {
        const fileName = 'SRR13005987_1.fastq';
        const match = matchFastqFile(fileName);
        expect(match).not.toBeNull();
        expect(match[1]).toBe('SRR13005987');
    });

    it('should correctly capture the sample name for compressed forward SRA-style files', () => {
        const fileName = 'SRR13005987_1.fastq.gz';
        const match = matchFastqFile(fileName);
        expect(match).not.toBeNull();
        expect(match[1]).toBe('SRR13005987');
    });

    it('should correctly capture the sample name for reverse SRA-style files', () => {
        const fileName = 'SRR13005987_2.fastq';
        const match = matchFastqFile(fileName);
        expect(match).not.toBeNull();
        expect(match[1]).toBe('SRR13005987');
    });

    it('should correctly capture the sample name for @notation files', () => {
        const fileName = 'SRR13005987@F.fq';
        const match = matchFastqFile(fileName);
        expect(match).not.toBeNull();
        expect(match[1]).toBe('SRR13005987');
    });

    it('should return null for invalid file names', () => {
        const fileName = 'invalid_file_name.fastq';
        const match = matchFastqFile(fileName);
        expect(match).toBeNull();
    });
});

describe('isFastqFile', () => {
    it('should return true for uncomporessed FASTA files', async () => {
        // iterate over test_files/SRR13005987 folder
        const folder = 'test/test_files/SRR13005987';
        // get all files in the folder
        const files = fs.readdirSync(folder);
        for (const file of files) {
            const path = `${folder}/${file}`;
            expect(await isFastqFile(path)).toBe(true);
        }
    });

    it('should return true for compressed FASTA files', async () => {
        // iterate over test_files/SRR13005987 folder
        const folder = 'test/test_files/SRR13005987_gzipped';
        // get all files in the folder
        const files = fs.readdirSync(folder);
        for (const file of files) {
            const path = `${folder}/${file}`;
            expect(await isFastqFile(path)).toBe(true);
        }
    });
});
