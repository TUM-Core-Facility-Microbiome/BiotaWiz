#!/bin/bash
# Run from BiotaWiz/docs. The whole BiotaWiz repository is mounted into the container.
repo_root=`dirname $(pwd)`
biotawiz_docs_docker_image="node:22-alpine-git"
biotawiz_docs_docker_mount="/BiotaWiz"
root_vol="${repo_root}:${biotawiz_docs_docker_mount}"
docusaurus_root=${biotawiz_docs_docker_mount}/docs
container_name="nodejs_docusaurus"
port_mapping="127.0.0.1:30000:3000"
entry_cmd="\
cd ${docusaurus_root} && \
echo 'For developement attach to ${container_name} with: docker exec -it ${container_name} /bin/sh' && \
npx docusaurus start --host 0.0.0.0 --port 3000\
"
echo "Find the docs at http://localhost:30000/BiotaWiz/"

# Get current user and group IDs
USER_ID=$(id -u)
GROUP_ID=$(id -g)

if [ -z "${USER_ID}" ] || [ -z "${GROUP_ID}" ]; then
    echo "Error: Unable to determine user and group IDs."
    exit 1
fi

# If image is not available, build it
if ! docker image inspect ${biotawiz_docs_docker_image} > /dev/null 2>&1; then
    echo "Image ${biotawiz_docs_docker_image} not found. Building the image..."
    docker build -t ${biotawiz_docs_docker_image} -f Dockerfile.node:22-alpine-git .
    if [ $? -ne 0 ]; then
        echo "Error: Failed to build the Docker image."
        exit 1
    fi
else
    echo "Using existing image: ${biotawiz_docs_docker_image}"
fi


docker run -it --name ${container_name} --rm \
    --user ${USER_ID}:${GROUP_ID} \
    -p ${port_mapping} \
    -v ${root_vol} \
    ${biotawiz_docs_docker_image} \
    /bin/sh -c "${entry_cmd}"

