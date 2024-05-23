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
    const threads = getMachineThreads();
    return threads > 4 ? threads - 2 : threads;
}
