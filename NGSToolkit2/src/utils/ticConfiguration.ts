import {SpikeMode} from "../enums";
import {shell} from "electron";
import path from "path";
import {writeFile} from "fs";
import {stringify} from "yaml";
import {taskQueue} from "./taskQueue";
import {updateProgress} from "./logHandler";

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
        this.mappingFile = path.join(this.baseDirectory, 'mapping.csv');
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
        let content = "#SampleID,total_weight_in_g,amount_spike,parent_path\n";

        let spikeDefaults = ",";  // keep empty if no spike
        if (this.spikeMode == SpikeMode.SPIKED) {
            spikeDefaults = "1,1";  // set to dummy values
        }

        this.samples.forEach((sample) => {
            const baseName = sample.name;
            const parentPath = path.dirname(sample.path);
            content += `${baseName},${spikeDefaults},${parentPath}\n`;
        });
        return content;
    }

    public setParameters(parameters: ITicPipelineArguments) {
        this.parameters = parameters;
        this.writeParameterFile();
    }

    private writeParameterFile() {
        this.yamlFile = path.join(this.baseDirectory, 'parameters.yaml');
        writeFile(this.yamlFile, stringify(this.parameters), (err) => {
            console.error(err);
        });
    }

    public runPipeline() {
        console.log(`Running pipeline with parameters: ${this.parameters}`);
        // add to task queue
        taskQueue.defer(async () => {
            updateProgress({
                step: "Running TIC",
                message: "This is a mock process. It will take 10 seconds.",
                state: "running",
            });

            // mock
            setTimeout(() => {
                updateProgress({
                    step: "Running TIC",
                    message: "TIC finished",
                    state: "done",
                });
            }, 10000);
        });
    }
}

export const ticConfiguration = new TicConfiguration();
