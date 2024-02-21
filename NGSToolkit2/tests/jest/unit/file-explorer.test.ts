import { matchFastqFile } from '../../../src/utils/file-explorer';

describe('matchFastqFile', () => {
    it('should correctly capture the sample number and lane', () => {
        const fileName = 'TestSample_S001_L001_R1_001.fastq';
        const match = matchFastqFile(fileName);
        expect(match).not.toBeNull();
        expect(match[1]).toBe('TestSample_S001_L001');
    });

    it('should correctly capture the sample number and lane for compressed files', () => {
        const fileName = 'TestSample_S001_L001_R1_001.fastq.gz';
        const match = matchFastqFile(fileName);
        expect(match).not.toBeNull();
        expect(match[1]).toBe('TestSample_S001_L001');
    });

    it('should return null for invalid file names', () => {
        const fileName = 'invalid_file_name.fastq';
        const match = matchFastqFile(fileName);
        expect(match).toBeNull();
    });
});
