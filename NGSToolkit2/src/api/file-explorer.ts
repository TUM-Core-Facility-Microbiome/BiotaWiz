// list files in a directory
import {readdirSync} from "fs";
import {join} from "path";

export function detectStudyFolders(baseDirectory: string): IFileSystemNode[] {
    // search for folders having a fastq sub-folder
    const files = readdirSync(join(baseDirectory));
    const studies = [];
    for (const file of files) {
        const stats = readdirSync(join(baseDirectory, file));
        for (const stat of stats) {
            if (stat === "fastq") {
                const studyFolder = {
                    name: file,
                    type: "study",
                    path: join(baseDirectory, file),
                    children: [] as IFileSystemNode[],
                }

                // list the files in the fastq folder
                const fastqFiles = readdirSync(join(baseDirectory, file, stat));
                for (const fastqFile of fastqFiles) {
                    // TODO: Check if file is a fastq file or gzipped fastq file; handle paired read files
                    studyFolder.children.push({
                            name: fastqFile,
                            type: "fastq",
                            path: join(baseDirectory, file, stat, fastqFile),
                        }
                    )
                }

                if (studyFolder.children.length > 0) {
                    studies.push(studyFolder);
                }
            }
        }
    }
    return studies;
}
