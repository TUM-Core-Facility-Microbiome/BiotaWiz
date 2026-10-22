import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
    combineReachability,
    describeInternetStatus,
    findLocalSilvaVersion,
    SILVA_SUCCESS_MARKER,
    wgetExitCodeToReachability
} from "../../../src/utils/internetCheck";

describe('findLocalSilvaVersion', () => {
    let databaseDirectory: string;

    beforeEach(() => {
        databaseDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'biotawiz-silva-'));
    });

    afterEach(() => {
        fs.rmSync(databaseDirectory, {recursive: true, force: true});
    });

    function addRelease(release: string, marker: string | null = `Verified prebuilt SILVA index\n${SILVA_SUCCESS_MARKER}`) {
        const releaseDirectory = path.join(databaseDirectory, 'SILVA', release);
        fs.mkdirSync(releaseDirectory, {recursive: true});
        fs.writeFileSync(path.join(releaseDirectory, 'SILVA.arb'), 'arb');
        if (marker !== null) {
            fs.writeFileSync(path.join(releaseDirectory, 'SILVA.sidx.success'), marker);
        }
    }

    test('returns null without a SILVA directory', () => {
        expect(findLocalSilvaVersion(databaseDirectory)).toBeNull();
    });

    test('returns the newest verified release, comparing versions numerically', () => {
        addRelease('138.1');
        addRelease('138.10');
        addRelease('138.2');
        expect(findLocalSilvaVersion(databaseDirectory)).toBe('138.10');
    });

    test('ignores releases without a valid success marker', () => {
        addRelease('138.2');
        addRelease('139', null);  // interrupted download
        addRelease('140', 'not verified');
        expect(findLocalSilvaVersion(databaseDirectory)).toBe('138.2');
    });

    test('ignores releases without the database file', () => {
        addRelease('138.2');
        fs.rmSync(path.join(databaseDirectory, 'SILVA', '138.2', 'SILVA.arb'));
        expect(findLocalSilvaVersion(databaseDirectory)).toBeNull();
    });
});

describe('wgetExitCodeToReachability', () => {
    test.each([0, 6, 8])('treats exit code %i as reachable', (code) => {
        expect(wgetExitCodeToReachability(code)).toBe(true);
    });

    test.each([4, 5])('treats exit code %i as unreachable', (code) => {
        expect(wgetExitCodeToReachability(code)).toBe(false);
    });

    test.each([1, 127, -1])('treats exit code %i as unknown', (code) => {
        expect(wgetExitCodeToReachability(code)).toBeNull();
    });
});

describe('combineReachability', () => {
    test('is online if any host is reachable', () => {
        expect(combineReachability([false, true])).toBe(true);
        expect(combineReachability([null, true])).toBe(true);
    });

    test('is offline if no host is reachable', () => {
        expect(combineReachability([false, null])).toBe(false);
    });

    test('is unknown if nothing could be checked', () => {
        expect(combineReachability([null, null])).toBeNull();
    });
});

describe('describeInternetStatus', () => {
    test('does not warn when the backend is online', () => {
        expect(describeInternetStatus({hostOnline: false, backendOnline: true, localDatabaseVersion: null})).toBeNull();
    });

    test('falls back to the host when the backend could not be checked', () => {
        expect(describeInternetStatus({hostOnline: true, backendOnline: null, localDatabaseVersion: null})).toBeNull();
        expect(describeInternetStatus({hostOnline: false, backendOnline: null, localDatabaseVersion: '138.2'})).toMatchObject({
            severity: 'warning',
            title: 'No internet connection.',
        });
    });

    test('warns with the local database version when offline', () => {
        const warning = describeInternetStatus({hostOnline: false, backendOnline: false, localDatabaseVersion: '138.2'});
        expect(warning?.severity).toBe('warning');
        expect(warning?.detail).toContain('version 138.2');
    });

    test('reports an error when offline without a local database', () => {
        const warning = describeInternetStatus({hostOnline: false, backendOnline: false, localDatabaseVersion: null});
        expect(warning?.severity).toBe('error');
    });

    test('points to WSL when only WSL is offline', () => {
        const warning = describeInternetStatus({hostOnline: true, backendOnline: false, localDatabaseVersion: '138.2'});
        expect(warning?.title).toBe('WSL has no internet access, although Windows has.');
        expect(warning?.detail).toContain('VPN');
    });
});
