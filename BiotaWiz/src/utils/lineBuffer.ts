import {StringDecoder} from "string_decoder";

/**
 * Collects chunks of process output and passes on complete lines.
 *
 * Output arrives in chunks that do not align with lines: a chunk can contain several lines or end in the middle
 * of one (e.g., the Docker attach stream merges lines that are written shortly after each other). Log lines must be
 * parsed as a whole, so each complete line is passed on separately, including its line ending.
 *
 * Output that is updated in place with carriage returns (e.g., progress bars) is passed on up to the last carriage
 * return, so that it is still shown while it is updated.
 */
export class LineBuffer {
    private buffer = '';
    private readonly decoder = new StringDecoder('utf8');  // keeps multibyte characters that are split across chunks

    constructor(private readonly onLine: (line: string) => void) {
    }

    push(chunk: Buffer | string) {
        this.buffer += typeof chunk === 'string' ? chunk : this.decoder.write(chunk);

        let start = 0;
        let end: number;
        while ((end = this.buffer.indexOf('\n', start)) !== -1) {
            this.onLine(this.buffer.slice(start, end + 1));
            start = end + 1;
        }
        // a carriage return at the very end might be followed by a line feed in the next chunk
        const carriageReturn = this.buffer.lastIndexOf('\r', this.buffer.length - 2);
        if (carriageReturn >= start && carriageReturn < this.buffer.length - 1) {
            this.onLine(this.buffer.slice(start, carriageReturn + 1));
            start = carriageReturn + 1;
        }
        this.buffer = this.buffer.slice(start);
    }

    /**
     * Pass on the rest, e.g., when the output ends without a line ending.
     */
    flush() {
        this.buffer += this.decoder.end();
        if (this.buffer) {
            this.onLine(this.buffer);
            this.buffer = '';
        }
    }
}
