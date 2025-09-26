export enum SpikeMode {
    SPIKED = 'spiked',
    PARTIAL = 'partial',
    NONE = 'none',
}

export enum MappingFileFormat {
    TSV = 'tsv',
    XLSX = 'xlsx',
}

export enum Environment {
    TACTIC = "TACTIC",
}

export enum LogSection {
    PREPARE_BACKEND = 0,
    PREPARE_ENVIRONMENT = 1,
    RUN_PIPELINE = 2,
    CONTAINER_STREAM = 3,
}

export enum TacticAnalysisMode {
    DE_NOVO = 'de-novo',
    TAC = 'TAC',
    TIC = 'TIC',
}
