---
title: 6. Spike-in and the mapping file
---

# 6. Spike-in and the mapping file

:::info You will need
Only if you used a spike-in standard: the **weight** (in grams) of each sample and the **amount of spike-in DNA**
(in nanograms, ng) added to it.
:::

## What is a spike-in, and why does it matter?

Sequencing only tells you **relative** abundances: *Bacteroides* is 20 % of the reads. It does not tell you how
many bacteria were in the sample. A **spike-in standard** is a known amount of artificial DNA added to every sample
before DNA extraction. Because you know how much you added, TACTIC can use the spike-in reads to convert the
counts into **absolute** abundances per gram of sample.

By default TACTIC recognises the synthetic spike-in sequences of
[Tourlousse et al. 2017](https://doi.org/10.1093/nar/gkw984), as used by the TUM Core Facility Microbiome.
If you used other spike-ins, click **Use custom spike-in sequences** and select a folder with their FASTA files.
That folder must be **inside your base directory**.

## Which option should I choose?

| Option in BiotaWiz | Choose it when | What TACTIC does |
|---|---|---|
| **Spike-in standard was added to all samples** | Every sample was spiked and you know weight and spike amount | Removes spike reads **and** calculates absolute abundances (`Spike_Normalized-…` tables). Opens a spreadsheet for you to fill in. |
| **Partial: … added to some of the samples** | Only some samples were spiked | Removes spike reads, no absolute abundances (a mixed set can't be compared fairly). |
| **Spike-in standards were not used …** | No sample was spiked | Removes any spike reads (in case of contamination), no absolute abundances. |

In all three cases, spike-in reads are **removed** from your data, and TACTIC also gives relative-abundance tables
(`SampleMinCount_Normalized-…`, see [results](09-results.md)).

## Filling in the mapping file (option "all samples")

When you choose **Spike-in standard was added to all samples** and click **next**, BiotaWiz creates a spreadsheet
`mapping_<number>.xlsx` in your base directory and opens it in Excel or LibreOffice Calc. One row is already
there for each selected sample.

{/* SCREENSHOT: mapping-xlsx.png – the mapping spreadsheet opened in Excel, with columns filled in */}

| Column | What to enter | Example | Rules |
|---|---|---|---|
| `#SampleID` | The sample name. **Already filled in; don't change it.** | `Mouse01_S1_L001` | Must match the FASTQ file name. |
| `total_weight_in_g` | Weight of the sample material used for DNA extraction, in **grams** | `0.0279` | A positive number. |
| `spike_amount` | Amount of spike-in DNA added, in **nanograms (ng)** | `3` | A number greater than 0. |
| `parent_path` | The sub-folder of the sample. **Already filled in; don't change it.** | `Run_2025_01` | Empty if the sample is directly in the base directory. |

1. Replace the placeholder values (`NaN` and `0`) with your numbers.
2. **Save** the file in the same place and the same format (`.xlsx`), then **close** it.
3. Go back to BiotaWiz and continue with **Parameters**.

When you leave the Parameters step, BiotaWiz converts your spreadsheet into a tab-separated text file
(`mapping_<number>.csv`, a [TSV file](../reference/reference-file-formats#tsv)) and hands it to TACTIC.

:::warning Check your numbers carefully. BiotaWiz does not check them
- Use a **dot** as decimal separator: `0.0279`, not `0,0279`. (TACTIC accepts both, but other tools such as
  Namco or R may not.)
- Don't leave cells empty, don't add units (`3 ng`), and don't add extra rows or sheets.
- Keep the header row exactly as it is.
:::

### What do `NaN` and `0` mean?

- **`NaN`** means *Not a Number*: "no value". BiotaWiz writes it for the weight when no weight is known.
- **`0`** spike amount tells TACTIC "this sample was not spiked; don't calculate absolute abundances".

With **Partial** or **not used**, BiotaWiz fills these placeholders in for every sample automatically. You don't
need to open the spreadsheet.

## Next step

[7. Parameters](08-parameters.md)
