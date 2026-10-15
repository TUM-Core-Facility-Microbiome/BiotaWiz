/**
 * FASTQ discovery of the TACTIC pipeline from v1.0.0 on, ported from tactic_pipeline/processing_helper.py
 * (pair_seq_files and its helpers) and run_tactic.py (is_in_processed_dir).
 *
 * BiotaWiz must find exactly the samples, pairs and sample IDs the pipeline finds, as it writes them to the mapping
 * file the pipeline resolves. Keep this a 1:1 port: test/fixtures/fastq-discovery holds the results of the Python
 * code for a fixture tree (expected-v1.json records the pipeline version), and the tests compare this port against
 * them.
 *
 * The pipeline sees the files at /base/inputs inside the container. Paths are compared, checked and sorted in that
 * form, so the location of the base directory on the host cannot change the result.
 */
import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";
import semver, {SemVer} from "semver";

export type FastqDiscoveryRules = 'pipeline-v1' | 'legacy';

// the pipeline uses these rules from v1.0.0 on, including its pre-releases
const PIPELINE_V1_RULES_FROM = '1.0.0-0';

/**
 * Choose the FASTQ discovery rules for the pipeline version that will run the analysis.
 * Without a known version, the rules of the current pipeline are used.
 */
export function fastqDiscoveryRulesFor(pipelineVersion: SemVer | null): FastqDiscoveryRules {
    if (pipelineVersion === null) {
        return 'pipeline-v1';
    }
    return semver.gte(pipelineVersion, PIPELINE_V1_RULES_FROM) ? 'pipeline-v1' : 'legacy';
}

export function describeFastqDiscoveryRules(rules: FastqDiscoveryRules): string {
    return rules === 'pipeline-v1'
        ? 'pipeline v1.0.0+ rules (pair_seq_files)'
        : 'legacy BiotaWiz rules (pipeline before v1.0.0)';
}

export const FASTQ_EXTENSIONS = [
    ".fastq.gz",
    ".fq.gz",
    ".fastq",
    ".fq",
];

/**
 * Python: is_fastq_extension
 */
export function isFastqExtension(fileName: string): boolean {
    const nameLower = fileName.toLowerCase();
    return FASTQ_EXTENSIONS.some((ext) => nameLower.endsWith(ext));
}

/**
 * Python: strip_illumina_suffix. `$` in Python also matches before a trailing newline, and `\d` matches any decimal
 * digit.
 */
export function stripIlluminaSuffix(name: string): string {
    return name.replace(/_S\p{Nd}+(_L\p{Nd}+)?(?=\n?$)/u, '');
}

// Python translation notes:
// - (?i:...) is spelled out with character classes; case-insensitive Python matching also matches 'ſ' (U+017F) for 's'
// - \d matches any decimal digit (\p{Nd})
// - $ also matches before a newline at the end of the text
const ci = (word: string) => [...word].map((c) => c === 's' ? '[Ssſ]' : `[${c.toUpperCase()}${c}]`).join('');
const EXT = `(?=\\.(?:${ci('fastq')}|${ci('fq')})(?:\\.${ci('gz')})?\\n?$)`;
const SEP_L = '[._-]';
const SEP_R = '(?=[._-])';
const TAIL = `(?=_\\p{Nd}{3}\\.(?:${ci('fastq')}|${ci('fq')})(?:\\.${ci('gz')})?\\n?$)`;

const pair = (forward: string, reverse: string, flags = 'u'): [RegExp, RegExp] =>
    [new RegExp(forward, flags), new RegExp(reverse, flags)];

/**
 * Python: INDICATOR_PAIRS (forward, reverse)
 */
