# Changelog

All notable changes to BiotaWiz are recorded in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and BiotaWiz uses [Semantic Versioning](https://semver.org/).

## [1.0.2] - 2026-10-23

Release candidates: 1.0.2-rc.1, 1.0.2-rc.2, 1.0.2-rc.3 (2026-10-23).

### Upgrade note (Windows)
BiotaWiz now only uses a pipeline environment that it has verified against GitHub. Environments set up
by earlier versions have no record of this yet, so on the first start with internet access after the
update, BiotaWiz sets up the pipeline environment again once. This downloads the pipeline file (about
0.5 GB) unless a matching copy from an earlier download is still on the computer.

### Added
- The pipeline file (WSL image) is checked against the SHA-256 checksum that GitHub publishes for the
  release. A download is only kept if it matches, and is downloaded once more otherwise. The pipeline
  environment is only used if it was set up from the expected file; otherwise BiotaWiz replaces it.
  Without internet access, BiotaWiz checks against the checksums it recorded earlier.
- Developer setting in Settings > General to show release candidates of the pipeline, so that they can
  be pinned on the version page for testing, with a warning that they might fail or stop BiotaWiz from
  working. "Auto-update to latest version" keeps using stable releases.
- If a pinned pipeline version was removed from GitHub, BiotaWiz deletes it completely from the
  computer (its environment, the downloaded file and the checksum records), removes the pin and
  explains why. Nothing is deleted if GitHub cannot be reached.

### Changed
- Downloaded pipeline files are stored in `%LOCALAPPDATA%\BiotaWiz-Data\downloads` instead of the
  temp folder, which Windows cleans up on its own. Files left in the temp folder by earlier versions
  are moved and verified.

### Fixed
- A failed download of the pipeline file was not reported, and setting up the pipeline environment
  then failed later with an unclear message.

## [1.0.1] - 2026-10-23

Release candidates: 1.0.1-rc.1, 1.0.1-rc.2, 1.0.1-rc.3 (2026-10-23).

### Upgrade note (Windows)
Before 1.0.1, the WSL environment of the pipeline was stored inside the installation folder
(`%LOCALAPPDATA%\biotawiz`). Reinstalling BiotaWiz deletes that folder, which failed with
"Installation has failed" when that environment was in use. BiotaWiz 1.0.1 moves the environment out
of that folder the first time it starts. Updating from within the app therefore works as usual.
If you install 1.0.1 with `Setup.exe` over an existing installation instead, remove the old
environment first:
```bat
wsl -l -v
wsl --shutdown
wsl --unregister mpourjam.tactic-pipeline_1.0.0
rmdir /s /q "%LOCALAPPDATA%\biotawiz"
```
Run `wsl --unregister` for every listed distribution whose name starts with `mpourjam.tactic-pipeline_`.

### Added
- The start page checks whether the pipeline can reach the internet. It warns if WSL has no internet
  access although Windows does (often caused by a VPN, proxy, firewall or __restricted internet access for WSL__).
  It also names the local SILVA database version that will be used, or explains that a first run cannot download it.
- The run page shows a warning when the pipeline could not check for SILVA database updates and uses a
  local copy instead (requires a pipeline version that reports this).
- The pipeline version is selected each time the wizard starts. The Base step shows the selected
  version and whether it is pinned or the latest. All later steps use that same version.
- When the latest pipeline version cannot be checked online, BiotaWiz falls back to the newest
  compatible version that is already installed, and says so.
- The version page lists the installed pipeline versions when the online check fails, so you can
  continue offline. Installed versions are marked in the version list.
- Home button below the logo to start over. If a pipeline is running, BiotaWiz asks first and stops
  the run before leaving the wizard.
- Clear messages when the pipeline versions cannot be loaded (GitHub rate limit, timeout or network
  error), with a Retry link.
- Exit code 172 of the pipeline (SILVA database unavailable without internet access) is reported as
  such instead of as an unknown failure.
- The analysis mode list notes that TIC and TAC run the zOTU pipeline first.

### Changed
- WSL environments of the pipeline are stored in `%LOCALAPPDATA%\BiotaWiz-Data` instead of the
  installation folder, so reinstalling and updating no longer touch them (see the upgrade note).
- The `fastq_truncqual` option is no longer shown in the parameters, as pipeline versions 0.7.3 and
  later ignore it. It is still written to the argument file, with a comment that it has no effect.
- The list of pipeline releases is cached for 5 minutes, so that one run no longer queries GitHub
  several times.
- The installed app shows the BiotaWiz icon instead of the Electron icon in the Windows list of
  installed apps.

### Fixed
- Reinstalling BiotaWiz on Windows failed when a WSL environment of the pipeline was in use.
- Uninstalling BiotaWiz did not remove the WSL environments of the pipeline.
- Stopping the pipeline in WSL did not reliably stop it. BiotaWiz now terminates the pipeline's WSL
  environment and checks that it has stopped. A stopped run is reported as terminated, not as failed.
- Starting a run without internet access could hang without a message, even when a compatible
  pipeline version was installed.
- A run that was waiting to start still started after leaving the wizard.
- No window opens while Windows installs, updates or uninstalls BiotaWiz.

### Security
- Updated dependencies with known vulnerabilities: vue 3.5.44, handlebars 4.7.10, proxy-addr 2.0.8,
  smol-toml 1.9.1, source-map-js 1.2.2 and brace-expansion.

## [1.0.0] - 2026-10-16

Release candidate: 1.0.0-rc.1 (2026-10-15).

### Added
- BiotaWiz checks for new versions at start and every 6 hours, and on request via Help > Check for
  Updates or Settings > General. On Windows, updates are downloaded after you agree and installed on
  restart. On Linux, the release page opens. Pre-release versions are not offered.
- FASTQ files are found and paired with the same rules as the pipeline from pipeline v1.0.0 on, so
  BiotaWiz finds exactly the samples the pipeline processes. Older pipelines keep the previous rules.
  The rules used are logged when samples are loaded and at the start of each run.
- Downloaded pipeline environments are checked for completeness before they are installed, and
  incomplete downloads are downloaded again.

### Changed
- Pipeline versions from v0.7.3 up to v1.9.9 are supported (before: 0.7.x only). All pipeline releases
  are taken into account, not only the 30 newest, and versions are read from the release tags.
- Clearer descriptions of the parameters. The options to keep only bacterial and archaeal sequences
  and to pick zOTUs per sample moved to the advanced parameters, with a warning about the longer run
  time of zOTUs per sample.
- The abundance limit and sample-wise correction are not yet implemented for TIC and TAC. They are no
  longer shown for these modes and are always written as `abund_limit: 0` and
  `sample_wise_correction: false`.

### Fixed
- The button to open the analysis directory did not appear after runs on Linux.
- Log lines with the levels WARNING and CRITICAL were not highlighted.
- Building on Linux failed when optional native modules of a dependency were compiled.

### Internal
- Releases are built in one workflow: the unit tests run first, the Windows installer and the Linux
  package are built into a draft release, and the release is published only when all files are present.

## [0.1.6] - 2026-05-22

Pre-release: 0.1.6-beta-1 (2026-05-21). Earlier changes are not recorded in this file.

[1.0.2]: https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/compare/v0.1.6...v1.0.0
[0.1.6]: https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/releases/tag/v0.1.6
