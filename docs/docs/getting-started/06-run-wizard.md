---
title: 5. Run the analysis wizard
---

# 5. Run the analysis wizard

:::info You will need
- BiotaWiz ready ([readiness check](04-readiness-check.md) passed)
- Your data in one folder ([prepare your data](05-prepare-your-data.md))
:::

On the home screen, click the card of the analysis you want. If you are unsure, take
**Taxonomy Informed Clustering (TIC)**. The wizard then has five steps, shown at the top:

**Base → Samples → Spike-in → Parameters → Run**

Use **next** and **back** to move between steps. **Start over** returns to the beginning.

## Step 1: Base

1. Click the folder field and select your **base directory** (the folder with your FASTQ files).
2. Check the line `TACTIC pipeline version: …` (see [readiness check 3](04-readiness-check.md#check-3-a-pipeline-version-is-selected)).
3. Click **next**.

Results will be written into this folder.

{/* SCREENSHOT: step1-base.png – Base step with a selected folder and the pipeline version line */}

## Step 2: Samples

BiotaWiz lists all FASTQ files it found, grouped by folder. Paired files are shown as one sample.

1. Click a folder name to expand it.
2. Tick the samples you want to analyse.
3. Click **next**.

If a sample is missing or not paired as expected, check the file names: see
[How BiotaWiz finds read pairs](05-prepare-your-data.md#how-biotawiz-finds-read-pairs).

{/* SCREENSHOT: step2-samples.png – Sample Browser with an expanded folder and ticked samples */}

## Step 3: Spike-in

Tell BiotaWiz whether you added a spike-in standard (a known amount of foreign DNA, used to calculate absolute
abundances). There are three choices, explained in detail in [6. Spike-in and the mapping file](07-mapping-file.md):

- **Spike-in standard was added to all samples**: BiotaWiz opens a spreadsheet; fill in weight and spike amount.
- **Partial: Spike-in standard was added to some of the samples**
- **Spike-in standards were not used for any of the samples**

{/* SCREENSHOT: step3-spike.png – Spike-in step with the three options */}

## Step 4: Parameters

The default settings suit most V3–V4 analyses. Usually you only check two things:

- **Threads**: how many samples run in parallel. BiotaWiz suggests a safe value for your computer.
- **Primer trimming** (`stripleft` / `stripright`): must match the length of your primers.

Details: [7. Parameters](08-parameters.md).

{/* SCREENSHOT: step4-parameters.png – Parameters step, Basic settings */}

## Step 5: Run

Click **next** on the Parameters step to start. The first run also downloads the pipeline and the SILVA database.
This takes longer; see [requirements](01-system-requirements.md#what-gets-downloaded).

You see two kinds of log:
- **Main logs**: the overall progress, grouped into stages.
- **Sample-wise preprocessing logs**: one panel per sample. A sample is done when it shows
  `# Finished Preprocessing`.

Samples that were already processed in an earlier run are skipped and not shown.

When the analysis has finished you see **Analysis done. Analysis directory ready.**, a desktop notification
**TACTIC finished successfully**, and the button **Open analysis directory**.

{/* SCREENSHOT: step5-run-done.png – Run step after success with "Open analysis directory" */}

:::warning Stopping a run
**back (stop processing)** stops the running analysis. Samples that finished processing are kept and reused next
time.
:::

If the run ends with an error, the message shows a code (for example `IMNPREA`) and a link to its help page.
All codes are listed in [Error codes](../troubleshooting/troubleshooting-error-codes).

## Next step

[8. Understand your results](09-results.md)
