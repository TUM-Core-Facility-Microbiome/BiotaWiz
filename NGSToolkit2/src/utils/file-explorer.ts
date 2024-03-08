// list files in a directory
import * as fs from "fs";
import {readdirSync} from "fs";
import {join} from "path";

export function detectStudyFolders(baseDirectory: string): IFileSystemNode[] {
    const root: IFileSystemNode = {
        name: baseDirectory,
        type: "directory",
        path: baseDirectory,
        children: [],
    }

    // recursively list all files in baseDirectory and build file tree
    listDirectory(baseDirectory, root, baseDirectory);
    return root.children;
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

                    const currentNode: IFileSystemSample = {
                        name: sampleId,
                        path: join(path, nodeName),
                        folder: path,
                        type: "sample",
                        isPaired: false,
                        isCompressed: extension.endsWith(".gz"),
                        metadataAvailable: false,
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
    const regex = new RegExp('(.*)(((_R1_).*|(_F_).*|(_R1)|(@F)|(_1))|((_R2_).*|(_R_).*|(_R2)|(@R)|(_2)))\\.((fastq|fq)(\\.gz)?)', 'gm')
    let match;

    if ((match = regex.exec(fileName)) !== null) {
        console.debug(`Matched file ${fileName}`);
        return match;
    }
    return null;
}
