import {Environment, SpikeMode} from "../enums";
import {app, BrowserWindow, Notification, shell} from "electron";
import path from "path";
import {existsSync, readFileSync, writeFile} from "fs";
import {stringify} from "yaml";
import {taskQueue} from "./taskQueue";
import {logForEnvironment, updateProgress} from "./logHandler";
import {run} from "./backend";
import {getOrDownloadUsearch32Binary} from "./usearch";

export class Imngs2CoreConfiguration {
    private baseDirectory = "";
    private usearchBinary = "";
    private mappingFile = "";
    private yamlFile = "";

    private spikeMode: SpikeMode = null;
    private samples: IFileSystemSample[] = [];
    private parameters: IImngs2CoreArguments = null;

    public setBaseDirectory(baseDirectory: string) {
        this.baseDirectory = baseDirectory;
        console.log(`IMNGS2-Core base directory set to ${baseDirectory}`);
    }

    public setUsearchBinaryPath(binPath: string) {
        return new Promise<void>((resolve, reject) => {
            if (binPath === "") {  // download and set to default path
                taskQueue.defer(() => {
                    return getOrDownloadUsearch32Binary()
                }).then((downloadedPath: string) => {
                        this.usearchBinary = downloadedPath;
                        console.log(`Usearch binary path set to ${downloadedPath}`);
                        resolve();
                })
            } else {
                this.usearchBinary = binPath;
                console.log(`Usearch binary path set to ${binPath}`);
                resolve();
            }
        });
    }

    public setSamples(samples: IFileSystemSample[]) {
        this.samples = samples;
    }

    public setSpikeMode(spikeMode: SpikeMode) {
        this.spikeMode = spikeMode;
        console.log(`Spike mode set to ${spikeMode}`);
        this.writeMappingFile();
    }

    public getSpikeMode() {
        return this.spikeMode;
    }

    public checkMapping(): Promise<void> {
        return new Promise((resolve, reject) => {
            // check if file exists
            if (!existsSync(this.mappingFile)) {
                reject(`Mapping file was not found at ${this.mappingFile}`);
            }

            // read csv-like file
            const data = readFileSync(this.mappingFile, 'utf8');
            if (!data) {
                reject("Mapping file is empty");
            }
            const lines = data.split("\n");

            // check header line
            // columns should be tab-separated and be named #SampleID, total_weight_in_g, spike_amount, parent_path
            const header = lines[0];
            const columns = header.split("\t");
            if (columns.length !== 4) {
                reject("Mapping file header is not valid");
            }
            if (
                columns[0] !== "#SampleID" ||
                columns[1] !== "total_weight_in_g" ||
                columns[2] !== "spike_amount" ||
                columns[3] !== "parent_path"
            ) {
                reject("Mapping file header is not valid");
            }

            // check content
            const sampleIds: Set<string> = new Set();
            for (let i = 1; i < lines.length; i++) {
                // last line should be empty (as there is a trailing newline)
                if (i === lines.length - 1 && lines[i] === "") {
                    break;
                }

                const line = lines[i];
                const columns = line.split("\t");
                if (columns.length !== 4) {
                    reject(`Mapping file line ${i + 1} does not have 4 columns`);
                }

                // sample id should be unique within its parent path
                const sampleId = columns[0];
                const parentPath = columns[3];
                if (sampleIds.has(sampleId + parentPath)) {
                    reject(`Duplicate sample id ${sampleId} at ${parentPath} in mapping file on line ${i + 1}`);
                } else {
                    sampleIds.add(sampleId + parentPath);
                }

                // total_weight_in_g should be a number (when spikeMode is SPIKED) or NaN else
                const totalWeight = columns[1];
                if (this.spikeMode === SpikeMode.SPIKED) {
                    if (isNaN(parseFloat(totalWeight))) {
                        reject(`total_weight_in_g on line ${i + 1} is not a number`);
                    }
                } else {
                    if (totalWeight !== "NaN") {
                        reject(`total_weight_in_g on line ${i + 1} is not NaN`);
                    }
                }

                // spike_amount should be greater than 0 (when spikeMode is SPIKED) or 0 else
                const spikeAmount = columns[2];
                if (this.spikeMode === SpikeMode.SPIKED) {
                    if (parseFloat(spikeAmount) <= 0) {
                        reject(`spike_amount on line ${i + 1} must be greater than 0`);
                    }
                } else {
                    if (spikeAmount !== "0") {
                        reject(`spike_amount on line ${i + 1} should be set to 0 to skip spike normalization`);
                    }
                }

                // parent_path should be a string
                if (typeof parentPath !== "string") {
                    reject(`parent_path on line ${i + 1} is not a string`);
                }
            }

            // check number of entries
            if (sampleIds.size !== this.samples.length) {
                reject(`Number of samples in mapping file does not match number of selected samples`);
            }

            console.log("Mapping file looks good");
            resolve();
        });
    }

    public setParameters(parameters: IImngs2CoreArguments) {
        this.parameters = parameters;
        this.writeParameterFile();
    }

