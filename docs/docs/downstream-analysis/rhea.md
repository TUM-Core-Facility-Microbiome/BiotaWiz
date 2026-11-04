---
id: downstream-analysis-rhea
title: Rhea
---

# Rhea

[**Rhea**](https://github.com/Lagkouvardos/Rhea) is a set of R scripts for the step-by-step analysis of OTU
tables: normalisation, alpha and beta diversity, taxonomic binning, statistical comparisons and correlations.
You run each script in R or RStudio, one after the other.

## Which TACTIC files to use

| Rhea needs | Take this file |
|---|---|
| OTU table with taxonomy | TIC: `TIC_Pipeline/SOTUs-Table-TIC.tab` · TAC: `TAC_Pipeline/OTUs-Table-TAC.tab` · De Novo: `OTU_Pipeline/OTUs-Table.tab` |
| Phylogenetic tree | The matching `…-Tree-nj….tre` (e.g. `SOTUs-Tree-nj-TIC.tre`) |
| Mapping file (sample groups) | A tab-separated table you make yourself: `#SampleID` plus your grouping columns |

Use the **raw count** tables (without `…_Normalized` prefix): Rhea's first script does the normalisation.
Use the 7-level taxonomy files (without `-8Levels`). Rhea expects the classic ranks.

Rhea's [README](https://github.com/Lagkouvardos/Rhea) describes each script and its settings.

**Reference:** Lagkouvardos I., Fischer S., Kumar N., Clavel T. (2017). Rhea: a transparent and modular R pipeline
for microbial profiling based on 16S rRNA gene amplicons. *PeerJ* 5:e2836.
[doi:10.7717/peerj.2836](https://doi.org/10.7717/peerj.2836)
