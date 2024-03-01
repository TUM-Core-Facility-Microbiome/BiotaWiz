import {existsSync, readFileSync} from "fs";
import {SpikeMode} from "../enums";

export async function checkMappingFile(mappingFile: string, ticConfig: TicConfiguration): Promise<void> {
    return new Promise((resolve, reject) => {
        // check if file exists
        if (!existsSync(mappingFile)) {
            reject(`Mapping file was not found at ${mappingFile}`);
        }

        // read csv-like file
        const data = readFileSync(mappingFile, 'utf8');
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
            if (ticConfig.spikeMode === SpikeMode.SPIKED) {
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
            if (ticConfig.spikeMode === SpikeMode.SPIKED) {
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
        if (sampleIds.size !== ticConfig.samples.length) {
            reject(`Number of samples in mapping file does not match number of selected samples`);
        }

        console.log("Mapping file looks good");
        resolve();
    });
}
