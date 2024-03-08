# Mocking API endpoints
For testing purposes we provide a mock API for endpoints that are mostly
concerned with the auto-updating of containers.

This is especially useful if you have received a copy of this repository, but 
access to the repositories providing the pipeline containers is still 
restricted (private repositories prior to publication).

## Running the mock API
### Requirements
For running the mock APIs you need to have docker and docker-compose installed.

### Setup
#### Generating certs
The container registry uses an authorization service that provides tokens for
accessing the container registry. This service requires a certificate and a key.
You can generate these by running the following command in the `mock` directory:
```bash
openssl req -x509 -newkey rsa:4096 -keyout docker-auth/certs/domain.key -out docker-auth/certs/domain.crt -sha256 -days 3650 -nodes -subj "/C=DE/ST=Bavaria/L=Munich/O=TUM-Core-Facility-Microbiome/OU=BiotaWiz/CN=localhost"
```

#### Change default password
Generate a BCrypt hash using `htpasswd -nB <USERNAME>`. This will interactively ask for a new password.
If you don't have `htpasswd` installed, you can use the following command to generate the hash:
```bash
docker run --rm --entrypoint htpasswd httpd -Bbn <USERNAME> <PASSWORD>
```
Copy the part after `<USERNAME>:` and replace the password for the admin account in 
`docker-auth/auth_config.yml` with the generated hash.
Place the plain text password in the `container-registry-setup` container's environment
variable `REGISTRY_PASSWORD` in the `docker-compose.yml` file.

#### Set up the `images` directory
Please replicate the expected folder structure inside the `images` directory.
Subdirectories of the `images` directory are expected to be named replicating 
GitHub repositories. 

Single `image.tar.gz` files are placed at 
`./images/<owner>/<repo>/v<tag>/image.tar.gz`, where `<owner>` and `<repo>`
are the GitHub owner and repository name, respectively, and `<tag>` is the
version tag of the image. We use semantic versioning for the tags, and prefix 
the semantic version with a `v` (e.g. `v0.1.4`) to get the folder name, as we 
also prefix our GitHub releases with a `v`.

You only need to provide a single `image.tar.gz` file at a **single version tag**, 
but multiple versions can be supplied to test the auto-updating of images.

#### Example
Example setup for the `images` directory:
```
.
└── tum-core-facility-microbiome
    ├── shiny-rhea
    │   └── v1.0.0
    │       └── image.tar.gz
    └── tic-pipeline
        ├── v0.1.4
        │   └── image.tar.gz
        └── v0.1.5-alpha
            └── image.tar.gz
```
This container registry will then provide the following images:
- `localhost:5000/tum-core-facility-microbiome/shiny-rhea:v1.0.0`
- `localhost:5000/tum-core-facility-microbiome/tic-pipeline:v0.1.4`
- `localhost:5000/tum-core-facility-microbiome/tic-pipeline:v0.1.5-alpha`

The mock GitHub Release API will provide the following endpoints (among others):
- `http://localhost:5001/repos/tum-core-facility-microbiome/tic-pipeline/releases`
- `http://localhost:5001/repos/tum-core-facility-microbiome/tic-pipeline/releases/tags/v0.1.4`
- `http://localhost:5001/zsewa/docker-action-test/releases/download/v0.1.4/image.tar.gz`

### Bring up the mock API
You can then start the mock APIs by running
```bash
docker-compose up --build
```
in the `mock` directory.

Please wait shortly for the `container-registry-setup` container to finish, as
this container is responsible for registering the images at the mock container 
registry.

Please note, that if you apply changes in the `images` directory, you need
to rerun this command to reflect the changes.

### Run the GUI against the mock API
While review versions are created, the GUI points to these endpoints by default. You can ignore this section.

You can then run the GUI against the mock API by setting the following command line arguments:
- `--api-url http://localhost:5001`
- `--container-registry localhost:5000`
- `--tic-pipeline-repository-owner <owner>`
- `--tic-pipeline-repository-name <repo>`

e.g. for the example setup when running the GUI via `npm start` from 
directory containing `package.json`:
```bash
npm start -- -- --api-url http://localhost:5001 --container-registry localhost:5000 --tic-pipeline-repository-owner tum-core-facility-microbiome --tic-pipeline-repository-name tic-pipeline
```

The GUI will then use the mocked APIs images provided at the `images` directory.

## How to build a new image for the mock API
The mock API requires a filesystem image exported to a tarball. This can be
achieved by using the tar exporter. The following command will create a tarball from a
`Dockerfile`:
```bash
docker buildx build --output type=tar,dest=<imageName>.tar .
gzip <imageName>.tar
```
where `<imageName>` is the name of the tar file.
The resulting file will be a tarball (`tar.gz` file) that can be placed in the `images` directory.
You should use `image` as the `<imageName>` when building for the mock API.
