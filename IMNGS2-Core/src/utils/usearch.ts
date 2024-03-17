import {app} from "electron";
import path from 'path';
import fs from "fs";
import axios from "axios";
import {USEARCH32_DOWNLOAD_URL} from "../config";
import {getLocalAppDataPath} from "./helpers";


export async function getOrDownloadUsearch32Binary() {
    const appDataDirectory = getLocalAppDataPath();
    const expectedPath = path.join(appDataDirectory, 'usearch11.0.667_i86linux32.gz');
    if (fs.existsSync(expectedPath)) {
        return expectedPath;
    } else {
        await download32bitBinary(expectedPath);
        return expectedPath;
    }
}

function download32bitBinary(binPath: string) {
    return new Promise<void>((resolve, reject) => {
        const writer = fs.createWriteStream(binPath);
        // download from 'https://drive5.com/downloads/usearch11.0.667_i86linux32.gz'
        axios.get(
            USEARCH32_DOWNLOAD_URL,
            {responseType: 'stream'}
        ).then((response) => {
            response.data.pipe(writer);
            writer.on('finish', () => {
                writer.close();
                resolve();
            });
            writer.on('error', (err) => {
                reject(err);
            });
        }).catch((err) => {
            reject(err);
        });
    });
}