export const INDICATOR_PAIRS: [RegExp, RegExp][] = [
    // 1. Standard Illumina / delimiter-bounded R1 / R2 (e.g. _R1_, -R1-, .r1., _r2_001, -R1.fastq)
    pair(`${SEP_L}[Rr]1${SEP_R}`, `${SEP_L}[Rr]2${SEP_R}`),
    // 2. Word indicators: read1 / read2 (case-insensitive, delimiter-bounded)
    pair(`${SEP_L}${ci('read')}1${SEP_R}`, `${SEP_L}${ci('read')}2${SEP_R}`),
    // 3. Word indicators: forward / reverse (case-insensitive, delimiter-bounded)
    pair(`${SEP_L}${ci('forward')}${SEP_R}`, `${SEP_L}${ci('reverse')}${SEP_R}`),
    // 4. SRA / ENA numbered _1 / _2 directly before fastq extension (e.g. SRR123_1.fastq.gz)
    pair(`_1${EXT}`, `_2${EXT}`),
    // 5. Single letter F / R directly before fastq extension (e.g. _F.fastq, -r.fq.gz)
    pair(`${SEP_L}[Ff]${EXT}`, `${SEP_L}[Rr]${EXT}`),
    // 6. Single letter _F_ / _R_ directly before Illumina machine tail (e.g. _F_001.fastq.gz)
    pair(`_[Ff]${TAIL}`, `_[Rr]${TAIL}`),
    // 7. Legacy @F / @R
    pair('@F', '@R', 'iu'),
];

/**
 * Python: _rightmost_indicator. The rightmost read direction indicator in a file name; on the same start, the longer
 * match wins, and on a tie the earlier pattern.
 */
function rightmostIndicator(fileName: string): { match: RegExpExecArray, direction: 'F' | 'R' } | null {
    let best: { match: RegExpExecArray, direction: 'F' | 'R' } | null = null;
    for (const [forward, reverse] of INDICATOR_PAIRS) {
        for (const [regex, direction] of [[forward, 'F'], [reverse, 'R']] as [RegExp, 'F' | 'R'][]) {
            // Python: finditer
            for (const match of fileName.matchAll(new RegExp(regex.source, regex.flags + 'g'))) {
                const end = match.index + match[0].length;
                if (best === null || match.index > best.match.index
                    || (match.index === best.match.index && end > best.match.index + best.match[0].length)) {
                    best = {match: match as RegExpExecArray, direction};
                }
            }
        }
    }
    return best;
}

/**
 * Python: get_base_name, with strip_illumina=False as used for sample IDs. Returns the name only.
 */
export function getBaseName(fileName: string): string {
    const indicator = rightmostIndicator(fileName);
    if (indicator !== null) {
        return fileName.slice(0, indicator.match.index);
    }
    // without an indicator, strip the FASTQ extension
    const nameLower = fileName.toLowerCase();
    for (const ext of FASTQ_EXTENSIONS) {
        if (nameLower.endsWith(ext)) {
            return fileName.slice(0, fileName.length - ext.length);
        }
    }
    return fileName;
}

export function isForwardFile(fileName: string): boolean {
    return rightmostIndicator(fileName)?.direction === 'F';
}

export function isReverseFile(fileName: string): boolean {
    return rightmostIndicator(fileName)?.direction === 'R';
}

// Python's str.islower() / str.isupper(): at least one cased character, and all cased characters lower / upper
const isLower = (s: string) => s !== s.toUpperCase() && s === s.toLowerCase();
const isUpper = (s: string) => s !== s.toLowerCase() && s === s.toUpperCase();

/**
 * Python: _predict_reverse_token. The reverse token for a forward token, keeping case and delimiters.
 */
export function predictReverseToken(token: string): string {
    const tokLower = token.toLowerCase();
    const replace = (index: number, length: number, replacement: string) =>
        token.slice(0, index) + replacement + token.slice(index + length);
    let index: number;
    if ((index = tokLower.indexOf('read1')) !== -1) {
        const part = token.slice(index, index + 5);
        return replace(index, 5, isLower(part) ? 'read2' : isUpper(part) ? 'READ2' : 'Read2');
    }
    if ((index = tokLower.indexOf('forward')) !== -1) {
        const part = token.slice(index, index + 7);
        return replace(index, 7, isLower(part) ? 'reverse' : isUpper(part) ? 'REVERSE' : 'Reverse');
    }
    if ((index = tokLower.indexOf('r1')) !== -1) {
        return replace(index, 2, isLower(token.slice(index, index + 2)) ? 'r2' : 'R2');
    }
    if ((index = tokLower.indexOf('@f')) !== -1) {
        return replace(index, 2, isLower(token.slice(index, index + 2)) ? '@r' : '@R');
    }
    if ((index = tokLower.indexOf('f')) !== -1) {
        return replace(index, 1, isLower(token[index]) ? 'r' : 'R');
    }
    if ((index = token.lastIndexOf('1')) !== -1) {
        return replace(index, 1, '2');
    }
    return token;
}

