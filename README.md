# BiotaWiz
A desktop application for analyzing 16S rRNA amplicon sequencing data, with no command line needed.

BiotaWiz guides you step by step through an analysis with the TACTIC pipeline: pick your FASTQ files,
set a few options, and get OTU tables, taxonomy and phylogenetic trees. It offers three analysis modes:

| Mode | What it does |
|---|---|
| **Taxonomy Informed Clustering (TIC)** | Clusters zOTUs at family, genus and species level where their taxonomy is unknown at that level. |
| **Taxonomy Agnostic Clustering (TAC)** | Clusters zOTUs at 98.7% similarity into OTUs. |
| **De Novo Clustering (UPARSE)** | Clusters the unique sequences of your samples at 97% similarity. |

## Quick start
1. Install the backend: **WSL2** on Windows, **Docker Engine** on Linux (see [Installation](#installation)).
2. Download BiotaWiz from the [latest release](https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/releases/latest) and install it.
3. Start BiotaWiz, choose an analysis mode, and follow the wizard.

## Requirements
- Windows 10/11 (64-bit) with WSL2, or a 64-bit Debian-based Linux (e.g. Ubuntu) with Docker Engine
- An internet connection when you first start BiotaWiz, to download the analysis pipeline
- Enough free disk space for the pipeline (several GB) and your results

## Installation
### Windows
#### 1. Install WSL2
BiotaWiz runs the analysis pipeline in WSL2 (Windows Subsystem for Linux).
Open **PowerShell as administrator**, run the following command, and restart your computer:
```powershell
wsl --install
```
If you need more details, see Microsoft's [WSL installation guide](https://learn.microsoft.com/en-us/windows/wsl/install).

#### 2. Download BiotaWiz
Open the [latest release](https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/releases/latest)
and download the file ending in `Setup.exe`.

#### 3. Install BiotaWiz
The installer is not yet signed, so Windows shows some warnings. They are expected; here is how to continue.

<details>
<summary><b>Your browser warns that the file is not commonly downloaded</b></summary>

![warning](docs/images/windows/download_warning.png)

Hover over the download, click the three dots, and select `Keep`.

![hover and click keep](docs/images/windows/click_keep.png)

If a second warning appears, click `Show more` and then `Keep anyway`.

![click show more](docs/images/windows/click_show_more.png)
![click keep anyway](docs/images/windows/click_keep_anyway.png)
</details>

<details>
<summary><b>Windows SmartScreen says the app is unrecognized</b></summary>

Click `More info` and then `Run anyway`.

![click more info](docs/images/windows/click_more.png)
![click run anyway](docs/images/windows/click_run_anyway.png)
</details>

The installer then installs BiotaWiz and starts it. You can find BiotaWiz in the Start menu afterwards.

> [!TIP]
> BiotaWiz uses WSL2 by default. If you prefer Docker Desktop, switch the backend in `Settings` > `Backend`.

### Linux (Debian, Ubuntu and derivatives)
#### 1. Install Docker Engine
BiotaWiz runs the analysis pipeline in Docker. Install **Docker Engine** (not Docker Desktop) by following the
[official instructions](https://docs.docker.com/engine/install/) for your distribution.

Then allow your user to use Docker without `sudo`, and **log out and back in** for this to take effect:
```bash
sudo usermod -aG docker $USER
```
To check that Docker works, run `docker run hello-world`.

#### 2. Download and install BiotaWiz
Open the [latest release](https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/releases/latest)
and download the `.deb` file. Install it by double-clicking it to open your software installer, or in the terminal:
```bash
sudo apt install ./<downloaded-file>.deb
```
Then start BiotaWiz from your applications menu.

## First start
When you choose an analysis mode for the first time, BiotaWiz downloads the analysis pipeline.
This can take a few minutes, depending on your connection. Later starts reuse the download.

If BiotaWiz says it **could not connect to the backend**:
- **Windows:** make sure WSL2 is installed and you have restarted your computer since installing it.
- **Linux:** make sure the Docker service is running (`sudo systemctl start docker`) and that your user is in the
  `docker` group (see above).

Then restart BiotaWiz.

## Running an analysis
Before you start, put all FASTQ files you want to analyze into one folder (sub-folders are fine).
Gzip-compressed files (`.fastq.gz`, `.fq.gz`) work as well. BiotaWiz recognizes paired-end files by
their names, e.g. `_R1_`/`_R2_` or `_1`/`_2`; see the
[file naming guide](https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz-docs/discussions/21).

1. **Choose an analysis mode:** TIC, TAC or De Novo Clustering.
2. **Select the base directory:** the folder that contains your FASTQ files. The results are written to this folder.
3. **Select samples:** tick the samples to analyze. Only combine samples that were sequenced with the same primers.
4. **Spike-in standard:** tell BiotaWiz whether spike-ins were added to all, some, or none of your samples.
   If they were added to all samples, a spreadsheet opens: enter the sample weight and spike-in amount for each
   sample, save it, and click `Check mapping file and continue`.
5. **Parameters:** the defaults suit most analyses. Adjust the number of threads, and the primer trimming
   (`stripleft`/`stripright`) to the length of your forward and reverse primers.
6. **Run:** follow the progress in the log. When the analysis is done, click `Open analysis directory`.

### Results
Results are written to a new `Analysis_<date>_<time>` folder in your base directory. It contains the OTU/zOTU tables,
taxonomy, phylogenetic trees and interactive Krona charts. For downstream analysis we recommend the
[Namco microbiome explorer](https://exbio.wzw.tum.de/namco/).

## Updates
BiotaWiz checks for new versions at startup and every few hours.
You can also check manually via `Help` > `Check for Updates…` or in `Settings` > `General`,
where automatic checks can be turned off.

- **Windows:** when a new version is available, click `Download and install`.
  Once it has downloaded, restart BiotaWiz to apply it, or it will be applied the next time you start the application.
- **Linux:** click `Open download page` and install the new `.deb` file as described above.

## Getting help
- If an error occurs, BiotaWiz shows a link to a help page for that error.
- Questions and documentation: [BiotaWiz-docs discussions](https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz-docs/discussions)
- Bugs, or files that are not recognized: [open an issue](https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/issues)

## Development
The application lives in the `BiotaWiz/` folder (Electron, Vue 3, TypeScript).
```bash
cd BiotaWiz/
npm ci     # install dependencies
npm start  # run the app in development mode
npm test   # run the unit tests
```
To test pipeline version selection and updates without publishing a release, see [`mock`](mock/README.md).

### Run end-to-end tests
WebdriverIO is set up to run end-to-end tests on Linux.
```bash
cd BiotaWiz/  # move to the node application folder
npm run package  # create an up-to-date executable that is expected at ./out/BiotaWiz-linux-x64/biotawiz
npm run wdio  # execute the tests
```

### Release a new version
Releases are built and published by the [Release workflow](.github/workflows/release.yml) when a version tag is pushed.
Once published, the new version is offered to users by the in-app updater.

```bash
cd BiotaWiz/
npm version 1.2.3 --no-git-tag-version  # set the new version in package.json and package-lock.json
npm test
git commit -am "release: v1.2.3"
git push origin main
git tag v1.2.3  # must match the version in package.json
git push origin v1.2.3
```

The workflow runs the unit tests, creates a draft release, builds the Windows installer and the `.deb` package,
uploads them, and publishes the release once all files are there.
If a step fails, the release stays a draft: fix the problem and re-run the workflow, or delete the draft and the tag.
Versions with a suffix (e.g., `1.2.3-beta.1`) are published as pre-releases and are not offered as updates.

## License
BiotaWiz is released under the [MIT License](LICENSE).
