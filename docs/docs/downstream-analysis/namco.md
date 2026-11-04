---
id: downstream-analysis-namco
title: Namco
---

# Namco

[**Namco**](https://exbio.wzw.tum.de/namco/) is a free web platform for exploring microbiome data. It covers
diversity, ordination, differential abundance, correlation and network analyses, with no programming needed.
BiotaWiz recommends it at the end of every run.

## Which TACTIC files to upload

| Namco asks for | Take this file | Notes |
|---|---|---|
| OTU/ASV abundance table | TIC: `TIC_Pipeline/SOTUs-Table-TIC.tab` · TAC: `TAC_Pipeline/OTUs-Table-TAC.tab` · De Novo: `OTU_Pipeline/OTUs-Table.tab` | Use the **raw counts** (no `…_Normalized` prefix); Namco normalises itself. The taxonomy is in the last column. |
| Phylogenetic tree (optional) | The matching `…-Tree-nj….tre`, e.g. `SOTUs-Tree-nj-TIC.tre` | Needed for UniFrac distances |
| Sample metadata | A table you make yourself: one row per sample, `#SampleID` plus your groups (treatment, time point …) | Sample IDs must match the column names of the abundance table exactly |

Save the metadata as a [tab-separated file](../reference/reference-file-formats#tsv). Prefer the 7-level files
(without `-8Levels`) unless you know your tool supports the extra *Kingdom* rank.

Namco's own [documentation](https://exbio.wzw.tum.de/namco/) explains the upload page and every analysis.
