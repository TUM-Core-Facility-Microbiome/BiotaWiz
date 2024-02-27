import {app} from "electron";

const commandLineArgs = require('command-line-args')

// parse command line arguments
const optionDefinitions = [
    {
        name: 'version',
        alias: 'v',
        type: Boolean,
        defaultValue: false,
        description: 'Print the version and exit.'
    },
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
        defaultValue: 'localhost:5000',  // production: 'ghcr.io', testing: 'localhost:5000'
        description: 'Container registry to use.'
    },
    {
        name: 'api-url',
        type: String,
        defaultValue: 'http://localhost:5001',  // production: 'https://api.github.com', testing: 'http://localhost:5001'
        description: 'GitHub API base URL including protocol.'
    },
    {
        name: 'tic-pipeline-repository-owner',
        type: String,
        defaultValue: 'tum-core-facility-microbiome',
        description: 'GitHub repository owner of TIC pipeline.'
    },
    {
        name: 'tic-pipeline-repository-name',
        type: String,
        defaultValue: 'tic-pipeline',
        description: 'GitHub repository name of TIC pipeline.'
    },
    {
        name: 'shiny-rhea-repository-owner',
        type: String,
        defaultValue: 'tum-core-facility-microbiome',
        description: 'GitHub repository owner of shiny-Rhea.'
    },
    {
        name: 'shiny-rhea-repository-name',
        type: String,
        defaultValue: 'shiny-rhea',
        description: 'GitHub repository name of shiny-Rhea.'
    },
]


export const cmArgs = commandLineArgs(optionDefinitions, {stopAtFirstUnknown: true});

// if there are unknown command line arguments, print an error message and exit
if (cmArgs._unknown) {
    console.warn(`Unknown command line arguments: ${cmArgs._unknown}`);
}
