import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { isTarballValid } from "../../../src/utils/backend";

// backend.ts pulls in Electron and the settings storage, which cannot run outside of Electron
jest.mock('electron', () => ({
    app: {getPath: () => os.tmpdir()},
    BrowserWindow: {fromId: () => null},
}));
jest.mock('../../../src/utils/storage', () => ({}));

describe('isTarballValid function', () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tarball-test-'));
    });

    afterEach(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    test('should return false for non-existent file', () => {
        const nonExistentPath = path.join(tempDir, 'does-not-exist.tar.gz');
        expect(isTarballValid(nonExistentPath)).toBe(false);
    });

    test('should return false for 0-byte ghost file', () => {
        const emptyFilePath = path.join(tempDir, 'empty.tar.gz');
        fs.writeFileSync(emptyFilePath, Buffer.alloc(0));
        expect(isTarballValid(emptyFilePath)).toBe(false);
    });

    test('should return false if size does not match expectedSize', () => {
        const filePath = path.join(tempDir, 'partial.tar.gz');
        // Write 4 bytes with valid gzip header
        fs.writeFileSync(filePath, Buffer.from([0x1f, 0x8b, 0x08, 0x00]));
        // Expecting 1000 bytes
        expect(isTarballValid(filePath, 1000)).toBe(false);
    });

    test('should return false if gzip magic bytes are missing or invalid', () => {
        const filePath = path.join(tempDir, 'invalid-header.tar.gz');
        // Write 4 bytes with invalid header
        fs.writeFileSync(filePath, Buffer.from([0x00, 0x00, 0x00, 0x00]));
        expect(isTarballValid(filePath)).toBe(false);
    });

    test('should return false for short file less than 2 bytes', () => {
        const filePath = path.join(tempDir, 'single-byte.tar.gz');
        fs.writeFileSync(filePath, Buffer.from([0x1f]));
        expect(isTarballValid(filePath)).toBe(false);
    });

    test('should return true for valid gzip header and non-zero size without expectedSize constraint', () => {
        const filePath = path.join(tempDir, 'valid.tar.gz');
        fs.writeFileSync(filePath, Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0x01, 0x02]));
        expect(isTarballValid(filePath)).toBe(true);
    });

    test('should return true for valid gzip header matching exact expectedSize', () => {
        const filePath = path.join(tempDir, 'valid-sized.tar.gz');
        const data = Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0xaa, 0xbb]);
        fs.writeFileSync(filePath, data);
        expect(isTarballValid(filePath, data.length)).toBe(true);
    });
});

