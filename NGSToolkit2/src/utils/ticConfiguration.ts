import {Environment, SpikeMode} from "../enums";
import {shell} from "electron";
import path from "path";
import {writeFile} from "fs";
import {stringify} from "yaml";
import {taskQueue} from "./taskQueue";
import {updateProgress} from "./logHandler";
import {run} from "./backend";

class TicConfiguration {
    private baseDirectory = "";
    private mappingFile = "";
    private yamlFile = "";

    private spikeMode: SpikeMode = null;
    private samples: IFileSystemNode[] = [];
    private parameters: ITicPipelineArguments = null;

    public setBaseDirectory(baseDirectory: string) {
        this.baseDirectory = baseDirectory;
        console.log(`TIC base directory set to ${baseDirectory}`);
    }

    public setSamples(samples: IFileSystemNode[]) {
        this.samples = samples;
    }

    public setSpikeMode(spikeMode: SpikeMode) {
        this.spikeMode = spikeMode;
        console.log(`Spike mode set to ${spikeMode}`);
        this.writeMappingFile();
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
            shell.openPath(this.mappingFile).then(() => {
                console.log(`Opened mapping file in default editor`);
            }).catch((err: string) => {
                console.error(err);
            });
        }
    }

    private generateMappingFileContent() {
        const delimiter = "\t";
        let content = ['#SampleID', 'total_weight_in_g', 'spike_amount', 'parent_path'].join(delimiter) + "\n";

        let spikeDefaults = ['NaN', '0'];  // set to dummy values; will be ignored by pipeline
        if (this.spikeMode == SpikeMode.SPIKED) {
            spikeDefaults = ['', ''];  // set empty to be filled by user
        }

        this.samples.forEach((sample) => {
            const baseName = sample.name;

            // parent path relative to baseDirectory
            const parentPath = this.relativePathToBaseDirectory(path.dirname(sample.path));
            content += [baseName, ...spikeDefaults, parentPath].join(delimiter) + "\n";
        });
        return content;
    }

    public setParameters(parameters: ITicPipelineArguments) {
        this.parameters = parameters;
        this.writeParameterFile();
    }

    private writeParameterFile() {
        this.yamlFile = path.join(this.baseDirectory, 'IMNGS2Pipeline_args.yml');
        writeFile(this.yamlFile, stringify(this.parameters), (err) => {
            console.error(err);
        });
    }

    public runPipeline() {
        console.log(this.yamlFile);
        const yamlFile = this.relativePathToBaseDirectory(this.yamlFile);
        const mappingFile = this.relativePathToBaseDirectory(this.mappingFile);

        console.log(`Running pipeline`);
        // add to task queue
        taskQueue.defer(async () => {
            updateProgress({
                step: "Running TIC",
                message: "Running Analysis...",
                state: "running",
            });

            await run(Environment.TIC, ["run_imngs2", "--yml-file", yamlFile, "--mapping-file", mappingFile], {
                binds: [
                    {
                        source: this.baseDirectory,
                        target: "/base/inputs",
                    },
                ],
            }).then((statusCode: number) => {
                console.debug(`Pipeline finished with status code ${statusCode}`);
                if (statusCode == 0) {
                    updateProgress({
                        step: "Running TIC",
                        message: "TIC finished",
                        state: "done",
                    });
                } else {
                    updateProgress({
                        step: "Running TIC",
                        message: "Pipeline returned unexpected with failure code",
                        state: "error",
                    });
                }
            }).catch((error: string) => {
                console.error(error);
                updateProgress({
                    step: "Running TIC",
                    message: "Could not start pipeline",
                    state: "error",
                });
            });
        });
    }

    private relativePathToBaseDirectory(absolutePath: string) {
        // path relative to baseDirectory
        const baseWithTailingSep = this.pathWithTailingSep(this.baseDirectory);
        absolutePath = this.pathWithTailingSep(absolutePath);
        console.log(`baseWithTailingSep: ${baseWithTailingSep}`);
        return absolutePath.replace(baseWithTailingSep, '');
    }

    private pathWithTailingSep(node: string) {
        return node.endsWith(path.sep) ? node : node + path.sep;
    }
}

export const ticConfiguration = new TicConfiguration();
