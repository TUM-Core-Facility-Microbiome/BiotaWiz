import {Environment, SpikeMode, MappingFileFormat, TacticAnalysisMode, LogSection} from "../enums";
import {app, BrowserWindow, Notification, shell} from "electron";
import path from "path";
import fs, {existsSync, readFileSync, writeFile} from "fs";
import {stringify} from "yaml";
import {taskQueue} from "./taskQueue";
import {logToSection, updateProgress} from "./logHandler";
import {run} from "./backend";
import {helpPages} from "./helpPages";
import {getDatabaseDirectory} from "./helpers";
import xlsx from 'node-xlsx';


const MAPPING_FILE_MODE: MappingFileFormat = MappingFileFormat.XLSX;

export class TacticConfiguration {
    private analysisMode = TacticAnalysisMode.TIC;
    private baseDirectory = "";
    private mappingFile = "";
    private yamlFile = "";

    private spikeMode: SpikeMode | null = null;
    private samples: IFileSystemSample[] = [];
    private fastqDiscoveryMessage: string | null = null;  // how the samples were found
    private parameters: ITacticArguments | null = null;
    private threads: number = 1;

    private preprocessToIndividualZOTUs: boolean = false;
    private skipNonBacterialFilter: boolean = false;

    private analysisDirectory: string | null = null;
    private spikeInSequencesDirectory: string | null = null;

    public setAnalysisMode(analysisMode: TacticAnalysisMode) {
        this.analysisMode = analysisMode;
        console.log(`Analysis mode set to ${analysisMode}`);
    }

    public getAnalysisMode() {
        return this.analysisMode;
    }

    public setBaseDirectory(baseDirectory: string) {
        this.baseDirectory = baseDirectory;
        console.log(`Pipeline base directory set to ${baseDirectory}`);
    }

    public setAnalysisDirectory(analysisDirectory: string) {
        // analysis directory is relative to base directory
        this.analysisDirectory = path.join(this.baseDirectory, analysisDirectory);
        console.log(`Pipeline analysis directory set to ${analysisDirectory}`);
    }

    public setSpikeInSequencesDirectory(spikeInSequencesDirectory: string) {
        // spike-in sequences directory is relative to base directory
        this.spikeInSequencesDirectory = spikeInSequencesDirectory;
        console.log(`Pipeline spike-in sequences directory set to ${spikeInSequencesDirectory}`);
    }

    public setPreprocessToIndividualZOTUs(preprocessToIndividualZOTUs: boolean) {
        this.preprocessToIndividualZOTUs = preprocessToIndividualZOTUs;
        console.log(`Preprocess to individual ZOTUs set to ${preprocessToIndividualZOTUs}`);
    }

    public setSkipNonBacterialFilter(skipNonBacterialFilter: boolean) {
        this.skipNonBacterialFilter = skipNonBacterialFilter;
        console.log(`Skip non-bacterial filter set to ${skipNonBacterialFilter}`);
    }

