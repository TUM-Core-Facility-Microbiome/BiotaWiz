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
