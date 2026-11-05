import * as os from "os";
import {SemVer} from "semver";
import {Environment, LogSection} from "../../../src/enums";
import {initializeDockerBackend} from "../../../src/utils/backend";

// backend.ts pulls in Electron and the settings storage, which cannot run outside of Electron
jest.mock('electron', () => ({
    app: {getPath: () => os.tmpdir()},
    BrowserWindow: {fromId: () => null},
}));
jest.mock('../../../src/utils/storage', () => ({
    getImageTag: () => null,
    getBackend: async () => ({type: 'Docker', name: 'Docker', command: 'docker', argsPrefix: []}),
}));
const mockLogToSection = jest.fn();
const mockUpdateProgress = jest.fn();
jest.mock('../../../src/utils/logHandler', () => ({
    logToDevTools: jest.fn(),
    logToSection: (...args: unknown[]) => mockLogToSection(...args),
    updateProgress: (...args: unknown[]) => mockUpdateProgress(...args),
}));

const mockListImages = jest.fn();
const mockPull = jest.fn();
const mockFollowProgress = jest.fn();
const mockRemove = jest.fn();
const mockGetImage = jest.fn((id: string) => ({id, remove: () => mockRemove(id)}));
jest.mock('../../../src/utils/makeDockerConnection', () => ({
    docker: {
        listImages: () => mockListImages(),
        pull: (image: string) => mockPull(image),
        getImage: (id: string) => mockGetImage(id),
        modem: {
            followProgress: (stream: unknown, onFinished: (error: Error | null) => void, onProgress: (event: object) => void) =>
                mockFollowProgress(stream, onFinished, onProgress),
        },
    },
}));

const IMAGE = 'ghcr.io/mpourjam/tactic-pipeline:1.0.0';
const VERSION = new SemVer('1.0.0');

function imageInfo(id: string) {
    return {Id: id, RepoTags: [IMAGE], RepoDigests: [`ghcr.io/mpourjam/tactic-pipeline@${id}`]};
}

/** Local images before and after the pull. */
function localImages(before: object[], after: object[] = before) {
    // drop values a previous test did not use (no second lookup when the pull fails)
    mockListImages.mockReset().mockResolvedValueOnce(before).mockResolvedValueOnce(after);
}

function pullSucceeds() {
    mockPull.mockResolvedValue('stream');
    mockFollowProgress.mockImplementation((_stream, onFinished, onProgress) => {
        onProgress({status: 'Status: Image is up to date'});
        onFinished(null);
    });
}

beforeEach(() => {
    jest.clearAllMocks();
    mockRemove.mockResolvedValue(undefined);
});

describe('Docker backend: checking the pipeline image against GitHub', () => {
    it('pulls the image on every start and keeps an image that is up to date', async () => {
        localImages([imageInfo('sha256:aaa')]);
        pullSucceeds();
        await initializeDockerBackend(Environment.TACTIC, VERSION);
        expect(mockPull).toHaveBeenCalledWith(IMAGE);
        expect(mockRemove).not.toHaveBeenCalled();
    });

    it('removes the local image when GitHub has another one for the version', async () => {
        localImages([imageInfo('sha256:old')], [imageInfo('sha256:new')]);
        pullSucceeds();
        await initializeDockerBackend(Environment.TACTIC, VERSION);
        expect(mockRemove).toHaveBeenCalledWith('sha256:old');
    });

    it('still succeeds if the replaced image cannot be removed', async () => {
        localImages([imageInfo('sha256:old')], [imageInfo('sha256:new')]);
        pullSucceeds();
        mockRemove.mockRejectedValue(new Error('image is being used by stopped container'));
        await expect(initializeDockerBackend(Environment.TACTIC, VERSION)).resolves.toBeUndefined();
    });

    it('downloads the image if it is not on this computer', async () => {
        localImages([], [imageInfo('sha256:new')]);
        pullSucceeds();
        await initializeDockerBackend(Environment.TACTIC, VERSION);
        expect(mockPull).toHaveBeenCalledWith(IMAGE);
        expect(mockRemove).not.toHaveBeenCalled();
    });

    it('uses the installed image with a warning if GitHub cannot be reached', async () => {
        localImages([imageInfo('sha256:aaa')]);
        mockPull.mockRejectedValue(new Error('connect ECONNREFUSED'));
        await initializeDockerBackend(Environment.TACTIC, VERSION);
        expect(mockLogToSection).toHaveBeenCalledWith(
            LogSection.PREPARE_BACKEND,
            expect.stringContaining('Could not verify the installed TACTIC pipeline v1.0.0 against GitHub'),
        );
    });

    it('fails with DOCPIF if the image is not installed and cannot be pulled', async () => {
        localImages([]);
        mockPull.mockRejectedValue(new Error('connect ECONNREFUSED'));
        await expect(initializeDockerBackend(Environment.TACTIC, VERSION)).rejects.toThrow('ECONNREFUSED');
        expect(mockUpdateProgress).toHaveBeenCalledWith(expect.objectContaining({
            state: 'error',
            error: expect.objectContaining({code: 'DOCPIF'}),
        }));
    });

    it('treats an error during the download as a failed pull', async () => {
        localImages([]);
        mockPull.mockResolvedValue('stream');
        mockFollowProgress.mockImplementation((_stream, onFinished) => onFinished(new Error('unexpected EOF')));
        await expect(initializeDockerBackend(Environment.TACTIC, VERSION)).rejects.toThrow('unexpected EOF');
    });
});
