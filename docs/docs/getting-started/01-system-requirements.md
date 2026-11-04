---
title: 1. System requirements
---

# 1. System requirements

:::info You will need
About 5 minutes to check your computer.
:::

## Computer

| | Minimum | Recommended |
|---|---|---|
| Operating system | Windows 10 or 11 (64-bit), or a 64-bit Debian-based Linux such as Ubuntu | Windows 11 or Ubuntu 22.04/24.04 |
| Memory (RAM) | 8 GB | 16 GB or more |
| Processor | 4 cores | 8 cores or more |
| Free disk space | 20 GB | 50 GB or more (depends on how much data you analyse) |
| Internet | Needed for the first run | — |

:::note Why RAM matters
BiotaWiz runs several samples at the same time, one per **thread** (a thread is one task the processor works on).
It plans about **3 GB of RAM per thread** and picks the number of threads for you. More RAM means more samples
processed in parallel, so the analysis finishes sooner.
:::

macOS is not supported by BiotaWiz. On a Mac you can still use the [TACTIC command line](../cli/cli.md)
with Docker.

## What gets downloaded

You need an internet connection the **first time** you run an analysis. BiotaWiz then downloads:

1. **The TACTIC pipeline** (a few GB), once per pipeline version.
2. **The SILVA reference database** (several GB), which TACTIC uses to name your bacteria. TACTIC downloads and
   prepares it during the first analysis, which adds **about 15–30 minutes** to that run.

Both are stored on your computer and reused. Later analyses work **without internet**.

## Where your data should be

Put your FASTQ files on a **local disk** of the computer (for example `C:\Data\MyStudy` or `/home/me/MyStudy`).

:::warning Avoid network drives and cloud folders
Running directly on a network drive (NAS) or in a synchronised folder (OneDrive, Dropbox, Google Drive) can make
the analysis slow or fail. Copy the data to a local disk, run the analysis, then copy the results back.
See [Network drives](../troubleshooting/peculiarities/troubleshooting-peculiarities-nas).
:::

## Next step

- Windows → [2a. Install on Windows](02-install-windows.md)
- Linux → [2b. Install on Linux](03-install-linux.md)