    public setFastqDiscoveryMessage(message: string) {
        this.fastqDiscoveryMessage = message;
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

    public getDefaultParameters(): ITacticArguments | null {
        // Set up with defaults common to all three pipelines (TIC, TAC, De-Novo)
        const DEFAULTS: ITacticArguments = {
            MergePairsArgs: {
                fastq_maxdiffs: 50,
                fastq_pctid: 50,
                fastq_minmergelen: 200,
                fastq_maxmergelen: 600,
            },
            TrimBothSidesArgs: {
                stripleft: 17,
                stripright: 21,
            },
            TrimOneSideArgs: {
                stripleft: 17,
            },
            FilterBothSidesArgs: {
                fastq_maxee_rate: 0.002,
                fastq_truncqual: 10,
            },
            FilterOneSideArgs: {
                fastq_maxee_rate: 0.002,
                fastq_truncqual: 10,
            },
            IndividualSampleClusterZOTUsArgs: {
                minsize: 2
            },
            Filter16SArgs: {
                e: 0.1,
                num_alignments: 1,
            },
            BuildZOTUTableArgs: {
                match_id: 0.99,
            },
            AddTaxArgs: {
                turn: "all"
            },
            ClusterZOTUsArgs: {
                minsize: 2,
                abund_limit: 0.000,
                sample_wise_correction: false,
                match_id: 0.99,
            },
        }

        // set mode specific arguments
        if (this.analysisMode == TacticAnalysisMode.TIC) {
            (DEFAULTS as ITacticArgumentsTICMode).ComplexTICArgs = {
                family_sim: 0.90,
                genus_sim: 0.95,
                species_sim: 0.987,
                // not yet implemented for TIC; not shown in the parameters view
                abund_limit: 0,
                sample_wise_correction: false,
            }

            return DEFAULTS as ITacticArgumentsTICMode
        } else if (this.analysisMode == TacticAnalysisMode.DE_NOVO) {
            (DEFAULTS as ITacticArgumentsDeNovoMode).DeNovoClusterOTUsArgs = {
                minsize: 8,
                abund_limit: 0.0025,
                sample_wise_correction: false,
            }

            return DEFAULTS as ITacticArgumentsDeNovoMode
        } else if (this.analysisMode == TacticAnalysisMode.TAC) {
            (DEFAULTS as ITacticArgumentsTACMode).TACClusterArgs = {
                // not yet implemented for TAC; not shown in the parameters view
                abund_limit: 0,
                sample_wise_correction: false,
                cluster_thr: 0.987,
            }

            return DEFAULTS as ITacticArgumentsTACMode
        } else {
            console.error(`Unknown analysis mode ${this.analysisMode}`);
            return null;
        }
    }

    public setParameters(parameters: ITacticArguments) {
        this.parameters = parameters;
        this.writeParameterFile();
    }

    public setThreads(threads: number) {
        this.threads = threads;
    }

    public runPipeline() {
        console.log(this.yamlFile);
        const yamlFile = this.relativePathToBaseDirectory(this.yamlFile);
        const mappingFile = this.relativePathToBaseDirectory(this.mappingFile);

        logToSection(LogSection.PREPARE_BACKEND, "Pipeline will start after environment is initialized...");
        if (this.fastqDiscoveryMessage) {
            logToSection(LogSection.PREPARE_BACKEND, this.fastqDiscoveryMessage);
        }

        const databaseDirectory = getDatabaseDirectory();
        // create database directory if it does not exist
        if (!fs.existsSync(databaseDirectory)) {
            fs.mkdirSync(databaseDirectory, {recursive: true});
        }

        console.log(`Running pipeline`);
        // add to task queue
        taskQueue.defer(async () => {
            updateProgress({
                step: "Running TACTIC",
                message: "Running Analysis...",
                state: "running",
            });
            logToSection(LogSection.PREPARE_BACKEND, "Creating mounts");
            // build the argument list
            const argumentList = [
                "--analysis-mode", this.analysisMode.valueOf(),
                "--yml-file", yamlFile,
                "--mapping-file", mappingFile,
                "--db-directory", "/base/databases",  // mounted database directory
                "--threads", this.threads.toString(),
            ];
            // add conditional flags
            if (this.preprocessToIndividualZOTUs) {  // set flag to preprocess up to individual ZOTUs
                argumentList.push("--individual-zotus");
            }
            if (this.skipNonBacterialFilter) {  // set flag to skip non-bacterial filter
                argumentList.push("--skip-non-bacterial-filter");
            }
            // add conditional arguments
            if (this.spikeInSequencesDirectory) {
                argumentList.push("--spikes-references-dir");
                argumentList.push(this.spikeInSequencesDirectory);
            }

            await run(Environment.TACTIC,
                "/base/run_tactic.py",  // skip the docker entrypoint and call the script directly
                {
                    binds: [
                        {  // base directory
                            source: this.baseDirectory,
                            target: "/base/inputs",
                        },
                        {  // database directory
                            source: databaseDirectory,
                            target: "/base/databases",
                        },
                    ],
            }, argumentList).then((statusCode: number) => {
                logToSection(LogSection.PREPARE_BACKEND, `Pipeline finished with status code ${statusCode}`);
                console.debug(`Pipeline finished with status code ${statusCode}`);
                if (statusCode == 0) {
                    updateProgress({
                        step: "Running TACTIC",
                        message: "TACTIC finished",
                        state: "done",
                    });
                    new Notification({
                        title: app.name,
                        body: "TACTIC finished successfully",
                    }).on('click', () => {
                        const mainWindow = BrowserWindow.fromId(1);
                        if (mainWindow) {
                            mainWindow.focus();
                        }
                    }).show()
                } else {
                    if (statusCode == 143 || statusCode == 137 || statusCode == 130) {  // SIGTERM, SIGKILL, SIGINT
                        updateProgress({
                            step: "Running TACTIC",
                            message: "Pipeline was terminated",
                            state: "warning",
                        });
                    } else if (statusCode == 160) {  // USEARCH memory error
                        updateProgress(
                            {
                                step: `Running TACTIC`,
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
                                step: `Running TACTIC`,
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
                                step: `Running TACTIC`,
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
                                step: `Running TACTIC`,
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
                                step: `Running TACTIC`,
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
                                step: `Running TACTIC`,
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
                                step: `Running TACTIC`,
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
                                step: `Running TACTIC`,
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
                                step: `Running TACTIC`,
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
                                step: `Running TACTIC`,
                                message: `Analysis skipped`,
                                state: "error",
                                error: {
                                    code: "IMNSKIP",
                                    helpUrl: helpPages.IMNSKIP,
                                },
                            }
                        );
                    } else if (statusCode == 171) {
                        updateProgress({
                            step: "Running TACTIC",
                            message: `Failure in spike removal`,
                            state: "error",
                            error: {
                                code: "F171",
                                helpUrl: helpPages.F171,
                            },
                        });
                    } else if (statusCode == 172) {  // SILVA database could not be downloaded and no local copy exists
                        updateProgress({
                            step: "Running TACTIC",
                            message: "Could not download the SILVA database. Make sure the pipeline has internet access",
                            state: "error",
                        });
                    } else {
                        updateProgress({
                            step: "Running TACTIC",
                            message: `Pipeline returned unexpected with failure code (exit code: ${statusCode})`,
                            state: "error",
                        });
                        new Notification({
                            title: app.name,
                            body: "TACTIC failed",
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
                    step: "Running TACTIC",
                    message: "Could not start pipeline",
                    state: "error",
                    error: {
                        code: "NOSTRT",
                        helpUrl: helpPages.NOSTRT,
                    },
                });
            });
        });
    }

    private writeMappingFile() {
        if (MAPPING_FILE_MODE == MappingFileFormat.TSV) {
            this.writeMappingFileTsv();
        } else if (MAPPING_FILE_MODE == MappingFileFormat.XLSX) {
            this.writeMappingFileXlsx();
        } else {
            console.error(`Unknown mapping file mode ${MAPPING_FILE_MODE}`);
            throw new Error(`Unknown mapping file mode ${MAPPING_FILE_MODE}`);
        }

        // open mapping file in default editor
        if (this.spikeMode == SpikeMode.SPIKED) {
            this.openMappingFile();
        }
    }

    private writeMappingFileTsv() {
        // save prefilled mapping file to baseDirectory
        const timeStamp = Date.now();
        const filePath = path.join(this.baseDirectory, `mapping_${timeStamp}.csv`);  // use file extension .csv to open in Excel but keep TSV format
        const content = this.generateMappingFileContent();

        this.writeTsv(filePath, content);
        this.mappingFile = filePath;
    }

    private writeTsv(path: string, content: string[][]) {
        const delimiter = "\t";
        const rowDelimiter = "\n";

        const tsvContent = content.map((row) => {
            return row.join(delimiter);
        }).join(rowDelimiter);

        writeFile(path, tsvContent, (err) => {
            console.error(err);
        });
    }

    private writeMappingFileXlsx() {
        // save prefilled mapping file to baseDirectory
        const timeStamp = Date.now();
        this.mappingFile = path.join(this.baseDirectory, `mapping_${timeStamp}.xlsx`);
        const content = this.generateMappingFileContent();

        const buffer = xlsx.build([{name: "mapping", data: content, options: {}}]);
        writeFile(this.mappingFile, buffer, (err) => {
            console.error(err);
        });
    }

    public convertMappingFileFormatXlsxToTsv() {
        if (MAPPING_FILE_MODE == MappingFileFormat.TSV) {
            console.error(`Mapping file is already in TSV format`);
            return;
        }

        // convert xlsx file to tsv file
        const xlsxFile = this.mappingFile;
        // get sheets of xlsx file; first sheet is the one we want
        const workSheets = xlsx.parse(xlsxFile);

        const tsvFile = this.mappingFile.replace(/\.xlsx$/, ".csv");
        this.writeTsv(tsvFile, workSheets[0].data);

        console.log(`Converted mapping file from XLSX to TSV format. New file: ${tsvFile}`);
        this.mappingFile = tsvFile;
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

    // Generate Mapping file content as an array (columns) of string arrays (rows
    private generateMappingFileContent() {
        // join additional metadata for header
        const additionalMetadata = new Set<string>();
        this.samples.forEach((sample) => {
            if (sample.metadata) {
                // get keys of additional metadata
                for (const key in sample.metadata.additional) {
                    additionalMetadata.add(key);
                }
            }
        });
        console.debug(additionalMetadata);

        // remove default metadata keys
        const additionalColumns = [...additionalMetadata];
        const header = ['#SampleID', 'total_weight_in_g', 'spike_amount', 'parent_path', ...additionalMetadata];
        const content = [header];

        this.samples.forEach((sample) => {
            const baseName = sample.name;
            // parent path relative to baseDirectory

            const parentPath = this.relativePathToBaseDirectory(path.dirname(sample.path));
            const spike = {spikeIn: '0', weight: 'NaN'};  // set to dummy values; will be ignored by pipeline
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
                for (const column in additionalColumns) {
                    if (sample.metadata.additional && sample.metadata.additional.has(column)) {
                        additional.push(sample.metadata.additional.get(column) ?? '');
                    } else {
                        additional.push('');
                    }
                }
            }
            console.log(spike);
            console.log(additional);
            content.push([
                baseName,
                spike.weight,
                spike.spikeIn,
                parentPath,
                ...additional
            ]);
        });
        return content;
    }

    private writeParameterFile() {
        this.yamlFile = path.join(this.baseDirectory, 'TACTICPipeline_args.yml');
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

export const tacticConfiguration = new TacticConfiguration();
