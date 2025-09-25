import commandLineArgs from "command-line-args";
import {
    REGISTRY_URL,
    API_URL,
    REPOSITORY_OWNER,
    REPOSITORY_NAME,
    VRANGE,
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
        name: 'pipeline-repository-owner',
        type: String,
        defaultValue: REPOSITORY_OWNER,
        description: 'GitHub repository owner of the pipeline repo.'
    },
    {
        name: 'pipeline-repository-name',
        type: String,
        defaultValue: REPOSITORY_NAME,
        description: 'GitHub repository name of the pipeline repo.'
    },
    {
        name: 'pipeline-vrange',
        type: String,
        defaultValue: VRANGE,
        description: 'Compatible semantic version range of the pipeline.'
    },
]


export const cmArgs = commandLineArgs(optionDefinitions, {stopAtFirstUnknown: true});

// if there are unknown command line arguments, print an error message and exit
if (cmArgs._unknown) {
    console.warn(`Unknown command line arguments: ${cmArgs._unknown}`);
}
