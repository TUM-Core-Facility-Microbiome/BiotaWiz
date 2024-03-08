import {app} from "electron";
import path from 'path';
import fs from "fs";
import axios from "axios/index";
import {USEARCH32_DOWNLOAD_URL} from "../config";
import {logForEnvironment, updateProgress} from "./logHandler";
import {Environment} from "../enums";


export async function getOrDownloadUsearch32Binary() {
    const expectedPath = path.join(app.getPath('userData'), 'usearch11.0.667_i86linux32.gz');
    if (fs.existsSync(expectedPath)) {
        return expectedPath;
    } else {
        await download32bitBinary(expectedPath);
        return expectedPath;
    }
}

async function download32bitBinary(path: string) {
    return new Promise<void>((resolve, reject) => {
        resolve();
        // updateProgress({
        //     step: "Downloading USEARCH32 binary",
        //     message: "Downloading",
        //     state: "running",
        // });
        // logForEnvironment(Environment.TIC, "Downloading USEARCH32 binary");
        //
        // const writer = fs.createWriteStream(path);
        // axios.get(
        //     USEARCH32_DOWNLOAD_URL,
        //     {responseType: 'stream'}
        // ).then((response) => {
        //     response.data.pipe(writer);
        //
        //     writer.on('finish', () => {
        //         updateProgress({
        //             step: "Downloading USEARCH32 binary",
        //             message: "Downloaded",
        //             state: "done",
        //         });
        //         logForEnvironment(Environment.TIC, "Download finished");
        //         resolve();
        //     });
        //     writer.on('error', (error) => {
        //         reject(error);
        //     });
        // }).catch((error) => {
        //     reject(error);
        // });
    });
}
