---
title: 9. Reset BiotaWiz
---

# 9. Reset BiotaWiz

If BiotaWiz keeps failing in the same way, resetting part of it often helps. Start with **level 1** and go
up only if the problem remains. Each level is safe for your FASTQ files and earlier results, except where
stated.

| Level | What it resets | Typical reason |
|---|---|---|
| [1](#level-1) | Downloaded pipeline files | A download was interrupted or is broken |
| [2](#level-2) | The installed pipeline version | Error **NOSTRT**, **DOCPIF**, or the pipeline behaves strangely |
| [3](#level-3) | The backend choice | "Could not connect to the backend!" after changing settings |
| [4](#level-4) | Processed samples | You want samples processed again |
| [5](#level-5) | The SILVA database | Taxonomy errors, or a broken database download |
| [6](#level-6) | Everything | Nothing else helped |

## Level 1: Clear the download cache {#level-1}

1. Open **Settings › Environments › TACTIC Pipeline**.
2. Under **Download cache**, click **Clear download cache**.
3. BiotaWiz shows *Deleted N files* (or *No cached files found*).

The pipeline is downloaded again on the next run.

## Level 2: Delete the installed pipeline {#level-2}

1. Open **Settings › Environments › TACTIC Pipeline**.
2. In **Manage associated images**, find the version you use (column *Tag*).
3. Click **Delete**.
4. Start the analysis again. BiotaWiz downloads that version again and sets it up fresh.

{/* SCREENSHOT: settings-manage-images.png – Settings › Environments › TACTIC Pipeline with the images table */}

Only versions for the current backend are listed. On Windows/WSL2, *Delete* removes the WSL distribution
`mpourjam.tactic-pipeline_<version>`; with Docker it removes the image
`ghcr.io/mpourjam/tactic-pipeline:<version>`.

## Level 3: Reset the backend {#level-3}

1. Open **Settings › Backend**.
2. Click **Reset to Default Backend**: WSL2 on Windows, Docker on Linux.
3. Restart BiotaWiz and check that the home screen shows **Backend connected**.

The **Select Backend** list on the same page lets you choose *Platform default*, *Docker* or *WSL2* by hand.

## Level 4: Process samples again {#level-4}

BiotaWiz skips samples that were already processed in an earlier run of the same base directory. To process a
sample again, for example after changing its FASTQ file, delete its folder `<sample>__processed` (and
`<sample>_processed.zip`, if present) in your base directory. Then start the analysis again.

:::warning
This deletes that sample's intermediate results. Your FASTQ files and the `Analysis_…` folders are not affected.
:::

## Level 5: Download SILVA again {#level-5}

TACTIC stores the SILVA reference database in the BiotaWiz data folder:

| System | Folder |
|---|---|
| Windows | `%APPDATA%\BiotaWiz\resources\databases` (paste this into the Explorer address bar) |
| Linux | `~/.config/BiotaWiz/resources/databases` |

Delete the `SILVA` folder inside it. The next run downloads and prepares SILVA again (15–30 minutes, needs
internet).

## Level 6: Clean reinstall {#level-6}

1. Uninstall BiotaWiz: Windows **Settings › Apps**; Linux `sudo apt remove biotawiz`.
2. Delete the BiotaWiz data folders:
   - Windows: `%APPDATA%\BiotaWiz` and `%LOCALAPPDATA%\BiotaWiz-Data` (downloads and pipeline environments)
   - Linux: `~/.config/BiotaWiz`
3. Windows only: remove leftover pipeline environments. In PowerShell, run `wsl --list` and, for every entry
   starting with `mpourjam.tactic-pipeline_`, run `wsl --unregister <name>`.
   Linux only: `docker image ls ghcr.io/mpourjam/tactic-pipeline` and `docker image rm <image>` for each.
4. Install BiotaWiz again ([Windows](02-install-windows.md) / [Linux](03-install-linux.md)).

:::danger
`wsl --unregister` deletes everything inside that WSL distribution. Only use it on names starting with
`mpourjam.tactic-pipeline_`, never on your own distributions such as `Ubuntu`.
:::

## Updating BiotaWiz itself

Open **Settings › About** and click **Check for updates** (or **Help › Check for Updates…**). On Windows,
BiotaWiz downloads and installs the update. On Linux it opens the download page; install the new `.deb`
[as before](03-install-linux.md#step-3-install-biotawiz).

To see what a new version changes, read [10. Versions and what changed](11-versions-and-changes.md).
