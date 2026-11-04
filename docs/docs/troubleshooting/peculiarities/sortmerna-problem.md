---
id: troubleshooting-peculiarities-sortmerna-problem
title: Many reads removed by the 16S filter
---

# Many reads removed by the 16S filter (SortMeRNA)

During processing, TACTIC keeps only sequences that look like **bacterial or archaeal 16S rRNA**. It uses the
program **SortMeRNA**, which compares each sequence with SILVA 16S reference sequences. The filter removes
off-target products such as host DNA, chloroplast or mitochondrial sequences, and primer dimers.

## Symptoms

- In `<sample>__processed/reads_report.txt`, most reads disappear at the 16S filtering step.
- Samples fail with [IMNPREA](../troubleshooting-error-codes#imnprea) or [IMNPREC](../troubleshooting-error-codes#imnprec),
  although merging and quality filtering looked fine.

## Possible causes and fixes

| Cause | What to do |
|---|---|
| Your amplicon is **not 16S** of bacteria/archaea (for example 18S, ITS, or a functional gene) | Tick **Keep sequences that are not bacterial or archaeal** in the [Advanced settings](../../getting-started/08-parameters.md#advanced-settings-expert-mode). On the command line, use `--skip-non-bacterial-filter` / `-snbf`. |
| Samples with **a lot of host DNA** (biopsies, low-biomass samples) | The filter works as intended: those reads are not bacterial. Check whether enough reads remain; consider sequencing deeper. |
| **Wrong primer trimming**, so the sequences no longer look like 16S | Check [stripleft/stripright](../../getting-started/08-parameters.md#primer-trimming-stripleft-and-stripright). |
| A **damaged reference database** after an interrupted first run | [Reset level 5](../../getting-started/10-reset-environment.md#level-5) (download SILVA again) and [level 2](../../getting-started/10-reset-environment.md#level-2) (re-install the pipeline). |
