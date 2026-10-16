# Mock GitHub Release API
BiotaWiz looks up the available pipeline versions through the GitHub Release API.
For testing, this directory provides a mock of that API, serving releases from local
files. This lets you test version selection and updates without publishing a release
on GitHub.

The mock only replaces the release API. Container images are not mocked:
- **Docker backend:** BiotaWiz pulls `ghcr.io/<owner>/<repo>:<tag>` from GitHub's
  container registry, so every tag you provide in the mock must also exist there.
- **WSL backend:** BiotaWiz downloads the `image.tar.gz` asset of the release, which
  the mock serves from the `images` directory.

## Requirements
Docker with Docker Compose.

## Set up the `images` directory
Each release is a folder at `./images/<owner>/<repo>/v<tag>/`, where `<owner>` and
`<repo>` are the GitHub owner and repository name of the pipeline, and `<tag>` is the
semantic version prefixed with `v` (as for our GitHub releases). Put the release asset
`image.tar.gz` into this folder.

You only need a single version, but you can provide several to test updates.

### Example
```
images
└── mpourjam
    └── tactic-pipeline
        ├── v1.0.0
        │   └── image.tar.gz
        └── v1.0.1
            └── image.tar.gz
```
With this setup, the mock serves:
- the release list at `http://localhost:50501/repos/mpourjam/tactic-pipeline/releases`
- a single release at `http://localhost:50501/repos/mpourjam/tactic-pipeline/releases/tags/v1.0.0`
- the asset at `http://localhost:50501/mpourjam/tactic-pipeline/releases/download/v1.0.0/image.tar.gz`

## Start the mock API
In the `mock` directory, run
```bash
docker compose up --build github-release-api
```
The mock reads the `images` directory on every request, so changes there take effect
without a restart.

## Run BiotaWiz against the mock API
Point BiotaWiz to the mock with `--api-url`. From the directory containing `package.json`:
```bash
npm start -- -- --api-url http://localhost:50501
```
The pipeline repository defaults to `mpourjam/tactic-pipeline`. For a different
repository, add `--pipeline-repository-owner <owner>` and
`--pipeline-repository-name <repo>`.

Only versions within the compatible range (default `>=0.7.3 <=1.9.9`) are used. To
test other versions, set the range with `--pipeline-vrange`, and allow pre-release
tags (e.g. `v1.1.0-rc.1`) with `--allow-prerelease-tags`.

## Get an `image.tar.gz`
The easiest way is to download the `image.tar.gz` asset of an existing pipeline
release on GitHub.

To build one yourself, export the image's filesystem to a tarball and compress it:
```bash
docker buildx build --output type=tar,dest=image.tar .
gzip image.tar
```
