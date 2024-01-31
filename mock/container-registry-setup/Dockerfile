FROM docker

# bring in the setup script
COPY setup_docker_registry.sh /usr/local/bin/setup_docker_registry.sh
RUN chmod +x /usr/local/bin/setup_docker_registry.sh

# run the default entrypoint (docker-entrypoint.sh) from base image
ENTRYPOINT ["setup_docker_registry.sh"]
