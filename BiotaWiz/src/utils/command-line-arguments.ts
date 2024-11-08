import commandLineArgs from "command-line-args";
import {
    REGISTRY_URL,
    API_URL,
    IMNGS2CORE_REPOSITORY_OWNER,
    IMNGS2CORE_REPOSITORY_NAME,
    IMNGS2CORE_VRANGE,
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
        name: 'imngs2core-repository-owner',
        type: String,
        defaultValue: IMNGS2CORE_REPOSITORY_OWNER,
        description: 'GitHub repository owner of IMNGS2-Core.'
    },
    {
        name: 'imngs2core-repository-name',
        type: String,
        defaultValue: IMNGS2CORE_REPOSITORY_NAME,
        description: 'GitHub repository name of IMNGS2-Core.'
    },
    {
        name: 'imngs2core-pipeline-vrange',
        type: String,
        defaultValue: IMNGS2CORE_VRANGE,
        description: 'Semantic version range for IMNGS2-Core.'
    },
]


export const cmArgs = commandLineArgs(optionDefinitions, {stopAtFirstUnknown: true});

// if there are unknown command line arguments, print an error message and exit
if (cmArgs._unknown) {
    console.warn(`Unknown command line arguments: ${cmArgs._unknown}`);
}
