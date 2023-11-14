import * as child_process from "child_process";
import * as platform from "./platform";

function dockerHelloWorld(): child_process.ChildProcessWithoutNullStreams {
    console.log("dockerHelloWorld");

    const subprocess = child_process.spawn(
        "docker",
        ["run", "--rm", "hello-world"],
    );

    subprocess.on('error', () => {
        console.error("Could not launch the process");
    });
    subprocess.on('close', (code, signal) => {
        console.log(`Child closed with code ${code} and signal ${signal}`);
    });
    subprocess.on('exit', (code, signal) => {
        console.log(`Child exited with code ${code} and signal ${signal}`);
    });
    subprocess.stdout.on('data', (data) => {
        console.log(`STDOUT: ${data}`);
    });
    subprocess.stderr.on('data', (data) => {
        console.log(`STDERR: ${data}`);
    });

    return subprocess;
}

function wslHelloWorld(): child_process.ChildProcessWithoutNullStreams {
    console.log("wslHelloWorld");

    const subprocess = child_process.spawn(
        "wsl",
        ["-l", "-v"],
    );

    subprocess.on('error', () => {
        console.error("Could not launch the process");
    });
    subprocess.on('close', (code, signal) => {
        console.log(`Child closed with code ${code} and signal ${signal}`);
    });
    subprocess.on('exit', (code, signal) => {
        console.log(`Child exited with code ${code} and signal ${signal}`);
    });
    subprocess.stdout.on('data', (data) => {
        console.log(`STDOUT: ${data}`);
    });
    subprocess.stderr.on('data', (data) => {
        console.log(`STDERR: ${data}`);
    });

    return subprocess;
}

export function runMockProcess(): void {
    console.log("Choosing mock process by platform");
    platform.byOS({
        [platform.platforms.LINUX]: () => dockerHelloWorld(),
        [platform.platforms.WINDOWS]: () => wslHelloWorld(),
        [platform.platforms.MAC]: () => dockerHelloWorld(),
        default: () => dockerHelloWorld(),
    })();
}
