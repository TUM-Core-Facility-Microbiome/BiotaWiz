import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
    decidePipelineFileAction,
    parseSha256Digest,
    PipelineFileState,
    readDigestRecord,
    sha256File,
    writeDigestRecord
} from "../../../src/utils/pipelineFile";

const A = 'a'.repeat(64);  // SHA-256 GitHub reports for the release
const B = 'b'.repeat(64);  // SHA-256 of a different file

describe('parseSha256Digest', () => {
    test('reads the digest GitHub reports', () => {
        expect(parseSha256Digest(`sha256:${'1D27'.repeat(16)}`)).toBe('1d27'.repeat(16));
    });

    test.each([null, undefined, '', 'md5:abc', `sha256:${'a'.repeat(63)}`, 42])('returns null for %p', (digest) => {
        expect(parseSha256Digest(digest)).toBeNull();
    });
});

describe('checksum files', () => {
    let directory: string;
    beforeEach(() => {
        directory = fs.mkdtempSync(path.join(os.tmpdir(), 'biotawiz-sha-'));
    });
    afterEach(() => {
        fs.rmSync(directory, {recursive: true, force: true});
    });

    test('sha256File computes the SHA-256 and reports the progress', async () => {
        const file = path.join(directory, 'abc.txt');
        fs.writeFileSync(file, 'abc');
        const progress: number[] = [];
        expect(await sha256File(file, (fraction) => progress.push(fraction)))
            .toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
        expect(progress[progress.length - 1]).toBe(1);
    });

    test('a record is written in the format of sha256sum and read back', () => {
        const record = path.join(directory, 'image.tar.gz.sha256');
        writeDigestRecord(record, A, 'image.tar.gz');
        expect(fs.readFileSync(record, 'utf8')).toBe(`${A}  image.tar.gz\n`);
        expect(readDigestRecord(record)).toBe(A);
    });

    test('a missing or invalid record reads as null', () => {
        const record = path.join(directory, 'record');
        expect(readDigestRecord(record)).toBeNull();
        fs.writeFileSync(record, 'not a checksum');
        expect(readDigestRecord(record)).toBeNull();
    });
});

describe('decidePipelineFileAction', () => {
    const nothing: PipelineFileState = {
        expectedDigest: A, registered: false, registrationDigest: null, fileDigest: null, downloadDigest: null,
    };
    const decide = (state: Partial<PipelineFileState>) => decidePipelineFileAction({...nothing, ...state}, '1.0.0');

    describe('with GitHub reachable', () => {
        test('downloads if nothing is downloaded', () => {
            expect(decide({})).toEqual({action: 'download'});
        });

        test('registers a downloaded file that matches', () => {
            expect(decide({fileDigest: A})).toEqual({action: 'register'});
        });

        test('downloads again if the downloaded file does not match', () => {
            expect(decide({fileDigest: B, downloadDigest: B})).toEqual({action: 'download'});
        });

        test('uses a registration from the expected file', () => {
            expect(decide({registered: true, registrationDigest: A, fileDigest: A})).toEqual({action: 'use'});
        });

        test('uses a registration from the expected file whose download was deleted', () => {
            expect(decide({registered: true, registrationDigest: A})).toEqual({action: 'use'});
        });

        test('replaces a registration from a different file', () => {
            expect(decide({registered: true, registrationDigest: B, fileDigest: B})).toEqual({action: 'reregister', reuseFile: false});
        });

        test('replaces the registration if the downloaded file does not match', () => {
            expect(decide({registered: true, registrationDigest: A, fileDigest: B})).toEqual({action: 'reregister', reuseFile: false});
        });

        test('replaces a registration without a record, reusing a matching download', () => {
            expect(decide({registered: true, fileDigest: A})).toEqual({action: 'reregister', reuseFile: true});
            expect(decide({registered: true})).toEqual({action: 'reregister', reuseFile: false});
        });
    });

    describe('without internet access', () => {
        const offline = (state: Partial<PipelineFileState>) => decide({expectedDigest: null, ...state});

        test('uses a registration whose downloaded file matches its record', () => {
            expect(offline({registered: true, registrationDigest: A, fileDigest: A})).toEqual({action: 'use'});
        });

        test('uses a registration whose download is missing, with a warning for the user', () => {
            const decision = offline({registered: true, registrationDigest: A});
            expect(decision).toMatchObject({action: 'use', warning: expect.stringContaining('Could not verify')});
            expect(decision).not.toHaveProperty('devWarning');
        });

        test('uses a registration without a record, with a warning only for developers', () => {
            const decision = offline({registered: true, fileDigest: A});
            expect(decision).toMatchObject({action: 'use', devWarning: expect.stringContaining('no checksum record')});
            expect(decision).not.toHaveProperty('warning');
        });

        test('registers a downloaded file that matches the record of its verified download', () => {
            expect(offline({fileDigest: A, downloadDigest: A})).toEqual({action: 'register'});
        });

        test.each([
            ['nothing is downloaded', {}],
            ['the download has no record', {fileDigest: A}],
            ['the download does not match its record', {fileDigest: B, downloadDigest: A}],
        ])('fails if %s', (name, state) => {
            expect(offline(state)).toEqual({action: 'fail', error: expect.stringContaining('Internet access is needed')});
        });
    });
});
