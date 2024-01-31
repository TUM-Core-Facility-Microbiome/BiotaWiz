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
    {
        name: 'container-registry',
        type: String,
        defaultValue: 'ghcr.io',
        description: 'Container registry to use.'
    },
    {
        name: 'api-url',
        type: String,
        defaultValue: 'https://api.github.com',
        description: 'GitHub API base URL including protocol.'
    },
    {
        name: 'tic-pipeline-repository-owner',
        alias: 'o',
        type: String,
        defaultValue: 'zsewa',
        description: 'GitHub repository owner.'
    },
    {
        name: 'tic-pipeline-repository-name',
        alias: 'n',
        type: String,
        defaultValue: 'docker-action-test',
        description: 'GitHub repository name.'
    },
]
export const cmArgs = commandLineArgs(optionDefinitions);
