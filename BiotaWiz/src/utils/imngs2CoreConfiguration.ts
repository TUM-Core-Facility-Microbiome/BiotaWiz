import {Environment, SpikeMode, Imngs2CoreAnalysisMode, LogSection} from "../enums";
import {app, BrowserWindow, Notification, shell} from "electron";
import path from "path";
import {existsSync, readFileSync, writeFile} from "fs";
import {stringify} from "yaml";
import {taskQueue} from "./taskQueue";
import {logToSection, updateProgress} from "./logHandler";
import {run} from "./backend";
import {getOrDownloadUsearch32Binary} from "./usearch";
import {helpPages} from "./helpPages";

export class Imngs2CoreConfiguration {
    private analysisMode = Imngs2CoreAnalysisMode.TIC;
    private baseDirectory = "";
    private mappingFile = "";
    private yamlFile = "";

    private spikeMode: SpikeMode = null;
    private samples: IFileSystemSample[] = [];
    private parameters: IImngs2CoreArguments = null;
    private threads: Number = 1;

    private analysisDirectory: string | null = null;

    public setAnalysisMode(analysisMode: Imngs2CoreAnalysisMode) {
        this.analysisMode = analysisMode;
        console.log(`Analysis mode set to ${analysisMode}`);
    }

    public getAnalysisMode() {
        return this.analysisMode;
    }

    public setBaseDirectory(baseDirectory: string) {
        this.baseDirectory = baseDirectory;
        console.log(`IMNGS2-Core base directory set to ${baseDirectory}`);
    }

