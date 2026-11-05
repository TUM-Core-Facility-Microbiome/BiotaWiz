---
title: 10. Versions and what changed
---

# 10. Versions and what changed

BiotaWiz and the TACTIC pipeline have **separate version numbers**. BiotaWiz is the desktop program; TACTIC is
the analysis it runs. Both are updated independently. This page shows how to find out which versions you have,
what the newest versions are, and what changed between versions.

## How version numbers work

Both use *semantic versioning*, `MAJOR.MINOR.PATCH`, for example `1.0.2`:

| Part that changes | Example | Meaning |
|---|---|---|
| PATCH | 1.0.1 → 1.0.2 | Bug fixes only |
| MINOR | 1.0.2 → 1.1.0 | New features; existing analyses keep working |
| MAJOR | 1.1.0 → 2.0.0 | Big changes; results or files may differ from earlier versions |

Versions with a suffix such as `1.0.2-rc.1` are **release candidates**: test versions before a final release.
Don't use them for analyses you rely on.

## Which versions do I have?

| What | Where to look |
|---|---|
| BiotaWiz | **Settings › About**: the line `Application: BiotaWiz v1.x.x` |
| TACTIC that the next run will use | The **Base** step of the wizard: `TACTIC pipeline version: v1.x.x (latest compatible version)` or `(pinned version)` |
| TACTIC versions installed on this computer | **Settings › Environments › TACTIC Pipeline › Manage associated images**, column *Tag* |
| TACTIC used for a finished analysis | `Analysis_log.txt` in that `Analysis_…` folder, line `Starting pipeline version v1.x.x` |

{/* SCREENSHOT: settings-about.png – Settings › About with the application version and "Check for updates" */}

:::tip Write the versions into your methods section
For a publication, report both versions, for example *"Data were processed with TACTIC v1.0.0 run via BiotaWiz
v1.0.2"*. The TACTIC version used is always recorded in `Analysis_log.txt`, so you can look it up later.
:::

## Finding the latest versions

### BiotaWiz

- **In the program:** BiotaWiz checks for new versions when it starts. If one exists, a banner appears:
  **Update available: Version X is available.** You can also check yourself in **Settings › About › Check for
  updates** or **Help › Check for Updates…**. The status shows *You are using the latest version.* or
  *A new version is available.*
- **On the web:** the [latest BiotaWiz release](https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/releases/latest)
  page always shows the newest version and its installer files.

How to install an update: [Updating BiotaWiz itself](10-reset-environment.md#updating-biotawiz-itself).

### TACTIC pipeline

- **In the program:** you don't need to do anything. With the default update strategy,
  **auto-update to latest version every run**, BiotaWiz uses the newest TACTIC version that is compatible
  with your BiotaWiz version, and downloads it when you start an analysis.
- **On the web:** the [TACTIC releases page](https://github.com/MPourjam/TACTIC-Pipeline/releases) lists all
  versions, newest first. The one marked **Latest** is the newest final release.

:::note Why BiotaWiz may not use the very newest TACTIC
Each BiotaWiz version supports a range of TACTIC versions (currently 0.7.3 up to 1.9.9). A TACTIC version outside
that range needs a newer BiotaWiz. Update BiotaWiz first.
:::

### Staying on one TACTIC version

Changing the TACTIC version can change results slightly. To use the **same** version for a whole study, open
**Settings › Environments › TACTIC Pipeline**, and under **Update strategy** choose **always use version X**.
Later you can switch back to *auto-update to latest version every run*.

## What changed? Release notes and changelogs

Each project keeps two records of its changes:
- a **changelog**: one file listing every version, newest at the top, with its changes grouped as *Added*,
  *Changed*, *Fixed* …;
- the **release notes** on each version's GitHub release page.

| | Changelog (all versions, one page) | Release pages (one per version) |
|---|---|---|
| BiotaWiz | [BiotaWiz changelog](https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/blob/main/BiotaWiz/CHANGELOG.md) | [BiotaWiz releases](https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/releases) |
| TACTIC | [TACTIC changelog](https://github.com/MPourjam/TACTIC-Pipeline/blob/main/CHANGELOG.md) | [TACTIC releases](https://github.com/MPourjam/TACTIC-Pipeline/releases) |

### How to read the changes for your update

1. Find **your** version (see [Which versions do I have?](#which-versions-do-i-have)) and the **newest** version.
2. Open the changelog. Each version has a heading such as `## [1.0.2] - 2026-10-23`, newest first.
3. Read every section from the newest version **down to the one just above yours**. Together they are everything
   that changed since your version.
4. Pay special attention to:
   - **Upgrade notes**: things that happen once after updating, for example a one-time new download.
   - **Changed** and **Removed** entries in TACTIC: they can affect your results or the output files.
     Example: TACTIC 1.0.0 added the `-8Levels` taxonomy files and the `PICRUSt2-Inputs/` folder.

:::tip Comparing with an older analysis
If you rerun old data with a newer TACTIC version and the numbers differ, check the TACTIC changelog between the
two versions (see `Analysis_log.txt` of each run). To reproduce an old analysis exactly, pin the old version under
**Update strategy**.
See [Comparing results of different versions](./12-compare-versions.md) for which changes affect results and how
to reproduce them.
:::

## Release candidates (for testing only)

To try a release candidate of TACTIC, tick **Show release candidates of the TACTIC pipeline** in
**Settings › About**. It can then be chosen under **Update strategy**. *Auto-update to latest version every run*
keeps using final releases only. Release candidates are listed in the changelogs under their final version, for
example *Release candidates: 1.0.2-rc.1, 1.0.2-rc.2*.
