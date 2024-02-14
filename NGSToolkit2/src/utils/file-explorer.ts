// list files in a directory
import {readdirSync} from "fs";
import {join} from "path";
import * as fs from "fs";

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

function listDirectory(baseDirectory: string, currentRoot: IFileSystemNode, path: string) {
    try {
        const files = readdirSync(path);

        files.forEach((nodeName) => {
            if (fs.statSync(join(path, nodeName)).isDirectory()) {
                const currentNode: IFileSystemNode = {
                    name: nodeName,
                    type: "directory",
                    path: join(path, nodeName),
                    children: [],
                }
                currentRoot.children.push(currentNode);
                listDirectory(baseDirectory, currentNode, join(path, nodeName));
            } else {
                let match;
                if ((match = matchFastqFile(nodeName)) !== null) {
                    const sampleId = match[1];
                    const forward = match[3] === "1";
                    const extension = match[4];
                    const currentNode: IFileSystemSample = {
                        name: sampleId,
                        path: join(path, nodeName),
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
                        if ((forwardNode = currentRoot.children.find((node) => node.name === sampleId)) !== undefined) {
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
    if (fileName.endsWith(".fastq") || fileName.endsWith(".fastq.gz")) {
        const regex = new RegExp('((^.*)_S\\d+_L\\d{3})_R([1,2])_\\d{3}\\.(fastq(\\.gz)?)', 'gm')
        let match;

        if ((match = regex.exec(fileName)) !== null) {
            return match;
        }
    }
    return null;
}
