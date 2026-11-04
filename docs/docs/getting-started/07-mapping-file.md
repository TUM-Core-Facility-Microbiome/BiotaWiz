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

In all three cases, spike-in reads are **removed** from your data, and TACTIC also writes depth-normalised tables
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

## Do's and don'ts

BiotaWiz does not check the spreadsheet. TACTIC reads it as it is, so check it yourself before you continue.

### Do

- **Do enter a spike amount greater than 0 for every sample** when you chose *all samples*.
- **Do use the same units for all samples**: weight in **grams**, spike amount in **nanograms**. Convert mg to g
  (25 mg → `0.025`).
- **Do write `NaN` if you don't know a sample's weight.** TACTIC then uses the **median weight** of the other
  samples for it, so that sample's absolute values are only an estimate.
- **Do analyse samples together only if they were spiked the same way**: same spike-in standard, and amounts
  that are comparable.
- **Do check the result** after the run (see [Check after the run](#check-after-the-run)).

### Don't

- **Don't leave a cell empty.** An empty weight or spike amount stops the run with an error ("Could not parse
  weight amount from mapping file"). Write `NaN` for an unknown weight.
- **Don't write `0` as weight** for an unknown weight. TACTIC treats 0 and negative weights like `NaN` and
  silently uses the median weight instead.
- **Don't put `0` or `NaN` as spike amount for a sample that was spiked.** One such sample is enough to switch off
  absolute abundances for **the whole analysis** (see below).
- **Don't mix spiked and unspiked samples** in one run with the *all samples* option. Use **Partial** instead,
  or analyse the spiked samples in a separate run.
- **Don't add units or text** (`3 ng`, `~0.03`), extra rows, or extra sheets (only the first sheet is read).
- **Don't change `#SampleID`, `parent_path` or the header row.**
- **Don't compare `Spike_Normalized` values between different analyses.** They are scaled to the average spike
  signal of the samples in *that* analysis (see below), so the numbers of two runs are on different scales.
  Analyse all samples you want to compare together.

:::tip Decimal separator
Use a dot: `0.0279`, not `0,0279`. TACTIC accepts both, but other tools such as Namco or R may not.
:::

### What do `NaN` and `0` mean?

- **`NaN`** means *Not a Number*: "no value". As weight, it means "unknown"; TACTIC fills in the median weight
  of the other samples.
- **`0`** as spike amount means "this sample was **not** spiked".

With **Partial** or **not used**, BiotaWiz writes `NaN` (weight) and `0` (spike amount) for every sample
automatically. You don't need to open the spreadsheet, and no `Spike_Normalized` tables are made.

## How TACTIC calculates absolute abundances

During processing, TACTIC counts the spike-in reads of each sample and then removes them. In the analysis, every
count in the table is converted like this:

```text
                     average spike reads (all samples)     spike amount (ng)
absolute value = reads × ───────────────────────────────── × ─────────────────
                     spike reads in this sample            6 × weight (g)
```

In words:
- A sample with **fewer spike reads than average** had more bacterial DNA compared with the spike, so its
  counts are scaled **up**, and vice versa.
- More spike DNA added means each read stands for more DNA, so values scale with the **spike amount**.
- Dividing by the **weight** gives values **per gram** of sample.

The result is proportional to the bacterial load per gram. It is a relative scale for comparing samples **within
one analysis**, not a number of cells or gene copies.

### When are `Spike_Normalized` tables made?

Only if **every** sample in the analysis passes this check:

| Spike amount in the mapping file | Spike reads found | TACTIC treats the sample as … | Result |
|---|---|---|---|
| greater than 0 | more than 0 | spiked | ✅ OK |
| greater than 0 | 0 | spike missing (forgotten, failed, or a different spike-in) | ❌ no spike tables for the whole analysis |
| 0 | more than 0 | not spiked; the spike reads are contamination | ❌ no spike tables for the whole analysis |
| 0 | 0 | not spiked | ❌ no spike tables for the whole analysis (unless *no* sample is spiked) |

If any sample fails, TACTIC still writes all other tables. It only logs *"'Spike' normalization method is not
applicable"* and skips the `Spike_Normalized-…` files.

## Check after the run {#check-after-the-run}

1. **Are there `Spike_Normalized-…` files** in the pipeline folders (e.g. `TIC_Pipeline/`)? If not, one of the
   samples failed the check above.
2. **Open `spike_mapping_file.csv`** in the `Analysis_…` folder. It shows, per sample, the values TACTIC really
   used: `SpikeReads`, `spikes_total_weight_in_g` and `spike_amount`.
   - A sample with **0 `SpikeReads`** although you spiked it: the spike-in was not detected. If you used other
     spike-ins than the default, select them with **Use custom spike-in sequences**.
   - A sample with **far fewer spike reads than the others**: its absolute values are multiplied by a large
     factor and are unreliable. Interpret it with care.
3. **Compare with your lab notes**: weights and spike amounts must be the numbers you entered.

:::warning Corrected a weight after the run?
TACTIC stores each sample's weight when it **processes** the sample, and reuses processed samples in later runs.
A changed **spike amount** makes it process the sample again, but a changed **weight** does not. After correcting
weights, delete the `<sample>__processed` folders of those samples
([reset level 4](10-reset-environment.md#level-4)) and run again. Then check `spike_mapping_file.csv`.
:::

## Next step

[7. Parameters](08-parameters.md)
