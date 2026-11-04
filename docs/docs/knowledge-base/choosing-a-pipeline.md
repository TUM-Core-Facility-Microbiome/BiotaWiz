---
id: kb-choosing-a-pipeline
title: Which pipeline and which files?
sidebar_position: 1
---

# Which pipeline and which files should I use?

This page turns the results of the TACTIC paper into concrete advice: which analysis mode to run, and which output
file to open for each kind of question.

:::info Source
Pourjam M., Sewald Z., Kioukis A., List M., Neuhaus K., Lagkouvardos I. (2026). *TACTIC: hybrid denoising and
clustering for robust 16S amplicon diversity estimates.* bioRxiv preprint.
[doi:10.64898/2026.10.17.759814](https://doi.org/10.64898/2026.10.17.759814)
:::

## The short answer

- **Use TIC (the default)** for most studies. Work with `TIC_Pipeline/SOTUs-Table-TIC.tab`.
- Use **TAC** if **archaea** matter in your samples, or if much of your community is unknown to SILVA.
- Use the **zOTU** table only when you really need sequence-variant (sub-species) resolution. 
- Use **De Novo 97 % OTUs** only to compare with older studies that used 97 % OTUs.

The rest of this page explains why, and which file to use for each task.

## What the paper found

The authors tested the four TACTIC methods (and DADA2) on 27 samples from 11 **mock communities**: samples mixed
from known bacteria, so the correct answer is known.

1. **Denoising splits species.** One bacterial genome often carries several slightly different copies of the 16S
   gene, and strains of one species differ too. Denoising (zOTUs, and ASVs from DADA2) detects each of these
   variants separately, so **one species becomes several zOTUs**. This makes richness (the number of species)
   too high and distorts distances that ignore relatedness, such as Jaccard and Bray-Curtis.
2. **97 % OTU clustering merges species.** Classic OTUs (UPARSE) put different species into one OTU more often
   than the other methods.
3. **Clustering the zOTUs afterwards fixes most of the splitting.** In samples with too many units, TIC removed a
   median of **61 %** of the excess, and TAC **49 %**. On average, distances to the true composition
   became about **13 %** smaller with either method.
4. **Phylogeny-aware distances barely depend on the method.** UniFrac-type distances (which use a tree) gave
   reliable results for every method; TIC and TAC did not change them significantly.
5. **98.7 % works better than 97 % as a species threshold** for 16S, and is less sensitive to how long the
   sequenced region is. TIC and TAC use 98.7 % by default.
6. **TIC uses bacterial zOTUs only.** Archaeal zOTUs are left out of the TIC tables. This is part of why TIC
   removed more excess richness than TAC.

The authors' conclusion: denoising and clustering are **complementary**. Denoise first for fine resolution, then
cluster to get units that match species.

## Which mode for which question?

The table below applies the paper findings to common questions.

| Your question | Recommended mode | Table to use | Why |
|---|---|---|---|
| How many species? How diverse is a sample? (alpha diversity: richness, Shannon …) | **TIC** | `SOTUs-Table-TIC.tab` | zOTU counts are inflated by gene copies; TIC removed the most excess |
| How different are samples? (beta diversity with **Jaccard** or **Bray-Curtis**) | **TIC** (or TAC) | `SOTUs-Table-TIC.tab` | These distances are distorted by split species |
| How different are samples? (beta diversity with **UniFrac**) | Any; TIC for consistency with the rest | Table + matching tree, e.g. `SOTUs-Table-TIC.tab` + `SOTUs-Tree-nj-TIC.tre` | Tree-based distances were reliable for all methods |
| Which taxa differ between groups? (differential abundance, taxonomic composition) | **TIC** | `SOTUs-Table-TIC.tab` | Units correspond to species, and every unit has a full taxonomy, including new FOTU/GOTU names for unknown taxa |
| Samples with important **archaea** (e.g. methanogens in gut, soil or biogas) | **TAC** | `OTUs-Table-TAC.tab` | TIC tables contain bacteria only |
| Poorly known environments where SILVA names few sequences | **TAC** | `OTUs-Table-TAC.tab` | TAC clusters by sequence alone and does not depend on taxonomy |
| Strains or single sequence variants, or tracking one exact sequence | **zOTU** | `ZOTU_Pipeline/ZOTUs-Table.tab` | Highest resolution, but expect inflated richness |
| Comparison with older studies that used 97 % OTUs | **De Novo (OTU)** | `OTU_Pipeline/OTUs-Table.tab` | Same method as those studies; tends to merge species |
| Predicting functions (PICRUSt2) | Any | the files in `PICRUSt2-Inputs/` | Ready-made input for PICRUSt2 |

:::tip Low-count samples
`SampleMinCount_Normalized` tables are scaled to the total of the **smallest** sample in the run, including
negative controls and samples with a low microbial load. One such sample shrinks all others to a few reads'
worth: counts become small decimals, and rare taxa round to zero in tools that need whole numbers.
In that case, use the raw count table and normalise to a fixed depth in your downstream tool (e.g. Rhea, Namco).
Samples below that depth are left out, so choose a depth that keeps your real samples.
:::


:::tip zOTUs are always there
TIC and TAC are built from zOTUs, so every TIC or TAC run also writes `ZOTU_Pipeline/`. You can use the zOTU
table for a sub-species follow-up without running the pipeline again.
:::

## Which version of the table?

Each table comes in several versions. Pick the one that fits your next step:

| You want to … | Use the file … | Example (TIC) |
|---|---|---|
| Load it into [Namco](../downstream-analysis/namco.md), [Rhea](../downstream-analysis/rhea.md) or R/Python packages that normalise themselves | without prefix (raw read counts) | `SOTUs-Table-TIC.tab` |
| Compare composition or Bray-Curtis distances yourself, without differences in sequencing depth | `SampleMinCount_Normalized-…` (scaled to the smallest sample) | `SampleMinCount_Normalized-SOTUs-Table-TIC.tab` |
| Compare richness | raw counts, rarefied in your downstream tool | `SOTUs-Table-TIC.tab` |
| Compare **absolute** amounts (per gram) between samples of the same analysis, only if all samples were spiked ([details](../getting-started/07-mapping-file.md#how-tactic-calculates-absolute-abundances)) | `Spike_Normalized-…` | `Spike_Normalized-SOTUs-Table-TIC.tab` |
| Use a tool that expects the classic 7 taxonomic ranks | without `-8Levels` | `SOTUs-Table-TIC.tab` |
| Use the newer 8-rank SILVA taxonomy (with *Kingdom*) | with `-8Levels` | `SOTUs-Table-TIC-8Levels.tab` |
| Calculate UniFrac or draw a tree of samples | the tree that belongs to the table | `SOTUs-Tree-nj-TIC.tre` |
| Look at the sequences, e.g. to BLAST a unit | the matching `…-Seqs-….fasta` | `SOTUs-Seqs-TIC.fasta` |
| Get a first visual overview | the Krona chart | `SOTUs-Krona.html` |

## Finding the zOTUs inside a species unit

Clustering hides which zOTUs were grouped together. The map files keep this information:

| Mode | Map file | What it says |
|---|---|---|
| TIC | `Map-SOTU-ZOTU.tab` | which zOTUs form each SOTU |
| TIC | `Map-GOTU-SOTU.tab`, `Map-FOTU-GOTU.tab` | which SOTUs form a new genus (GOTU), and which GOTUs a new family (FOTU) |
| TAC | `Map-ZOTUs-OTUs-TAC.tab` | which zOTUs form each TAC OTU |

Use them when one SOTU looks interesting and you want to know whether it hides several variants (for example
two strains that respond differently).

### Which zOTU represents a SOTU or a TAC OTU? {#representative-zotu}

Each SOTU (TIC) and each TAC OTU is represented by **one** of its zOTUs. That zOTU gives the unit its
sequence (in `SOTUs-Seqs-TIC.fasta` / `OTUs-Seqs-TAC.fasta`), its taxonomy, and its position in the tree. In
those files the zOTU is renamed to the SOTU/OTU name, so you have to look it up.

**TIC: the most abundant zOTU of the SOTU** (highest total read count over all samples).

1. Open `TIC_Pipeline/Map-SOTU-ZOTU.tab` and filter the `SOTU` column for your SOTU, e.g. `SOTU3501`. Note its
   zOTUs. The order of the rows means nothing.
2. Open `ZOTU_Pipeline/ZOTUs-Table.tab` (raw counts) and add up the counts of each of those zOTUs across all
   samples (in Excel: a `SUM` column at the end of each row).
3. The zOTU with the highest total is the representative.

If the SOTU has only one zOTU, that zOTU is the representative.

**TAC: the cluster centroid**, the zOTU that started the cluster. TAC sorts zOTUs by length before clustering, so
the centroid is the longest zOTU of its OTU.

1. Open `TAC_Pipeline/Map-ZOTUs-OTUs-TAC.tab`. It has two columns, zOTU and OTU, and no header.
2. Find the rows of your OTU, e.g. `OTU12`. The **first** zOTU listed for it is the centroid.

:::tip Check by sequence
The sequence of a SOTU or TAC OTU is identical to the sequence of its representative zOTU. Copy the sequence
from `SOTUs-Seqs-TIC.fasta` or `OTUs-Seqs-TAC.fasta` and search for it in `ZOTU_Pipeline/ZOTUs-Seqs.fasta`
(Ctrl+F in a text editor). The zOTU with exactly that sequence is the representative.
:::

To BLAST or align a unit, use its sequence from the `…-Seqs-….fasta` file, which is already the representative's
sequence. To see all variants of the unit, collect the sequences of every zOTU from the map file.

## Good practice

- **Choose the mode before you look at the results**, and use the same one for the whole study. Don't pick
  whichever table gives the nicest p-value.
- **Don't mix tables.** Unit names such as `SOTU12` or `Zotu5` are given per analysis. The same name in two
  different runs, or in a TIC and a TAC table, is not the same organism. To compare studies, analyse all
  samples together in one run.
- **Keep the default thresholds** (98.7 % species, 95 % genus, 90 % family) unless you have a reason. The
  paper notes that no single cutoff fits every bacterial family or environment; if you change a threshold,
  report it.
- **When reporting diversity, prefer at least one tree-based measure** (UniFrac) in addition to Jaccard or
  Bray-Curtis. Tree-based measures were the most robust across methods.
- **Report what you used** in your methods section, for example: *"Sequences were denoised and clustered with
  TACTIC v1.0.0 (TIC mode, 98.7 % species threshold; Pourjam et al. 2026), run via BiotaWiz v1.0.2."* See
  [Versions](../getting-started/11-versions-and-changes.md) for how to find the version numbers.

## Limits of the evidence

The benchmark used **mock communities** and only the **V4 region** of the 16S gene. The authors expect the same
principles to apply to natural samples and other regions, but mock communities are simpler than real
microbiota. In samples with many closely related species (the paper's example is *Enterobacterales*), V4 may be
too short to separate them with any method.

## Read more

- How each mode works: [OTU](description-of-pipelines/OTU.md), [zOTU](description-of-pipelines/zOTU.md),
  [TAC](description-of-pipelines/TAC.md), [TIC](description-of-pipelines/TIC.md)
- All output folders and files: [Understand your results](../getting-started/09-results.md)
- Terms such as richness, Jaccard or UniFrac: [Glossary](../reference/glossary.md)