    public runPipeline() {
        console.log(this.yamlFile);
        const yamlFile = this.relativePathToBaseDirectory(this.yamlFile);
        const mappingFile = this.relativePathToBaseDirectory(this.mappingFile);

        logForEnvironment(Environment.IMNGS2CORE, "Pipeline will start after environment is initialized...");

        console.log(`Running pipeline`);
        // add to task queue
        taskQueue.defer(async () => {
            updateProgress({
                step: "Running IMNGS2-Core",
                message: "Running Analysis...",
                state: "running",
            });

            await run(Environment.IMNGS2CORE, [
                "run_imngs2",
                "--yml-file", yamlFile,
                "--mapping-file", mappingFile,
                "--usearch-bin", "/base/binaries/usearch",
            ], {
                binds: [
                    {
                        source: this.baseDirectory,
                        target: "/base/inputs",
                    },
                    {
                        source: this.usearchBinary,
                        target: "/base/binaries/usearch",
                    }
                ],
            }).then((statusCode: number) => {
                logForEnvironment(Environment.IMNGS2CORE, `Pipeline finished with status code ${statusCode}`);
                console.debug(`Pipeline finished with status code ${statusCode}`);
                if (statusCode == 0) {
                    updateProgress({
                        step: "Running IMNGS2-Core",
                        message: "IMNGS2-Core finished",
                        state: "done",
                    });
                    new Notification({
                        title: app.name,
                        body: "IMNGS2-Core finished successfully",
                    }).on('click', () => {
                        const mainWindow = BrowserWindow.fromId(1);
                        if (mainWindow) {
                            mainWindow.focus();
                        }
                    }).show()
                } else {
                    if (statusCode == 143 || statusCode == 137) {
                        updateProgress({
                            step: "Running IMNGS2-Core",
                            message: "Pipeline was terminated",
                            state: "warning",
                        });
                    } else {
                        updateProgress({
                            step: "Running IMNGS2-Core",
                            message: `Pipeline returned unexpected with failure code (exit code: ${statusCode})`,
                            state: "error",
                        });
                        new Notification({
                            title: app.name,
                            body: "IMNGS2-Core failed",
                        }).on('click', () => {
                            const mainWindow = BrowserWindow.fromId(1);
                            if (mainWindow) {
                                mainWindow.focus();
                            }
                        }).show()
                    }
                }
            }).catch((error: string) => {
                console.error(error);
                updateProgress({
                    step: "Running IMNGS2-Core",
                    message: "Could not start pipeline",
                    state: "error",
                });
            });
        });
    }

    private writeMappingFile() {
        // save prefilled mapping file to baseDirectory
        this.mappingFile = path.join(this.baseDirectory, 'mapping.csv');  // use file extension .csv to open in Excel but keep TSV format
        const content = this.generateMappingFileContent();
        writeFile(this.mappingFile, content, (err) => {
            console.error(err);
        });

        // open mapping file in default editor
        if (this.spikeMode == SpikeMode.SPIKED) {
            this.openMappingFile();
        }
    }

    public openMappingFile() {
        shell.openPath(this.mappingFile).then(() => {
            console.log(`Opened mapping file in default editor`);
        }).catch((err: string) => {
            console.error(err);
        });
    }

    private generateMappingFileContent() {
        const delimiter = "\t";

        // join additional metadata for header
        let additionalMetadata = new Set<string>();
        this.samples.forEach((sample) => {
            if (sample.metadata) {
                // get keys of additional metadata
                for (let key in sample.metadata.additional) {
                    additionalMetadata.add(key);
                }
            }
        });
        console.debug(additionalMetadata);

        // remove default metadata keys
        const additionalColumns = [...additionalMetadata];
        const columns = ['#SampleID', 'total_weight_in_g', 'spike_amount', 'parent_path', ...additionalMetadata];
        let content = columns.join(delimiter) + "\n";

        this.samples.forEach((sample) => {
            const baseName = sample.name;
            // parent path relative to baseDirectory

            const parentPath = this.relativePathToBaseDirectory(path.dirname(sample.path));
            let spike = {spikeIn: 'NaN', weight: 'NaN'};  // set to dummy values; will be ignored by pipeline
            const additional = [];
            if (sample.metadata) {
                if (this.spikeMode == SpikeMode.SPIKED) {
                    if (sample.metadata.spikeAmount) {
                        spike.spikeIn = sample.metadata.spikeAmount.toString();
                    }
                    if (sample.metadata.totalWeight) {
                        spike.weight = sample.metadata.totalWeight.toString();
                    }
                }
                for (let column in additionalColumns) {
                    if (sample.metadata.additional && sample.metadata.additional.has(column)) {
                        additional.push(sample.metadata.additional.get(column));
                    } else {
                        additional.push('');
                    }
                }
            }
            console.log(spike);
            console.log(additional);
            content += [
                baseName,
                spike.weight,
                spike.spikeIn,
                parentPath,
                ...additional
            ].join(delimiter) + "\n";
        });
        return content;
    }

    private writeParameterFile() {
        this.yamlFile = path.join(this.baseDirectory, 'IMNGS2Pipeline_args.yml');
        writeFile(this.yamlFile, stringify(this.parameters), (err) => {
            console.error(err);
        });
    }

    private relativePathToBaseDirectory(absolutePath: string) {
        // path relative to baseDirectory
        const baseWithTailingSep = this.pathWithTailingSep(this.baseDirectory);
        absolutePath = this.pathWithTailingSep(absolutePath);
        console.log(`baseWithTailingSep: ${baseWithTailingSep}`);
        const relativePath = absolutePath.replace(baseWithTailingSep, '');
        return relativePath.endsWith(path.sep) ? relativePath.slice(0, -1) : relativePath;
    }

    private pathWithTailingSep(node: string) {
        return node.endsWith(path.sep) ? node : node + path.sep;
    }
}

export const imngs2CoreConfiguration = new Imngs2CoreConfiguration();
