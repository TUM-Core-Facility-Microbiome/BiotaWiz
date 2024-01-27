export const GITHUB_BASE_URL = 'https://github.com/TUM-Core-Facility-Microbiome/NGSToolkit2';
export const TIC_PAPER_URL = 'https://doi.org/10.3389/fbinf.2022.864597';
// WSL distribution
export const DISTRIBUTION_NAME = 'ngstoolkit2';
export const IMAGE_ASSET_NAME = 'image.tar.gz';
export const IMAGE_REPOSITORY = {
    'owner': 'zsewa',
    'repo': 'docker-action-test',
};

// allow any patch version of the same minor version
export const COMPATIBLE_IMAGE_VERSIONS: SemanticVersionMatcher = {
    major: 0,
    minor: null,  // allow any minor version
    patch: {
        min: null,
        max: null,
    },
}
