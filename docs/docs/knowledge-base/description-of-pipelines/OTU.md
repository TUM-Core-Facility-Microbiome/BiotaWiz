---
id: kb-pipelines-otu
title: OTU (legacy clustering)
sidebar_position: 1
---

# OTU: classic 97 % clustering

**In one sentence:** sequences that are at least **97 % identical** are put into one group, an *operational
taxonomic unit* (OTU). This is the classic approach used in older 16S studies.

In BiotaWiz this is the card **De Novo Clustering (UPARSE OTU clustering)**. On the command line it is
`--analysis-mode OTU` (or `de-novo`).

## How TACTIC makes OTUs

1. The reads of all samples are pooled and dereplicated.
2. Sequences seen fewer than `minsize` times (default **8**) are dropped. Rare sequences are often errors.
3. **UPARSE** (`cluster_otus`) groups the remaining sequences at 97 % identity and removes chimeras (artificial
   sequences formed during PCR).
4. Reads are counted per OTU and sample. OTUs below `abund_limit` (default **0.25 %**) in every sample are removed.
5. Each OTU gets a taxonomy, a tree and a Krona chart. Results are in `OTU_Pipeline/`.

## When to use it

- ✅ To compare with older studies that used 97 % OTUs.
- ✅ Robust against sequencing errors.
- ⚠️ 97 % lumps together different species: many species differ by less than 3 % in the 16S gene.
- ⚠️ OTU numbers from different runs are not comparable, because the clusters depend on the data.

For most new studies, [TIC](kb-pipelines-tic) is the better choice.

**Reference:** Edgar R.C. (2013). UPARSE: highly accurate OTU sequences from microbial amplicon reads.
*Nature Methods* 10:996–998. [doi:10.1038/nmeth.2604](https://doi.org/10.1038/nmeth.2604)
