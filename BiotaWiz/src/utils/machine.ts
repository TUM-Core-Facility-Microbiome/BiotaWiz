import os from 'os';

// maximum number of threads
export function getMachineThreads() {
    return os.cpus().length;
}

// available memory in GiB
export function getMachineMemory() {
    return os.totalmem() / 1024 / 1024 / 1024;
}

// get recommended number of threads
export function getRecommendedThreads() {
    const maxThreads = getMachineThreads();
    const maxMemory = getMachineMemory();

    // assume 4 GiB required per thread
    // this is motivated from the expected memory usage especially in the preprocessing step of the TACTIC pipeline
    const threadsRecommendedByMem = Math.floor(maxMemory / 4);

    // do not use all threads if memory is not the limiting factor
    const threadsRecommendedByCpu = maxThreads > 2 ? maxThreads - 1 : maxThreads;

    // recommended number of threads
    const threadsRecommended = Math.min(threadsRecommendedByMem, threadsRecommendedByCpu);
    // make sure this is at least 1
    return Math.max(1, threadsRecommended);
}
