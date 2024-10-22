// list files in a directory
import * as fs from "fs";
import {readdirSync} from "fs";
import {join, basename} from "path";
import * as zlib from "node:zlib";

export function detectStudyFolders(baseDirectory: string): IFileSystemNode {
    const root: IFileSystemNode = {
        name: basename(baseDirectory),
        type: "directory",
        path: baseDirectory,
        children: [],
    }

    // recursively list all files in baseDirectory and build file tree
    listDirectory(baseDirectory, root, baseDirectory);
    return root;
}

function parseMetafile(metafile: string): Map<string, ISampleMetadata> {
    const metaMap = new Map<string, ISampleMetadata>();

    const lines = metafile.split("\n");

    const columns = lines[0].split("\t");
    // check header starts with sampleId, weight, spikeIn
    if (columns[0] !== "SampleID" || columns[1] !== "total_weight_in_g" || columns[2] !== "spike_amount") {
        throw new Error(`Invalid metafile format: header does not start with SampleID, total_weight_in_g, spike_amount`);
    }
    console.debug(columns);

    // remove header line and empty lines
    const data = lines.slice(1).filter((line) => line.length > 0);

    data.forEach((line) => {
        const values = line.split("\t");
        console.debug(values);
        if (values.length !== columns.length) {
            throw new Error(`Invalid metafile format: line ${line} does not have the same number of columns as the header`);
        }
        const sampleId = values[0];
        let spikeIn = parseFloat(values[2]);
        console.debug(`${sampleId}; spikeIn: ${spikeIn}`)
        if (isNaN(spikeIn)) {
            spikeIn = 0;
        }
        let weight = parseFloat(values[1]);
        let additional: Map<string, string> = new Map<string, string>();
        for (let i = 3; i < columns.length; i++) {
            additional.set(columns[i], values[i]);
        }
        const metadata: ISampleMetadata = {
            spikeAmount: spikeIn,
            totalWeight: weight,
            additional: additional,
        };
        metaMap.set(sampleId, metadata);
    });

    return metaMap;
}

function isForward(pairFileIndicator: string): boolean {
    const forwardFileIndicators = [
        "_R1_",  // Illumina-style
        "_F_",
        "_R1",
        "@F",
        "_1",  // SRA-style
    ];
    // check if any of the allowed forward indicators is present as a substring of the pairFileIndicator
    return forwardFileIndicators.some((indicator) => pairFileIndicator.includes(indicator));
}


/**
 * Check if a file is a (optionally compressed) FASTQ file by reading into the file.
 * Files are considered if they end with .fastq, .fastq.gz, .fq, or .fq.gz.
 * @param filePath
 */
export function isFastqFile(filePath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        // ensure file exists and is a file
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
            return resolve(false);
        }
        if (!(fileName.endsWith(".fastq") || fileName.endsWith(".fastq.gz") || fileName.endsWith(".fq") || fileName.endsWith(".fq.gz"))) {
            return resolve(false);
        }
        // check if file is gz compressed
        const buffer = Buffer.alloc(2);
        const file = fs.openSync(filePath, 'r');
        fs.readSync(file, buffer, 0, 2, 0);
        fs.closeSync(file);
        const isCompressed = buffer[0] === 0x1f && buffer[1] === 0x8b;

        // Function to check the first line in plain or compressed stream
        const checkFirstLine = (stream: fs.ReadStream | zlib.Gunzip) => {
            let firstLine = '';
            stream.on('data', (chunk) => {
                firstLine += chunk.toString();
                const lines = firstLine.split(/\r?\n/);
                if (lines.length > 0) {
                    stream.destroy(); // stop reading after the first line
                    resolve(lines[0].startsWith('@'));
                }
            });
            stream.on('error', (err) => {
                reject(err);
            });
            stream.on('end', () => {
                if (firstLine.length === 0) {
                    resolve(false);
                }
            });
        };

        // Process the file depending on whether it's compressed or not
        if (isCompressed) {
            const gunzip = zlib.createGunzip();
            const stream = fs.createReadStream(filePath).pipe(gunzip).setEncoding('utf8');
            checkFirstLine(stream);
        } else {
            const stream = fs.createReadStream(filePath).setEncoding('utf8');
            checkFirstLine(stream);
        }
    });
}