/**
 * A directory tree as the pipeline sees it: paths relative to the base directory ('' is the base directory).
 */
class Tree {
    constructor(readonly baseDirectory: string) {
    }

    hostPath(relative: string): string {
        return relative === '' ? this.baseDirectory : path.join(this.baseDirectory, ...relative.split('/'));
    }

    // the path inside the pipeline container
    static containerPath(relative: string): string {
        return relative === '' ? '/base/inputs' : `/base/inputs/${relative}`;
    }

    // Python: Path.is_file(), following links
    isFile(relative: string): boolean {
        try {
            return fs.statSync(this.hostPath(relative)).isFile();
        } catch {
            return false;
        }
    }

    // Python: Path.resolve(), for an existing file
    resolve(relative: string): string {
        try {
            return fs.realpathSync(this.hostPath(relative));
        } catch {
            return this.hostPath(relative);
        }
    }

    // Python: Path.is_dir(), following links
    isDirectory(relative: string): boolean {
        try {
            return fs.statSync(this.hostPath(relative)).isDirectory();
        } catch {
            return false;
        }
    }

    /**
     * Python: Path.iterdir(). The pipeline sorts the entries where the order matters.
     */
    list(relative: string): string[] {
        const inDirectory = (name: string) => relative === '' ? name : `${relative}/${name}`;
        const names: string[] = [];
        let dir: fs.Dir | null = null;
        try {
            dir = fs.opendirSync(this.hostPath(relative));
            let entry: fs.Dirent | null;
            while ((entry = dir.readSync()) !== null) {
                names.push(entry.name);
            }
        } catch {
            // like Python's glob, ignore directories that cannot be read
        } finally {
            dir?.closeSync();
        }
        return names.map(inDirectory);
    }

    /**
     * Python 3.12: Path.rglob("*"). All entries below the directory; the pipeline sorts them.
     */
    *walk(relative = ''): Generator<string> {
        const entries = this.list(relative);
        yield* entries;
        for (const entry of entries) {
            if (this.isWalkableDirectory(entry)) {
                yield* this.walk(entry);
            }
        }
    }

    // "**" in Python 3.12 does not descend into links to directories
    private isWalkableDirectory(relative: string): boolean {
        try {
            return fs.lstatSync(this.hostPath(relative)).isDirectory();
        } catch {
            return false;
        }
    }
}

const CHUNK_SIZE = 8192;  // Python's TextIOWrapper reads in chunks of this size

/**
 * Python: the first line of a text stream (readline() with universal newlines, UTF-8). Throws on invalid UTF-8 in the
 * chunks read, as Python does.
 */
function firstLine(read: (length: number) => Buffer): string {
    const decoder = new TextDecoder('utf-8', {fatal: true});
    let text = '';
    while (true) {
        const chunk = read(CHUNK_SIZE);
        const done = chunk.length === 0;
        text += decoder.decode(chunk, {stream: !done});
        const end = text.search(/[\r\n]/);
        if (end !== -1) {
            return text.slice(0, end + 1);
        }
        if (done) {
            return text;
        }
    }
}

function readPlain(fd: number): (length: number) => Buffer {
    let position = 0;
    return (length) => {
        const buffer = Buffer.alloc(length);
        const bytesRead = fs.readSync(fd, buffer, 0, length, position);
        position += bytesRead;
        return buffer.subarray(0, bytesRead);
    };
}

