import {LineBuffer} from "../../../src/utils/lineBuffer";
import {getAnnouncedAnalysisDirectory, PYTHON_LOGGER_REGEX} from "../../../src/views/components/tactic/tacticLog";

const ANALYSIS_DONE = "2026-10-14 12:00:02 - analysis:analysis.py:1811 - INFO - ANALYSIS DONE\r\n";
const ANNOUNCEMENT = "2026-10-14 12:00:02 - run_tactic:run_tactic.py:1173 - INFO - Analysis done. Results directory: fastq/Analysis_20261014120002\r\n";

/**
 * Feed output chunks through the LineBuffer and parse each line like the TACTIC run view does.
 */
function announcedDirectories(chunks: string[]) {
    const directories: string[] = [];
    const buffer = new LineBuffer((line) => {
        const m = PYTHON_LOGGER_REGEX.exec(line);
        const directory = m ? getAnnouncedAnalysisDirectory(m.groups?.message ?? '') : null;
        if (directory !== null) {
            directories.push(directory);
        }
    });
    chunks.forEach(chunk => buffer.push(chunk));
    buffer.flush();
    return directories;
}

describe('PYTHON_LOGGER_REGEX', () => {
    test.each(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'])('parses log lines of level %s', (level) => {
        const m = PYTHON_LOGGER_REGEX.exec(`2026-10-14 12:00:02 - run_tactic:run_tactic.py:156 - ${level} - Some message\r\n`);
        expect(m?.groups).toMatchObject({
            asctime: '2026-10-14 12:00:02',
            name: 'run_tactic',
            filename: 'run_tactic.py',
            lineno: '156',
            levelname: level,
            message: 'Some message',
        });
    });

    test('does not parse output that is not a log line', () => {
        expect(PYTHON_LOGGER_REGEX.exec('Traceback (most recent call last):\n')).toBeNull();
    });
});

describe('announcement of the analysis directory at the end of a run', () => {
    // the pipeline logs both lines right after each other, so they usually arrive in one chunk
    test('is found when it arrives in one chunk with the previous log line', () => {
        expect(announcedDirectories([ANALYSIS_DONE + ANNOUNCEMENT])).toEqual(['fastq/Analysis_20261014120002']);
    });

    test('is found when it is split across chunks', () => {
        const split = ANNOUNCEMENT.indexOf('Analysis_') + 4;
        expect(announcedDirectories([ANALYSIS_DONE + ANNOUNCEMENT.slice(0, split), ANNOUNCEMENT.slice(split)])).toEqual(
            ['fastq/Analysis_20261014120002']
        );
    });

    test('is found when the output ends without a line ending', () => {
        expect(announcedDirectories([ANALYSIS_DONE, ANNOUNCEMENT.trimEnd()])).toEqual(['fastq/Analysis_20261014120002']);
    });

    test('is not reported for other log messages', () => {
        expect(announcedDirectories([ANALYSIS_DONE])).toEqual([]);
    });
});
