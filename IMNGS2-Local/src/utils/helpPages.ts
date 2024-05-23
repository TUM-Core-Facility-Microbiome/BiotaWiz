import {GITHUB_BASE_URL} from "../config";

export const helpPages = {
    DOCPIF: `${GITHUB_BASE_URL}/discussions/1`, // Docker Pull Image Failed
    RASMIS: `${GITHUB_BASE_URL}/discussions/2`,  // Resource Asset Missing
    RAPIOF: `${GITHUB_BASE_URL}/discussions/3`,  // Release API Offline
    USEARCHELF: `${GITHUB_BASE_URL}/discussions/5`,  // USEARCH binary not an ELF
    USEARCHV: `${GITHUB_BASE_URL}/discussions/6`,  // USEARCH binary version mismatch
    USEARCHMEM: `${GITHUB_BASE_URL}/discussions/7`,  // USEARCH memory exceeded
    IMNARGC: `${GITHUB_BASE_URL}/discussions/12`,  // Argument file could not be placed in fastq directory to be read for analysis
    IMNARGF: `${GITHUB_BASE_URL}/discussions/11`,  // Error parsing argument file
    IMNPREF: `${GITHUB_BASE_URL}/discussions/13`,  // Failure in preprocessing interrupting Analysis
    IMNANF: `${GITHUB_BASE_URL}/discussions/14`,  // Failure in analysis
    IMNPREC: `${GITHUB_BASE_URL}/discussions/15`,  // Failure in preprocessing but analysis completed (partial preprocessing)
    IMNPREA: `${GITHUB_BASE_URL}/discussions/16`,  // All samples failed to get preprocessed
}
