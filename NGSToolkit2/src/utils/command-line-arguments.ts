const commandLineArgs = require('command-line-args')

// parse command line arguments
const optionDefinitions = [
    {
        name: 'allow-prerelease-tags',
        alias: 'p',
        type: Boolean,
        defaultValue: false,
        description: 'Allow prerelease tags when identifying the latest pipeline release. This is useful for testing.'
    },
    {
        name: 'force-tag',
        alias: 'f',
        type: String,
        defaultValue: "",
        description: 'Force a specific tag (prefixed with v) to be used as the pipeline release. This is useful for testing.'
    },
]
export const options = commandLineArgs(optionDefinitions);
