// list files in a directory
import * as fs from "fs";
import {readdirSync} from "fs";
import {join, basename} from "path";

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
                        isPaired: false,
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