function readGzip(file: string): (length: number) => Buffer {
    // decompress a growing prefix of the file until enough output is available, without reading large files completely
    const size = fs.statSync(file).size;
    let compressedLength = 0;
    let output = Buffer.alloc(0);
    let truncated = false;  // the file ends before the end of the compressed data
    let position = 0;
    return (length) => {
        while (output.length < position + length && compressedLength < size) {
            compressedLength = Math.min(size, Math.max(64 * 1024, compressedLength * 2));
            const compressed = Buffer.alloc(compressedLength);
            const fd = fs.openSync(file, 'r');
            try {
                fs.readSync(fd, compressed, 0, compressedLength, 0);
            } finally {
                fs.closeSync(fd);
            }
            // returns what can be decompressed so far; throws if the data is not gzip
            output = zlib.gunzipSync(compressed, {finishFlush: zlib.constants.Z_SYNC_FLUSH});
            if (compressedLength === size) {
                try {
                    zlib.gunzipSync(compressed);
                } catch {
                    truncated = true;
                }
            }
        }
        const chunk = output.subarray(position, position + length);
        position += chunk.length;
        // like Python's gzip, return what is available and fail only when nothing is left of a truncated file
        if (chunk.length === 0 && truncated) {
            throw new Error('Compressed file ended before the end-of-stream marker was reached');
        }
        return chunk;
    };
}

/**
 * Python: is_seq_file(file_path, seq_file_format="fastq").
 *
 * Like Python's mimetypes, only a lowercase ".gz" is treated as gzip; other casings (".GZ") are treated as zip
 * archives, and ".zst" and other files as text. Zip archives are not read: a real zip archive with a FASTQ extension
 * is rejected here, while the pipeline would read its first member.
 */
export function isSeqFile(file: string): boolean {
    let resolved: string;
    try {
        resolved = fs.realpathSync(file);
        if (!fs.statSync(resolved).isFile()) {
            return false;
        }
    } catch {
        return false;
    }
    const name = path.basename(resolved);
    try {
        if (name.endsWith('.gz')) {
            return firstLine(readGzip(resolved)).startsWith('@');
        }
        if (name.toLowerCase().endsWith('.gz') || name.toLowerCase().endsWith('.zip')) {
            return false;
        }
        const fd = fs.openSync(resolved, 'r');
        let line: string;
        try {
            line = firstLine(readPlain(fd));
        } finally {
            fs.closeSync(fd);
        }
        // the line must consist of ASCII characters only
        return Buffer.byteLength(line, 'utf8') === line.length && line.startsWith('@');
    } catch {
        return false;
    }
}

/**
 * Python: find_reverse_file. Returns the reverse file relative to the base directory, or '' if there is none.
 */
function findReverseFile(tree: Tree, relative: string): string {
    const slash = relative.lastIndexOf('/');
    const parent = slash === -1 ? '' : relative.slice(0, slash);
    const fileName = relative.slice(slash + 1);
    const inParent = (name: string) => parent === '' ? name : `${parent}/${name}`;

    const indicator = rightmostIndicator(fileName);
    if (indicator === null || indicator.direction !== 'F') {
        return '';
    }

    const start = indicator.match.index;
    const end = start + indicator.match[0].length;
    const predicted = inParent(fileName.slice(0, start) + predictReverseToken(fileName.slice(start, end)) + fileName.slice(end));
    // the predicted file must exist, not be the forward file itself, and be a reverse file
    if (tree.isFile(predicted) && tree.resolve(predicted) !== tree.resolve(relative)) {
        if (isReverseFile(predicted.slice(predicted.lastIndexOf('/') + 1))) {
            return predicted;
        }
    }

    // otherwise, the first reverse file (by name) in the directory with the same stem and suffix
    const stem = fileName.slice(0, start);
    const expectedSuffix = fileName.slice(end).toLowerCase();
    const candidates = tree.list(parent).sort((a, b) =>
        compareCodePoints(a.slice(a.lastIndexOf('/') + 1), b.slice(b.lastIndexOf('/') + 1)));
    for (const candidate of candidates) {
        const candidateName = candidate.slice(candidate.lastIndexOf('/') + 1);
        if (!tree.isFile(candidate) || !isFastqExtension(candidateName)) {
            continue;
        }
        if (tree.resolve(candidate) === tree.resolve(relative)) {
            continue;
        }
        const candidateIndicator = rightmostIndicator(candidateName);
        if (candidateIndicator !== null && candidateIndicator.direction === 'R') {
            const candidateStart = candidateIndicator.match.index;
            const candidateEnd = candidateStart + candidateIndicator.match[0].length;
            if (candidateName.slice(0, candidateStart) === stem
                && candidateName.slice(candidateEnd).toLowerCase() === expectedSuffix) {
                return candidate;
            }
        }
    }
    return '';
}

