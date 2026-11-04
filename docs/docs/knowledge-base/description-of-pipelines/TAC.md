---
id: kb-pipelines-tac
title: TAC
sidebar_position: 3
---

# Taxonomy Agnostic Clustering (TAC)

**In one sentence:** TAC groups [zOTUs](kb-pipelines-zotu) that are at least **98.7 % identical**, a common
threshold for "same species" in the 16S gene, without looking at their taxonomy.

## How it works

1. TACTIC first creates zOTUs (see [zOTU](kb-pipelines-zotu)).
2. The zOTUs are sorted by length and clustered at `cluster_thr` = **0.987** (USEARCH `cluster_smallmem`, both
   strands). The first zOTU of each cluster becomes its representative sequence (*centroid*).
3. The counts of all zOTUs in a cluster are added up. Results are in `TAC_Pipeline/`; the file
   `Map-ZOTUs-OTUs-TAC.tab` lists which zOTUs went into which OTU.

## When to use it

- ✅ Reduces the [diversity inflation](kb-pipelines-zotu#strengths-and-limitations) of zOTUs.
- ✅ Doesn't depend on a reference database, so it also works for poorly described communities.
- ⚠️ A fixed threshold can still merge two closely related species, or split one species whose gene copies
  differ more than 1.3 %. [TIC](kb-pipelines-tic) uses taxonomy to avoid this.
