# BiotaWiz
A desktop application for the analysis of 16S rRNA amplicon sequencing data.

The application provides multiple modes that you might find useful for analyzing 16S rRNA amplicon data:
- TIC (IMNGS2-Core)
- De-novo Clustering

When reviewing this application before the repos for the TIC pipeline is made public, please
follow the instructions in `mock`.

## Introduction


## Installation
### Windows
#### Preparations
Please install WSL2 as described [here](https://learn.microsoft.com/en-us/windows/wsl/install).
WSL2 is the underlying technology that allows us to execute the pipeline on Windows.

#### Download
Please download the installer from the Releases page.
You can find the latest version [here](https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/releases/latest).

For Windows, please download the file ending with `Setup.exe`, e.g., `BiotaWiz-0.0.1-Setup.exe` for version `v0.0.1`.

#### Setup
Microsoft might warn you that the installer is not commonly downloaded and could be dangerous.

![warning](docs/images/windows/download_warning.png)

Please click on the context menu (the 3 dots) that is showing up when you hover the entry and select `Keep`.

![hover and click keep](docs/images/windows/click_keep.png)

You might get another warning that the installer is not commonly downloaded and could be dangerous.

![click show more](docs/images/windows/click_show_more.png)

Please click on `Show more` and then on `Keep anyway`.

![click keep anyway](docs/images/windows/click_keep_anyway.png)

SmartScreen might warn you that the application is unrecognized.

![click more info](docs/images/windows/click_more.png)

Please click on `More info` and then on `Run anyway`.

![click run anyway](docs/images/windows/click_run_anyway.png)


### Linux
#### Preparations
Please install Docker Engine (not Docker Desktop) as described [here](https://docs.docker.com/engine/install/).
Docker Engine is the underlying technology that allows us to execute the pipeline in an isolated environment.

#### Download and installation
##### Debian-based distributions (e.g., Ubuntu)
Please download the `.deb` file from the Releases page.
You can find the latest version [here](https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/releases/latest).

To install use Eddy, a graphical package manager, or the terminal:
```bash
sudo dpkg -i <path-to-deb-file>
```

### Updates
BiotaWiz checks for new versions at startup and every few hours.
You can also check manually via `Help` > `Check for Updates…` or in `Settings` > `General`,
where automatic checks can be turned off.

- **Windows:** when a new version is available, click `Download and install`.
  Once it has downloaded, restart BiotaWiz to apply it, or it will be applied the next time you start the application.
- **Linux:** click `Open download page` and install the new `.deb` file as described above.

## Usage

## Misc

## Development
### Run end-to-end tests
WebdriverIO is set up to run end-to-end tests on Linux.
```bash
cd BiotaWiz/  # move to the node application folder
npm run package  # create an up-to-date executable that is expected at ./out/BiotaWiz-linux-x64/biotawiz
npm run wdio  # execute the tests
```
