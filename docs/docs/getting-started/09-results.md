---
title: 8. Understand your results
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# 8. Understand your results

Click **Open analysis directory** at the end of a run, or open your base directory yourself. Every run creates a
new folder named after the date and time it started, for example `Analysis_20260315_142233`. Earlier results
are never overwritten.

## Start with "Output files explanation.html"

Every results folder contains a page called **`Output files explanation.html`**. Double-click it to open it in
your web browser. It explains every file in that folder in plain language, and its **Open** buttons open the
files directly.

Here is what the page in the main results folder looks like (an example without data, so the Open buttons
are missing):

<iframe
  src={useBaseUrl('/examples/Analysis_example/Output%20files%20explanation.html')}
  title="Example: Output files explanation (main results folder)"
  style={{width: '100%', height: '560px', border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: '8px'}}
  loading="lazy"
/>

## What is in each folder

Click **Open example** to see the explanation page of that folder in a new tab.

| Folder | What it contains | Example page |
|---|---|---|
| `Analysis_<date>_<time>/` | The overview page, the logs (`Analysis_log.txt`, a copy of `Pipeline_log.txt`), the settings used (`TACTICPipeline_args.yml`), the mapping file used, and `README_Taxonomy_Levels.txt` | <a href={useBaseUrl('/examples/Analysis_example/Output%20files%20explanation.html')} target="_blank">Open example</a> |
| `TIC_Pipeline/` | Results of **TIC**: the species-level table `SOTUs-Table-TIC.tab`, sequences, tree, Krona chart, and maps showing which zOTUs were grouped together | <a href={useBaseUrl('/examples/Analysis_example/TIC_Pipeline/Output%20files%20explanation.html')} target="_blank">Open example</a> |
| `TAC_Pipeline/` | Results of **TAC**: `OTUs-Table-TAC.tab`, sequences, tree, Krona chart, zOTU-to-OTU map | <a href={useBaseUrl('/examples/Analysis_example/TAC_Pipeline/Output%20files%20explanation.html')} target="_blank">Open example</a> |
| `OTU_Pipeline/` | Results of **De Novo** 97 % OTU clustering: `OTUs-Table.tab`, sequences, tree, Krona chart | <a href={useBaseUrl('/examples/Analysis_example/OTU_Pipeline/Output%20files%20explanation.html')} target="_blank">Open example</a> |
| `ZOTU_Pipeline/` | The **zOTU** results, always produced: `ZOTUs-Table.tab`, sequences, tree, Krona chart | <a href={useBaseUrl('/examples/Analysis_example/ZOTU_Pipeline/Output%20files%20explanation.html')} target="_blank">Open example</a> |
| `PICRUSt2-Inputs/` | Ready-made input files for [PICRUSt2](https://github.com/picrust/picrust2), which predicts functional potential | <a href={useBaseUrl('/examples/Analysis_example/PICRUSt2-Inputs/Output%20files%20explanation.html')} target="_blank">Open example</a> |
| `Shared/` | Files used by several of the folders above | <a href={useBaseUrl('/examples/Analysis_example/Shared/Output%20files%20explanation.html')} target="_blank">Open example</a> |

Only the folders of the analysis you ran are created. A TIC run, for example, gives `TIC_Pipeline/` and
`ZOTU_Pipeline/`, but not `OTU_Pipeline/`.

## Which table should I use?

Most tables come in several versions:

| File name starts with | Values are | Use it for |
|---|---|---|
| *(nothing, e.g. `SOTUs-Table-TIC.tab`)* | Read counts | Most downstream tools (Namco, Rhea); they normalise themselves |
| `SampleMinCount_Normalized-…` | Counts after randomly subsampling (*rarefying*) every sample down to the read number of the smallest sample | Alpha and beta diversity comparisons without differences in sequencing depth |
| `Spike_Normalized-…` | Absolute abundances, calculated from the spike-in | Only produced when samples were spiked ([mapping file](07-mapping-file.md)) |

Files ending in **`-8Levels`** use the newer 8-rank SILVA taxonomy, which adds a *Kingdom* rank (for example
*Bacillati*). The other files use the classic 7 ranks (Domain to Species). `README_Taxonomy_Levels.txt` explains
the difference. If your downstream tool expects the usual 7 ranks, use the files without `-8Levels`.

All tables are [tab-separated text files](../reference/reference-file-formats#tsv) (`.tab`). Excel and LibreOffice
open them; trees (`.tre`) open in tree viewers such as [iTOL](https://itol.embl.de/); Krona charts (`.html`) open in
any browser. See [File formats](../reference/reference-file-formats).

## Files in your base directory

Some files are written next to your FASTQ files, not into `Analysis_…`:

| File or folder | What it is |
|---|---|
| `Pipeline_log.txt` | The full log of the run. Attach it when you ask for help. |
| `Missed_samples.txt` | Samples that failed in processing (only if some failed; see [IMNPREC](../troubleshooting/troubleshooting-error-codes#imnprec)). |
| `<sample>__processed/` | Intermediate results of each sample, including a per-sample Krona chart (`text.krona.html`) and `reads_report.txt`, which shows how many reads survived each step. |
| `TACTICPipeline_args.yml`, `mapping_<number>.xlsx/.csv` | The settings and mapping file BiotaWiz wrote for the run. |

:::tip Many reads lost?
Open `reads_report.txt` inside the sample's `__processed` folder. It shows how many reads remained after
merging, quality filtering and the other steps. This tells you where the reads were lost.
:::

## Next step

Continue with your statistics in [Namco](../downstream-analysis/downstream-analysis-namco) or
[Rhea](../downstream-analysis/downstream-analysis-rhea).
