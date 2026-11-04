import {DOCS_BASE_URL} from "../config";

const ERROR_CODES_PAGE = `${DOCS_BASE_URL}/troubleshooting/troubleshooting-error-codes`;

export const helpPages = {
    DOCPIF: `${ERROR_CODES_PAGE}#docpif`, // Docker Pull Image Failed
    RASMIS: `${ERROR_CODES_PAGE}#rasmis`,  // Resource Asset Missing
    RAPIOF: `${ERROR_CODES_PAGE}#rapiof`,  // Release API Offline
    USEARCHELF: `${ERROR_CODES_PAGE}#usearchelf`,  // USEARCH binary not an ELF
    USEARCHV: `${ERROR_CODES_PAGE}#usearchv`,  // USEARCH binary version mismatch
    USEARCHMEM: `${ERROR_CODES_PAGE}#usearchmem`,  // USEARCH memory exceeded
    IMNARGC: `${ERROR_CODES_PAGE}#imnargc`,  // Argument file could not be placed in fastq directory to be read for analysis
    IMNARGF: `${ERROR_CODES_PAGE}#imnargf`,  // Error parsing argument file
    IMNPREF: `${ERROR_CODES_PAGE}#imnpref`,  // Failure in preprocessing interrupting Analysis
    IMNANF: `${ERROR_CODES_PAGE}#imnanf`,  // Failure in analysis
    IMNPREC: `${ERROR_CODES_PAGE}#imnprec`,  // Failure in preprocessing but analysis completed (partial preprocessing)
    IMNPREA: `${ERROR_CODES_PAGE}#imnprea`,  // All samples failed to get preprocessed
    IMNSKIP: `${ERROR_CODES_PAGE}#imnskip`,  // Analysis skipped
    NOSTRT: `${ERROR_CODES_PAGE}#nostrt`,  // Could not start the pipeline
    F171: `${ERROR_CODES_PAGE}#f171`,  // Failure in spike removal
}
