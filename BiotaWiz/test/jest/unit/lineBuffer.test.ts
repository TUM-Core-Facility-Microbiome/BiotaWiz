import {LineBuffer} from "../../../src/utils/lineBuffer";

function collect(chunks: (string | Buffer)[], flush = true) {
    const lines: string[] = [];
    const buffer = new LineBuffer((line) => lines.push(line));
    chunks.forEach(chunk => buffer.push(chunk));
    if (flush) {
        buffer.flush();
    }
    return lines;
}

describe('LineBuffer', () => {
    test('passes on each line of a chunk separately', () => {
        expect(collect(['first\nsecond\r\nthird\n'])).toEqual(['first\n', 'second\r\n', 'third\n']);
    });

    test('joins a line that is split across chunks', () => {
        expect(collect(['Analysis done. Results dir', 'ectory: fastq/Analysis_1\n'])).toEqual(
            ['Analysis done. Results directory: fastq/Analysis_1\n']
        );
    });

    test('keeps a carriage return and line feed that are split across chunks together', () => {
        expect(collect(['line\r', '\nnext\n'])).toEqual(['line\r\n', 'next\n']);
    });

    test('passes on progress output up to the last carriage return', () => {
        const lines: string[] = [];
        const buffer = new LineBuffer((line) => lines.push(line));
        buffer.push('\r 10%\r 20%\r 3');
        expect(lines).toEqual(['\r 10%\r 20%\r']);  // shown while the progress is updated
        buffer.push('0%\r100%\n');
        expect(lines).toEqual(['\r 10%\r 20%\r', ' 30%\r100%\n']);
    });

    test('holds an incomplete line until more output or the end arrives', () => {
        expect(collect(['complete\nincomp'], false)).toEqual(['complete\n']);
        expect(collect(['complete\nincomp'])).toEqual(['complete\n', 'incomp']);
    });

    test('passes on nothing when flushed without remaining output', () => {
        expect(collect(['line\n'])).toEqual(['line\n']);
        expect(collect([])).toEqual([]);
    });

    test('decodes characters that are split across chunks', () => {
        const bytes = Buffer.from('Probe µ-Ä\n', 'utf8');
        const splitInsideCharacter = bytes.indexOf(Buffer.from('µ', 'utf8')) + 1;
        expect(collect([bytes.subarray(0, splitInsideCharacter), bytes.subarray(splitInsideCharacter)])).toEqual(
            ['Probe µ-Ä\n']
        );
    });
});
