import commandLineArgs from "command-line-args";
import {
    REGISTRY_URL,
    API_URL,
    TIC_PIPELINE_REPOSITORY_OWNER,
    TIC_PIPELINE_REPOSITORY_NAME,
    TIC_PIPELINE_VRANGE,
    SHINY_RHEA_REPOSITORY_OWNER,
    SHINY_RHEA_REPOSITORY_NAME,
    SHINY_RHEA_VRANGE
} from "../config";

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
        name: 'container-registry',
        type: String,
        defaultValue: REGISTRY_URL,
        description: 'Container registry to use.'
    },
    {
        name: 'api-url',
        type: String,
        defaultValue: API_URL,
        description: 'GitHub API base URL including protocol.'
    },
    {
        name: 'tic-pipeline-repository-owner',
        type: String,
        defaultValue: TIC_PIPELINE_REPOSITORY_OWNER,
        description: 'GitHub repository owner of TIC pipeline.'
    },
    {
        name: 'tic-pipeline-repository-name',
        type: String,
        defaultValue: TIC_PIPELINE_REPOSITORY_NAME,
        description: 'GitHub repository name of TIC pipeline.'
    },
    {
        name: 'tic-pipeline-vrange',
        type: String,
        defaultValue: TIC_PIPELINE_VRANGE,
        description: 'Semantic version range for TIC pipeline.'
    },
    {
        name: 'shiny-rhea-repository-owner',
        type: String,
        defaultValue: SHINY_RHEA_REPOSITORY_OWNER,
        description: 'GitHub repository owner of shiny-Rhea.'
    },
    {
        name: 'shiny-rhea-repository-name',
        type: String,
        defaultValue: SHINY_RHEA_REPOSITORY_NAME,
        description: 'GitHub repository name of shiny-Rhea.'
    },
    {
        name: 'shiny-rhea-vrange',
        type: String,
        defaultValue: SHINY_RHEA_VRANGE,
        description: 'Semantic version range for shiny-Rhea.'
    }
]


export const cmArgs = commandLineArgs(optionDefinitions, {stopAtFirstUnknown: true});

// if there are unknown command line arguments, print an error message and exit
if (cmArgs._unknown) {
    console.warn(`Unknown command line arguments: ${cmArgs._unknown}`);
}