// Python compares strings by code point; JavaScript's default comparison uses UTF-16 code units
function compareCodePoints(a: string, b: string): number {
    const pointsA = Array.from(a), pointsB = Array.from(b);
    for (let i = 0; i < Math.min(pointsA.length, pointsB.length); i++) {
        const difference = pointsA[i].codePointAt(0)! - pointsB[i].codePointAt(0)!;
        if (difference !== 0) {
            return difference;
        }
    }
    return pointsA.length - pointsB.length;
}

/**
 * Python (run_tactic.py): is_in_processed_dir, for a path relative to the base directory ('' for a missing file).
 */
function isInProcessedDir(relative: string): boolean {
    if (relative === '') {
        return false;
    }
    const containerPath = Tree.containerPath(relative);
    const parentParts = containerPath.split('/').slice(1, -1);
    if (parentParts.some((part) => part.endsWith('__processed'))) {
        return true;
    }
    const baseName = getBaseName(containerPath.slice(containerPath.lastIndexOf('/') + 1));
    return containerPath.includes(`${baseName}__processed`);
}

export interface FastqPair {
    forward: string;  // relative to the base directory, with '/' as separator
    reverse: string | null;
}

/**
 * Python: pair_seq_files(fastq_dir), followed by the is_in_processed_dir filter of run_tactic.py.
 * Returns the forward and reverse files (or single-end files) relative to the base directory, sorted like the pipeline.
 */
export function pairSeqFiles(baseDirectory: string): FastqPair[] {
    const tree = new Tree(baseDirectory);
    if (!tree.isDirectory('')) {
        return [];
    }

    const pairs: [string, string][] = [];
    const skipReverses = new Set<string>();
    const singleEndCandidates: string[] = [];

    // sorted by path, so the result does not depend on the order in which the file system lists the files
    const files = [...tree.walk()].sort((a, b) => compareCodePoints(Tree.containerPath(a), Tree.containerPath(b)));
    for (const file of files) {
        if (!tree.isFile(file)) {
            continue;
        }
        const containerPath = Tree.containerPath(file);
        const parentParts = containerPath.split('/').slice(1, -1);
        if (containerPath.includes('__processed') || parentParts.some((part) => part.startsWith('Analysis_'))) {
            continue;
        }
        const fileName = file.slice(file.lastIndexOf('/') + 1);
        if (!isFastqExtension(fileName)) {
            continue;
        }
        if (skipReverses.has(file)) {
            continue;
        }
        if (isSeqFile(tree.hostPath(file))) {
            if (isForwardFile(fileName)) {
                const reversePath = findReverseFile(tree, file);
                let reverse = '';
                if (reversePath && tree.isFile(reversePath)) {
                    skipReverses.add(reversePath);
                    // a reverse file that is not valid FASTQ is ignored, and the forward read is used as single-end
                    if (isSeqFile(tree.hostPath(reversePath))) {
                        reverse = reversePath;
                    }
                }
                pairs.push([file, reverse]);
            } else if (!isReverseFile(fileName)) {
                singleEndCandidates.push(file);
            }
        }
    }

    // single-end reads that were not claimed as reverse reads
    for (const file of singleEndCandidates) {
        if (!skipReverses.has(file)) {
            pairs.push([file, '']);
        }
    }

    const sortKey = (relative: string) => relative === '' ? '' : Tree.containerPath(relative);
    pairs.sort((a, b) => compareCodePoints(sortKey(a[0]), sortKey(b[0])) || compareCodePoints(sortKey(a[1]), sortKey(b[1])));

    return pairs
        .filter(([forward, reverse]) => !isInProcessedDir(forward) && !isInProcessedDir(reverse))
        .map(([forward, reverse]) => ({forward, reverse: reverse || null}));
}
