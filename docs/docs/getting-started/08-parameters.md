---
title: 7. Parameters
---

# 7. Parameters

The defaults work for most 16S V3–V4 data sequenced on Illumina MiSeq. The page has two parts:
**Basic settings**, which you should check, and **Advanced settings** ("Expert mode"), which you can usually leave
alone.

{/* SCREENSHOT: parameters-basic.png – Basic settings with threads slider, stripleft, stripright */}

## Basic settings

### Number of CPU threads

How many tasks run in parallel. BiotaWiz suggests a value from your computer's memory (about 3 GB of RAM per
thread) and number of processor cores. More threads finish sooner but need more memory. If a run fails with
**USEARCHMEM** (out of memory), choose fewer threads.

### Primer trimming: `stripleft` and `stripright`

The reads still contain the PCR primers at their ends. TACTIC removes them by **cutting a fixed number of bases**
from each end of the merged read. It doesn't search for the primer sequence; it only uses the length you give.

- **Bases to trim from the start of merged reads** (`stripleft`): the length of your **forward** primer.
- **Bases to trim from the end of merged reads** (`stripright`): the length of your **reverse** primer.
  Single-end data use only stripleft.

Example with the default primers 341F / 785R:

| Primer | Sequence (5'→3') | Length | Setting |
|---|---|---|---|
| 341F (forward) | `CCTACGGGNGGCWGCAG` | 17 | `stripleft = 17` |
| 785R (reverse) | `GACTACHVGGGTATCTAATCC` | 21 | `stripright = 21` |

Letters such as `N`, `W`, `H` or `V` stand for "one of several bases"
([IUPAC codes](../reference/reference-glossary#iupac)); each counts as **one** base. If your sequencing provider
has already removed the primers from the reads, set both values to **0**.

## Advanced settings (Expert mode)

Change these only if you know why. The names in brackets are the names used in the TACTIC parameter file. Only the sections for your chosen analysis are shown.

| Field in BiotaWiz | Default | What it means |
|---|---|---|
| Create a zOTU table for each sample | off | Also makes a separate zOTU table for each sample. Makes the run much slower. |
| Keep sequences that are not bacterial or archaeal | off | Skips the filter that removes non-16S sequences (for example host DNA). |
| Maximum mismatches in the overlap (`fastq_maxdiffs`) | 50 | Mismatches allowed where R1 and R2 overlap when they are merged into one sequence. Lenient on purpose; poor reads are removed by the quality filter afterwards. |
| Minimum overlap identity (%) (`fastq_pctid`) | 50 | Minimum percent identity of that overlap. |
| Minimum / Maximum merged read length (`fastq_minmergelen` / `fastq_maxmergelen`) | 200 / 600 | Merged reads shorter or longer than this are discarded. Change only if your amplicon is far from V3–V4 length (about 460 bases). |
| Maximum expected errors per base (`fastq_maxee_rate`) | 0.002 | Quality filter. A read is discarded if, judging from its quality scores, it is expected to contain more than 0.002 errors per base, i.e. more than 1 error in 500 bases. |
| Minimum number of reads per zOTU (`minsize`) | 2 | A sequence must be seen at least this many times to become a zOTU. |
| Minimum relative abundance (`abund_limit`), zOTUs | 0.0025 | A zOTU is kept only if it reaches this relative abundance (0.0025 = 0.25 %) in at least one sample; 0 keeps all zOTUs. The default follows [Reitmeier et al. 2021](https://doi.org/10.1038/s43705-021-00033-z), who found 0.25 % removes most spurious sequences before alpha and beta diversity analyses. |
| Sample-wise correction (`sample_wise_correction`) | No | Sets relative abundances below the abundance limit to 0 in each sample. |
| Minimum identity for mapping reads to zOTUs (`match_id`) | 0.99 | How similar a read must be to a zOTU to be counted for it. |
| Minimum number of reads per OTU / Minimum relative abundance (De Novo) | 8 / 0.0025 | The same two filters, for 97 % OTU clustering. |
| Family / Genus / Species similarity threshold (`family_sim`, `genus_sim`, `species_sim`) | 0.90 / 0.95 / 0.987 | Thresholds for TIC. Keep them in order: species ≥ genus ≥ family. See [TIC](../knowledge-base/description-of-pipelines/kb-pipelines-tic). |
| Clustering similarity threshold (`cluster_thr`) | 0.987 | Threshold for TAC. See [TAC](../knowledge-base/description-of-pipelines/kb-pipelines-tac). |

BiotaWiz saves all values to `TACTICPipeline_args.yml`
in your base directory, so you can see later exactly which settings a run used.

## Next step

Click **next** to start the run. See [5. Run the analysis wizard › Step 5](06-run-wizard.md#step-5-run).
