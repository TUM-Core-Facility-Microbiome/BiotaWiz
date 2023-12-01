# NGSToolkit2

## Introduction


## Installation

### Linux

### Windows

## Usage

## IMNGS2 CLI
NGSToolkit2 has [www.imngs2.org](https://www.imngs2.org) preprocessing and analysis pipeline as the main pipeline. One could use the docker image serving as workhorse of NGSToolkit and use it directly. IMNGS2 pipeline can be accessed via a command named `run_imngs2` which is providing the user a CLI for setting  arguments and analyis parameters inside the docker image. The running container from IMNGS2 pipline docker image should have a volume set to `/base/inputs` path inside the container from the host 
machine to let pipline have access to host machines file system. For example: this command `docker run --rm /home/howard/projects/:/base/inputs imngs2_pipeline run_imngs2 -h` will mount `/home/howard/projects` to `/base/inputs` dirctory in docker container serving as default `<INPUT_DIRECTORY>` (explained below). 

**Arguments:**
  - -h, --help            Shows help message and exit. For example: `docker run --rm imngs2_pipeline run_imngs2 -h`
  - -i INPUT_DIRECTORY, --input-directory INPUT_DIRECTORY
                        Every needed file and directory should be findable
                        relative to this directory. This option sets the base file system
                        environment for pipeline to look for files and find them. Files and
                        direcotries in this path is visible to pipeline through `/base/inputs`.
                        **Note:** your local machine input directory must always be set as a
                        volume to `/base/inputs` in the docker. For example:
                          `docker run --rm /home/howard/projects/:/base/inputs imngs2_pipeline run_imngs2 -h`
                        
  - -d FASTQ_DIRECTORY, --fastq-directory FASTQ_DIRECTORY
                        The directory to find recursively all fastq files
                        inside. Default is <--input-directory>. You can confine the pipeline to look for specific
                        sub-directory inside `<--input-directory>` by defining a relative path to your desired
                        directory from `<--input-directory>`. For example: One just want to analyze a sub-directory
                        inside `<--input-directory>`, then they can instruct the #TODO
  - -y YML_FILE, --yml-file YML_FILE
                        Path to arguments yaml file. Relative to <--input-
                        directory>
  - -map MAPPING_FILE, --mapping-file MAPPING_FILE
                        The path to a mapping file defining sample weight and
                        spike amount for each sample. Relative to <--input-
                        directory>
  - -stat SPIKE_STAT, --spike-stat SPIKE_STAT
                        The path to a mapping file defining spike count,
                        sample weight and spike amount for each sample.
                        #SampleID SpikeReads spikes_total_weight_in_g
                        amount_spike. Relative to <--input-directory>
  - -db DB_DIRECTORY, --db-directory DB_DIRECTORY
                        Path to directory containing silva, sortmerna files.
                        Relative to <--input-directory>
  - -sp, --skip-preprocess
                        Should skip preprocessing step
  - -sa, --skip-analysis  Should skip analysis step
  - -af, --place-args-file
                        Writes the default argument yaml file to <--input-
                        directory>, print help text and exits.

