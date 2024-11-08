import * as child_process from "child_process";
import * as platform from "./platform";
import {getBackend} from "./storage";


async function dockerHelloWorld(): Promise<number> {
    return runSubprocess(
        "docker",
        ["run", "--rm", "python", "python", "-c",
            "import time; print('Hello World'); time.sleep(1); print('Hello World', flush=True); time.sleep(5); print('Hello World'); time.sleep(1);"],
    );
}

function wslHelloWorld(): Promise<number> {
    return runSubprocess(
        "wsl",
        ["-l", "-v"],
    );
}

export function runSubprocess(command: string, args: string[], logHandler: (msg: string, isStderr: boolean) => void = () => {
    return
}, pidRegister: Set<child_process.ChildProcess> | null = null): Promise<number> {
    return new Promise<number>((resolve, reject) => {
        const subprocess = child_process.spawn(command, args);
        if (pidRegister) {
            pidRegister.add(subprocess);
        }
        console.log(`Spawned child with pid ${subprocess.pid}`);

        subprocess.stdout.on('data', (data) => {
            if (data instanceof Buffer) {
                const msg = data.toString();
                logHandler(msg, false);
            }
        });
        subprocess.stderr.on('data', (data) => {
            if (data instanceof Buffer) {
                const msg = data.toString();
                logHandler(msg, true);
            }
        });

        subprocess.on('error', () => {
            console.error("Could not launch the process");
            reject();
        });
        subprocess.on('exit', (code, signal) => {
            console.log(`Child exited with code ${code} and signal ${signal}`);
        });
        // close always emits either after exit or error
        subprocess.on('close', (code, signal) => {
            console.log(`Child closed with code ${code} and signal ${signal}`);
            if (pidRegister) {
                pidRegister.delete(subprocess);
            }
            resolve(code);
        });
    });
}

export function runMockProcess(): Promise<number> {
    console.log("Choosing mock process by platform");
    return platform.byOS({
        [platform.platforms.LINUX]: () => dockerHelloWorld(),
        [platform.platforms.WINDOWS]: () => wslHelloWorld(),
        [platform.platforms.MAC]: () => dockerHelloWorld(),
        default: () => dockerHelloWorld(),
    })();
}

export function getBackendVersion(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        getBackend().then((backend) => {
            console.log(`Getting version for backend ${backend.name}`);
            const subprocess = child_process.spawn(
                backend.command,
                ["--version"],
            );

            subprocess.stdout.on('data', (data) => {
                if (data instanceof Buffer) {
                    // remove null bytes as WSL likes to output them
                    // eslint-disable-next-line no-control-regex
                    const msg = data.toString('utf8').replace(/\x00/g, '');
                    console.log(msg);
                    resolve(msg);
                }
            });
            subprocess.on('close', (code, signal) => {
                console.log(`Child closed with code ${code} and signal ${signal}`);
                reject(code);
            });
            subprocess.on('error', (err) => {
                console.error(`Error starting process: ${err}`);
                reject(err);
            });
        });
    });
}

async function checksumUnix(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const subprocess = child_process.spawn(
            'sha256sum',
            [path],
        );

        subprocess.stdout.on('data', (data) => {
            if (data instanceof Buffer) {
                const msg = data.toString();
                console.log(msg);
                resolve(msg);
            }
        });
        subprocess.on('close', (code, signal) => {
            console.log(`Child closed with code ${code} and signal ${signal}`);
            reject(code);
        });
    });
}

async function checksumWindows(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const subprocess = child_process.spawn(
            'certutil',
            ['-hashfile', path, 'SHA256'],
        );

        subprocess.stdout.on('data', (data) => {
            if (data instanceof Buffer) {
                const msg = data.toString();
                console.log(msg);
                resolve(msg);
            }
        });
        subprocess.on('close', (code, signal) => {
            console.log(`Child closed with code ${code} and signal ${signal}`);
            reject(code);
        });
    });
}

export async function getChecksum(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        console.log("Calculating checksum by platform");
        const stdout: Promise<string> = platform.byOS({
            [platform.platforms.LINUX]: () => checksumUnix(path),
            [platform.platforms.WINDOWS]: () => checksumWindows(path),
            [platform.platforms.MAC]: () => checksumUnix(path),
            default: () => {
                throw new Error(`Platform ${platform.getPlatform()} not supported`);
            },
        })();

        stdout.then(
            (value) => {
                const sha265Regex = new RegExp('^[A-Fa-f0-9]{64}', 'm')  // any of the lines need to start with a sha256 hash

                let match;
                if ((match = sha265Regex.exec(value)) !== null) {
                    // The result can be accessed through the `m`-variable.
                    match.forEach((match, groupIndex) => {
                        console.log(`Found match, group ${groupIndex}: ${match}`);
                        resolve(match);
                    });
                } else {
                    reject(`Could not parse checksum from ${value}`);
                }
            }
        ).catch((reason) => {
            reject(reason);
        });
    });
}
