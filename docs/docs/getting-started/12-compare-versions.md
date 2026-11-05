---
title: 11. Comparing results of different versions
---

# 11. Comparing results of different versions

Results can differ between TACTIC versions. The [TACTIC changelog](https://github.com/MPourjam/TACTIC-Pipeline/blob/main/CHANGELOG.md)
ends every version with a section **Changes that affect your results**. This page explains how to read it and how to
reproduce results of an earlier version. The TACTIC version used for an analysis is the first line of
`Analysis_log.txt` in its `Analysis_…` folder.

## Reading "Changes that affect your results" {#reading}

Each section lists what can make the numbers of zOTUs, OTUs or SOTUs, the counts, the taxonomy or the normalized
tables differ from the previous version:

- **Files not affected / Files affected**: which output files change, e.g. `ZOTUs-Table.tab` or
  `Spike_Normalized-SOTUs-Table-TIC.tab`.
- A table of the changes with their **Effect**, whom they **affect** and whether you can **reproduce the earlier
  result** with the new version.
- One part per change with the details.

**Affects** names who is concerned: **BiotaWiz** users, or **command-line** users who start TACTIC themselves with
`docker run`. Both run the same Docker image.

Parameters are named as on the **Parameters** step of BiotaWiz, followed by their name in the arguments file, e.g.
**Minimum relative abundance** (`ClusterZOTUsArgs` › `abund_limit`).

## Effect grades {#effect}

**Effect** grades how much a change can alter the **biological interpretation** of the runs it applies to: richness
and alpha diversity, beta diversity, taxonomic composition, absolute abundance and comparisons between groups.

| Effect | Biological interpretation |
|---|---|
| **1 Very low** | No biological result changes; only technical details of the files differ. |
| **2 Low** | Small numeric differences; diversity, composition and group differences stay the same. |
| **3 Medium** | One kind of result can change for some taxa or samples (e.g. absolute abundances, some taxon names, zOTU richness); the main conclusions usually hold. Recheck that analysis. |
| **4 High** | The conclusions of one kind of analysis can change (e.g. absolute abundances between groups, group statistics, single samples). Redo that analysis with the new version before comparing. |
| **5 Very high** | The biological picture changes: richness, alpha or beta diversity or the taxonomic composition differ substantially. Conclusions drawn from earlier results may not hold. |

The grades are estimates from what each change does. Only the one for **Minimum relative abundance** (TACTIC 1.0.0)
is measured.

## How to reproduce results of an earlier version {#reproduce}

1. **With a parameter**, where a change says so: set the value given there on the **Parameters** step of BiotaWiz or
   in the arguments file (see [Finding a parameter](#finding-a-parameter)).
2. **Otherwise, run the earlier version:**
   - BiotaWiz: under **Settings › Environments › TACTIC Pipeline**, set **Update strategy** to *always use version X*.
     The **Base** step of the wizard then shows `(pinned version)`. See [Versions and what changed](./11-versions-and-changes.md).
   - Command line: use the image of that version, e.g. `ghcr.io/mpourjam/tactic-pipeline:1.0.0`.

   Run it on a copy of the FASTQ folder without the `<sample>__processed/` folders written by newer versions (on the
   command line, `-fp` also works), so that every sample is processed by that version.
3. **Use the same SILVA release.** The taxonomy also depends on the SILVA release, which depends
   on when you run, not only on the TACTIC version: with internet access, TACTIC 1.0.x always uses the newest SILVA
   release. To keep an older release (command line, TACTIC 1.0.0 or newer), keep only that release in the database
   folder and run without internet access (`docker run --network none ...`); TACTIC then uses the local copy.
   BiotaWiz has no option for this.

## Finding a parameter {#finding-a-parameter}

**In BiotaWiz:** go to the **Parameters** step of the wizard (after **Spike-in**). It has two parts:

- **Basic settings** (open): **Threads** and **Primer trimming**.
- **Advanced settings** (closed; click its title to open it): all other parameters, in sections such as **Merging
  paired-end reads**, **Quality filtering: paired-end reads** or **zOTU picking (all samples together)**.

Find the section named in the change, then the field by its label, e.g. **Minimum relative abundance**. The small grey
name under each label is the parameter's name in the arguments file (e.g. `abund_limit`). Some sections only appear
when they apply: **UPARSE (OTU) arguments**, **Taxonomy-informed clustering (TIC)** and **Taxonomy-agnostic clustering
(TAC)** for that analysis mode, and **zOTU picking per sample** when **Create a zOTU table for each sample** is ticked.
All parameters are described in [Parameters](./08-parameters.md).

**In the arguments file:**

- BiotaWiz writes `TACTICPipeline_args.yml` into the folder chosen on the **Base** step and rewrites it from the
  **Parameters** step for every run, so change BiotaWiz runs on the **Parameters** step, not in the file.
- Command-line runs use the file given with `-y` (relative to the input folder), or `TACTICPipeline_args.yml` in the
  input folder (created from the default file if it is missing). `-tf` writes a template to start from.
- Every `Analysis_<timestamp>/` folder keeps a copy of the arguments file the run used: look there to see which values
  an earlier run had.

Each section name (e.g. `ClusterZOTUsArgs`) starts a block, and its parameters are indented below it:

```yaml
ClusterZOTUsArgs:
  minsize: 2
  abund_limit: 0.0025
  sample_wise_correction: false
  match_id: 0.99
```

For TACTIC versions before 1.0.0, write decimal parameters with a decimal point (`0.0`, not `0`); otherwise they are
ignored (see TACTIC 1.0.0 in the changelog).