    public setAnalysisDirectory(analysisDirectory: string) {
        // analysis directory is relative to base directory
        this.analysisDirectory = path.join(this.baseDirectory, analysisDirectory);
        console.log(`IMNGS2-Core analysis directory set to ${analysisDirectory}`);
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

    public getDefaultParameters(): IImngs2CoreArguments {
        // Set up with defaults common to TIC and De-Novo Clustering mode
        const DEFAULTS = {
            MergePairsArgs: {
                fastq_maxdiffs: 50,
                fastq_pctid: 50,
                fastq_minmergelen: 200,
                fastq_maxmergelen: 600
            },
            TrimBothSidesArgs: {
                stripleft: 15,
                stripright: 15
            },
            TrimOneSideArgs: {
                stripleft: 15
            },
            FilterBothSidesArgs: {
                fastq_maxee_rate: 0.002
            },
            FilterOneSideArgs: {
                fastq_maxee_rate: 0.002,
                fastq_truncqual: 10
            },
            ClusterZOTUsArgs: {
                minsize: 2
            },
            Filter16SArgs: {
                e: 0.1,
                num_alignments: 1
            },
            BuildZOTUTableArgs: {
                id: 0.99
            },
            AddTaxArgs: {
                turn: "all"
            },
            TrimSidesArgs: {
                stripleft: 5,
                stripright: 5
            },
            CreateTableTICArgs: {
                abund_limit: 0,
                sample_wise_correction: false
            }
        }

        // set mode specific arguments
        if (this.analysisMode == Imngs2CoreAnalysisMode.TIC) {
            (DEFAULTS as IImngs2CoreArgumentsTICMode).ComplexTICArgs ={
                family_sim: 0.9,
                genus_sim: 0.95,
                species_sim: 0.97
            }

            return DEFAULTS as IImngs2CoreArgumentsTICMode
        } else if (this.analysisMode == Imngs2CoreAnalysisMode.DE_NOVO) {
            (DEFAULTS as IImngs2CoreArgumentsDeNovoMode).DeNovoClusterZOTUsArgs = {
                minsize: 8
            }

            return DEFAULTS as IImngs2CoreArgumentsDeNovoMode
        } else {
            console.error(`Unknown analysis mode ${this.analysisMode}`);
            return null;
        }
    }

    public setParameters(parameters: IImngs2CoreArguments) {
        this.parameters = parameters;
        this.writeParameterFile();
    }

    public setThreads(threads: Number) {
        this.threads = threads;
    }

    public runPipeline() {
        console.log(this.yamlFile);
        const yamlFile = this.relativePathToBaseDirectory(this.yamlFile);
        const mappingFile = this.relativePathToBaseDirectory(this.mappingFile);

        logToSection(LogSection.PREPARE_BACKEND, "Pipeline will start after environment is initialized...");

        console.log(`Running pipeline`);
        // add to task queue
        taskQueue.defer(async () => {
            updateProgress({
                step: "Running IMNGS2-Core",
                message: "Running Analysis...",
                state: "running",
            });
            logToSection(LogSection.PREPARE_BACKEND, "Creating mounts");
            await run(Environment.IMNGS2CORE, [
                "run_imngs2",
                "--analysis-mode", this.analysisMode.valueOf(),
                "--yml-file", yamlFile,
                "--mapping-file", mappingFile,
                "--threads", this.threads.toString(),
            ], {
                binds: [
                    {
                        source: this.baseDirectory,
                        target: "/base/inputs",
                    },
                ],
            }).then((statusCode: number) => {
                logToSection(LogSection.PREPARE_BACKEND, `Pipeline finished with status code ${statusCode}`);
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
                    if (statusCode == 143 || statusCode == 137 || statusCode == 130) {  // SIGTERM, SIGKILL, SIGINT
                        updateProgress({
                            step: "Running IMNGS2-Core",
                            message: "Pipeline was terminated",
                            state: "warning",
                        });
                    } else if (statusCode == 160) {  // USEARCH memory error
                        updateProgress(
                            {
                                step: `Running IMNGS2-Core`,
                                message: `USEARCH process ran out of memory`,
                                state: "error",
                                error: {
                                    code: "USEARCHMEM",
                                    helpUrl: helpPages.USEARCHMEM,
                                },
                            }
                        );
                    } else if (statusCode == 161) {  // USEARCH binary is not an ELF
                        updateProgress(
                            {
                                step: `Running IMNGS2-Core`,
                                message: `Problem with given USEARCH binary. Binary is not an ELF.`,
                                state: "error",
                                error: {
                                    code: "USEARCHELF",
                                    helpUrl: helpPages.USEARCHELF,
                                },
                            }
                        );
                    } else if (statusCode == 162) {  // USEARCH binary is not v11
                        updateProgress(
                            {
                                step: `Running IMNGS2-Core`,
                                message: `Problem with given USEARCH binary. Version is not v11.`,
                                state: "error",
                                error: {
                                    code: "USEARCHV",
                                    helpUrl: helpPages.USEARCHV,
                                },
                            }
                        );
                    } else if (statusCode == 163) {  // Argument file could not be placed in fastq directory to be read for analysis
                        updateProgress(
                            {
                                step: `Running IMNGS2-Core`,
                                message: `Argument file could not be placed in fastq directory to be read for analysis`,
                                state: "error",
                                error: {
                                    code: "IMNARGC",
                                    helpUrl: helpPages.IMNARGC,
                                },
                            }
                        );
                    } else if (statusCode == 164) {  // Any error in parsing argument file
                        updateProgress(
                            {
                                step: `Running IMNGS2-Core`,
                                message: `Error parsing argument file`,
                                state: "error",
                                error: {
                                    code: "IMNARGF",
                                    helpUrl: helpPages.IMNARGF,
                                },
                            }
                        );
                    } else if (statusCode == 165) {  // Failure in preprocessing interrupting Analysis
                        updateProgress(
                            {
                                step: `Running IMNGS2-Core`,
                                message: `Failure in preprocessing interrupting Analysis`,
                                state: "error",
                                error: {
                                    code: "IMNPREF",
                                    helpUrl: helpPages.IMNPREF,
                                },
                            }
                        );
                    } else if (statusCode == 166) {  // Failure in analysis
                        updateProgress(
                            {
                                step: `Running IMNGS2-Core`,
                                message: `Failure in analysis`,
                                state: "error",
                                error: {
                                    code: "IMNANF",
                                    helpUrl: helpPages.IMNANF,
                                },
                            }
                        );
                    } else if (statusCode == 167) {  // Failure in preprocessing but analysis completed (partial preprocessing)
                        updateProgress(
                            {
                                step: `Running IMNGS2-Core`,
                                message: `Failure in preprocessing but analysis completed (partial preprocessing)`,
                                state: "error",
                                error: {
                                    code: "IMNPREC",
                                    helpUrl: helpPages.IMNPREC,
                                },
                            }
                        );
                    } else if (statusCode == 168) {  // All samples failed to get preprocessed
                        updateProgress(
                            {
                                step: `Running IMNGS2-Core`,
                                message: `All samples failed to get preprocessed`,
                                state: "error",
                                error: {
                                    code: "IMNPREA",
                                    helpUrl: helpPages.IMNPREA,
                                },
                            }
                        );
                    } else if (statusCode == 169) {  // Anlysis skipped
                        updateProgress(
                            {
                                step: `Running IMNGS2-Core`,
                                message: `Analysis skipped`,
                                state: "error",
                                error: {
                                    code: "IMNSKIP",
                                    helpUrl: helpPages.IMNSKIP,
                                },
                            }
                        );
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

    public openAnalysisDirectory() {
        if (this.analysisDirectory) {
            shell.openPath(this.analysisDirectory).then(() => {
                console.log(`Opened analysis directory in default file explorer`);
            }).catch((err: string) => {
                console.error(err);
            });
        }
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
            let spike = {spikeIn: '0', weight: 'NaN'};  // set to dummy values; will be ignored by pipeline
            const additional = [];
            if (sample.metadata) {
                console.debug(sample.metadata);
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