function listDirectory(baseDirectory: string, currentRoot: IFileSystemNode, path: string) {
    try {
        const files = readdirSync(path);

        // check if folder contains a metafile
        let metaMap = new Map<string, ISampleMetadata>();
        if (files.includes("metafile.tab")) {
            // parse metafile to get metadata
            try {
                metaMap = parseMetafile(fs.readFileSync(join(path, "metafile.tab"), "utf8"));
            } catch (error) {
                console.error(`Error parsing metafile: ${error}`);
            }
        }
        console.log(metaMap)

        files.forEach((nodeName) => {
            if (fs.statSync(join(path, nodeName)).isDirectory()) {  // handle directories
                // ignore __processed directories as these store the results of the preprocessing
                if (nodeName.endsWith("__processed")) {
                    return;
                }
                // ignore Analysis directories as these come from a previous run
                if (nodeName.startsWith("Analysis_")) {
                    return;
                }

                // create a new node for the directory and add it to the current root
                const currentNode: IFileSystemNode = {
                    name: nodeName,
                    type: "directory",
                    path: join(path, nodeName),
                    children: [],
                }
                currentRoot.children.push(currentNode);
                listDirectory(baseDirectory, currentNode, join(path, nodeName));
            } else {  // handle files
                let match;
                if ((match = matchFastqFile(nodeName)) !== null) {
                    const sampleId = match[1];

                    // use match 3 if exists (for non-trailing indicators), otherwise use match 2 (for identifiers ending the file name)
                    const pairFileIndicator = match[3] || match[2];
                    const forward = isForward(pairFileIndicator);
                    const extension = match[15];

                    console.debug(`Matched file ${nodeName} with sampleId ${sampleId}, pFI ${pairFileIndicator}, forward ${forward}, extension ${extension}`);

                    // check for metadata
                    let metadata = null;
                    if (metaMap.has(sampleId)) {
                        metadata = metaMap.get(sampleId);
                    }
                    const currentNode: IFileSystemSample = {
                        name: sampleId,
                        path: join(path, nodeName),
                        folder: path,
                        type: "sample",
                        isPaired: true,  // currently only paired-end samples are supported
                        isCompressed: extension.endsWith(".gz"),
                        metadata: metadata,
                    }
                    if (forward) {
                        currentRoot.children.push(currentNode);
                    } else {
                        // check for node with same sampleId and modify it
                        let forwardNode;
                        if ((forwardNode = currentRoot.children.find((node) => {
                            if (node.type === "sample") {
                                const snode = node as IFileSystemSample;
                                return snode.name === sampleId && snode.folder === path;
                            } else {
                                return false;
                            }
                        })) !== undefined) {
                            (forwardNode as IFileSystemSample).isPaired = true;
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error(`Error reading directory ${path}: ${error}`);
        return;
    }
}

/**
 * Match a FASTQ file name to extract the sample ID and pair indicator.
 * Supports Illumina-style (_R1_, _R2_), SRA-style (_1, _2), and custom ((_F_, _R_), (@F, @R), (_R1, _R2)) indicators.
 * File are matched if they end with .fastq, .fastq.gz, .fq, or .fq.gz.
 * @param fileName
 */
export function matchFastqFile(fileName: string): RegExpExecArray | null {
    if (fileName.endsWith(".fastq") || fileName.endsWith(".fastq.gz") || fileName.endsWith(".fq") || fileName.endsWith(".fq.gz")) {
        const regex = new RegExp('(.*)(((_R1_).*|(_F_).*|(_R1)|(@F)|(_1))|((_R2_).*|(_R_).*|(_R2)|(@R)|(_2)))\\.((fastq|fq)(\\.gz)?)', 'gm')
        let match;

        if ((match = regex.exec(fileName)) !== null) {
            console.debug(`Matched file ${fileName}`);
            return match;
        }
    }
    return null;
}
