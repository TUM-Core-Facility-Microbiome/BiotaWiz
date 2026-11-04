---
id: troubleshooting-error-codes
title: Error codes
sidebar_position: 2
---

# Error codes

When something fails, BiotaWiz shows a message, often with a **code** (for example `IMNPREA`) and a link to
this page. The TACTIC command line instead ends with an **exit code** (a number). Both are listed here.

:::tip First thing to do for any error
Open `Pipeline_log.txt` in your base directory. Its last lines usually say what went wrong. Attach it if you
[ask for help](https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/discussions).
:::

## Overview

| BiotaWiz code | Exit code | Message in BiotaWiz | Section |
|---|---|---|---|
| DOCPIF | – | Failed to pull image … | [DOCPIF](#docpif) |
| RASMIS | – | Release … is missing required asset. | [RASMIS](#rasmis) |
| RAPIOF | – | Failed to query available releases: … | [RAPIOF](#rapiof) |
| NOSTRT | – | Could not start pipeline | [NOSTRT](#nostrt) |
| – | 1 | Pipeline returned unexpected with failure code (exit code: 1) | [Exit code 1](#exit-1) |
| – | 129, 130, 137, 143 | Pipeline was terminated | [Signals](#signals) |
| USEARCHMEM | 160 | USEARCH process ran out of memory | [USEARCHMEM](#usearchmem) |
| USEARCHELF | 161 | Problem with given USEARCH binary. Binary is not an ELF. | [USEARCHELF](#usearchelf) |
| USEARCHV | 162 | Problem with given USEARCH binary. Version is not v11. | [USEARCHV](#usearchv) |
| IMNARGC | 163 | Argument file could not be placed in fastq directory to be read for analysis | [IMNARGC](#imnargc) |
| IMNARGF | 164 | Error parsing argument file | [IMNARGF](#imnargf) |
| IMNPREF | 165 | Failure in preprocessing interrupting Analysis | [IMNPREF](#imnpref) |
| IMNANF | 166 | Failure in analysis | [IMNANF](#imnanf) |
| IMNPREC | 167 | Failure in preprocessing but analysis completed (partial preprocessing) | [IMNPREC](#imnprec) |
| IMNPREA | 168 | All samples failed to get preprocessed | [IMNPREA](#imnprea) |
| IMNSKIP | 169 | Analysis skipped | [IMNSKIP](#imnskip) |
| – | 170 | Pipeline returned unexpected with failure code (exit code: 170) | [Exit code 170](#exit-170) |
| F171 | 171 | Failure in spike removal | [F171](#f171) |
| – | 172 | Could not download the SILVA database. Make sure the pipeline has internet access | [Exit code 172](#exit-172) |
| – | 176 | Pipeline returned unexpected with failure code (exit code: 176) | [Exit code 176](#exit-176) |

---

## Errors before the pipeline starts

### DOCPIF: Pipeline image could not be downloaded {#docpif}

BiotaWiz could not download (pull) the TACTIC pipeline image with Docker.

- Check your internet connection and try again.
- [Clear the download cache and delete the installed pipeline](../getting-started/10-reset-environment.md#level-1).
- Behind a company or university proxy, Docker may need proxy settings; ask your IT department.

### RASMIS: Release is missing required asset {#rasmis}

The pipeline version was found on GitHub, but its download file (`image.tar.gz`) is missing. This can happen if a
release was withdrawn.

- Make sure your internet connection is stable and try again.
- Set **Settings › Environments › TACTIC Pipeline › Update strategy** to
  **auto-update to latest version every run**, or select another version.
- If you enabled **Show release candidates of the TACTIC pipeline** (Settings › About), a test version may be
  incomplete. Choose a normal release.

### RAPIOF: Could not connect to release API {#rapiof}

BiotaWiz asks GitHub which pipeline versions exist. This request failed.

- Check your internet connection, then click **Retry** on the Base step.
- If the message mentions **GitHub API rate limit reached (HTTP 403)**, GitHub limits how often it may be asked.
  Wait the time shown and try again.
- Very old BiotaWiz versions (below 0.1.6) always fail here. [Update BiotaWiz](../getting-started/10-reset-environment.md#updating-biotawiz-itself).
- If a pipeline version is already installed, BiotaWiz can use it without asking GitHub.

### NOSTRT: Could not start pipeline {#nostrt}

The pipeline was installed but could not be started.

1. Check that the home screen says **Backend connected** ([readiness check](../getting-started/04-readiness-check.md)).
2. Delete the installed pipeline: **Settings › Environments › TACTIC Pipeline › Manage associated images ›
   Delete** next to the version you use ([reset level 2](../getting-started/10-reset-environment.md#level-2)).
3. Start the analysis again. BiotaWiz downloads the pipeline and sets it up fresh.

---

## Errors while the pipeline runs

### Exit code 1: Unknown error {#exit-1}
<a id="1"></a>

An unexpected error. Read the end of `Pipeline_log.txt`. If the cause is not clear, open an
[issue](https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/issues) and attach the log.

### Exit codes 129, 130, 137, 143: The pipeline was stopped {#signals}
<a id="9"></a><a id="15"></a><a id="129"></a><a id="130"></a><a id="137"></a><a id="143"></a>

The operating system stopped the pipeline. BiotaWiz shows **Pipeline was terminated**. The exit code tells you how:

| Exit code | Signal | Usual reason |
|---|---|---|
| 129 | SIGHUP (128 + 1) | The terminal or session that started the pipeline was closed. |
| 130 | SIGINT (128 + 2) | Stopped by the user (Ctrl+C, or **back (stop processing)**). |
| 137 | SIGKILL (128 + 9) | Killed by the system, almost always because **memory ran out**. See [USEARCHMEM](#usearchmem). |
| 143 | SIGTERM (128 + 15) | Asked to stop: the user stopped it, or the computer shut down. |

Samples that finished processing are kept. Start the run again to continue.

### USEARCHMEM (160): Out of memory {#usearchmem}
<a id="160"></a>

The computer ran out of memory (RAM) during processing or analysis.

- Choose fewer threads: **Number of CPU threads** on the [Parameters](../getting-started/08-parameters.md#number-of-cpu-threads) step.
- Close other programs while the analysis runs.
- On Windows, allow WSL2 more memory. See [Common issues › memory](troubleshooting-common-issues#memory).

### USEARCHELF (161): USEARCH is not a Linux program {#usearchelf}
<a id="161"></a>

The USEARCH program inside the pipeline is not a valid Linux executable. With current pipeline versions
USEARCH is built in, so this should not happen.
[Reset level 2](../getting-started/10-reset-environment.md#level-2) (delete and re-download the pipeline). If it
persists, open an issue.

### USEARCHV (162): Wrong USEARCH version {#usearchv}
<a id="162"></a>

The pipeline expects USEARCH version 11. As for [USEARCHELF](#usearchelf): delete and re-download the pipeline;
if it persists, open an issue.

### IMNARGC (163): Settings file could not be written {#imnargc}
<a id="163"></a>

The pipeline could not copy its settings file (`TACTICPipeline_args.yml`) into your data folder.

- Check that the base directory is writable (not read-only, not a CD or write-protected share).
- Check that the disk is not full.
- Avoid network drives; see [Network drives](peculiarities/troubleshooting-peculiarities-nas).

### IMNARGF (164): Settings file could not be read {#imnargf}
<a id="164"></a>

`TACTICPipeline_args.yml` in your base directory contains an invalid value, for example text where a number is
expected, or a threshold outside its allowed range.

- In BiotaWiz, go back to **Parameters**, check the Advanced settings (or reset them to the defaults) and run again.
- If it persists, open an issue and attach `TACTICPipeline_args.yml`.

### IMNPREF (165): Processing failed and stopped the analysis {#imnpref}
<a id="165"></a>

An unexpected error during sample processing stopped the whole run. Look at the end of `Pipeline_log.txt`, and
open an issue with the log attached.

### IMNANF (166): Analysis failed {#imnanf}
<a id="166"></a>

All samples were processed, but the analysis step (clustering, tables, trees) failed.

- Check `Analysis_log.txt` in the newest `Analysis_…` folder and `Pipeline_log.txt`.
- Out of memory is a common cause; try fewer threads.
- Otherwise open an issue with both logs.

### IMNPREC (167): Some samples failed, results were still produced {#imnprec}
<a id="167"></a>

Some samples could not be processed. The analysis **was completed** with the remaining samples, so you do have
results. BiotaWiz still shows this as an error so that you notice.

- The failed samples are listed in `Missed_samples.txt` in your base directory.
- Usually they have too few reads or poor quality. See
  [Common issues › some samples failed](troubleshooting-common-issues#failed-samples).
- Decide whether you can continue without them, or fix them and run again.

### IMNPREA (168): No sample could be processed {#imnprea}
<a id="168"></a>

Processing failed for every sample, so there is nothing to analyse.

- Check the [primer trimming](../getting-started/08-parameters.md#primer-trimming-stripleft-and-stripright) values
  and the merged read length limits; wrong values can remove all reads.
- Check whether the FASTQ files are complete (not truncated) and of normal size.
- See [Common issues › some samples failed](troubleshooting-common-issues#failed-samples).

### IMNSKIP (169): Analysis skipped {#imnskip}
<a id="169"></a>

The analysis step was skipped. On the command line this happens when you use `--skip-analysis` / `-sa`. In
BiotaWiz it means no samples were available to analyse. Check your sample selection and open an issue if it
persists.

### Exit code 170: Unknown analysis mode {#exit-170}
<a id="170"></a>

Command line only: `--analysis-mode` must be `TIC`, `TAC`, `ZOTU` or `OTU` (`de-novo` also works for OTU).

### F171 (171): Spike-in removal failed {#f171}
<a id="171"></a>

The pipeline could not prepare or use the spike-in reference sequences.

- If you selected **Use custom spike-in sequences**, check that the folder is inside your base directory and
  contains valid FASTA files (`.fasta`/`.fa`) with DNA sequences. See [FASTA](../reference/reference-file-formats#fasta).
- Otherwise delete and re-download the pipeline ([reset level 2](../getting-started/10-reset-environment.md#level-2)).

### Exit code 172: SILVA could not be downloaded {#exit-172}
<a id="172"></a>

The SILVA reference database is not on your computer yet and could not be downloaded.

- Make sure the computer, and on Windows WSL2, has internet access. See [Common issues › VPN](troubleshooting-common-issues#vpn).
- Run again once you are online. After the first successful download, no internet is needed.

### Exit code 176: Sample counts don't match {#exit-176}
<a id="176"></a>

The number of processed samples does not match the number expected. Run again. If it persists,
[reset level 4](../getting-started/10-reset-environment.md#level-4) for the affected samples, or open an issue with
`Pipeline_log.txt`.
