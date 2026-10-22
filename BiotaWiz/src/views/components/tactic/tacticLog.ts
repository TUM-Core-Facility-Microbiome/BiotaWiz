/**
 * First line of a log record of the TACTIC pipeline's Python loggers. The pipeline formats records as
 * '%(asctime)s - %(name)s:%(filename)s:%(lineno)d - %(levelname)s - %(message)s' with datefmt '%Y-%m-%d %H:%M:%S'.
 */
export const PYTHON_LOGGER_REGEX = /(?<asctime>[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}) - (?<name>.*):(?<filename>.*):(?<lineno>[0-9]*) - (?<levelname>[A-Z]+) - (?<message>.*)/;

/**
 * Logged by the pipeline when the analysis is done, followed by the results directory relative to the base directory.
 */
export const ANALYSIS_DONE_PREFIX = "Analysis done. Results directory: ";

/**
 * Get the results directory if the log message announces the end of the analysis, else null.
 */
export function getAnnouncedAnalysisDirectory(message: string): string | null {
    return message.startsWith(ANALYSIS_DONE_PREFIX) ? message.slice(ANALYSIS_DONE_PREFIX.length) : null;
}

/**
 * Logged by the pipeline when it cannot reach the SILVA server and uses a local copy, followed by its version.
 * Must match SILVA_OFFLINE_PREFIX in the pipeline's processing_helper.py.
 */
export const DATABASE_OFFLINE_PREFIX = "Could not check for SILVA database updates. Using local SILVA database version: ";

/**
 * Get the version of the local SILVA database if the log message announces that it is used offline, else null.
 */
export function getAnnouncedOfflineDatabaseVersion(message: string): string | null {
    return message.startsWith(DATABASE_OFFLINE_PREFIX) ? message.slice(DATABASE_OFFLINE_PREFIX.length).trim() : null;
}
