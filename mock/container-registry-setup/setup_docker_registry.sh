#!/usr/bin/env sh
# This script imports docker images and pushes them to the local mock registry.
CONTAINER_REGISTRY="localhost:5000"

# Import images
# assume that images are in /images/<owner>/<repo>/v<tag>/<asset>
# use the tag with the base image name
for tarball_path in /images/*/*/v*/image.tar.gz; do
  # get the tag from the directory name; remove the prefixed 'v'
  tag=$(basename $(dirname "${tarball_path}") | sed 's/^v//')
  # get owner and repo to construct the image name
  owner=$(basename $(dirname $(dirname $(dirname "${tarball_path}"))))
  repo=$(basename $(dirname $(dirname "${tarball_path}")))
  image="${CONTAINER_REGISTRY}/${owner}/${repo}:${tag}"
  echo "Found ${image}. Importing and pushing to local registry. This may take a while for bigger images..."
  # load the image into docker
  docker image import "${tarball_path}" "${image}"
  # push the image to the registry
  docker push "${image}"
  # cleanup
  docker image rm "${image}"
done
