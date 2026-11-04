---
id: kb-pipelines-zotu
title: zOTU (denoised amplicons)
sidebar_position: 2
---

# zOTU: denoised amplicons

**In one sentence:** a zOTU is one exact DNA sequence that remains after sequencing errors were removed. It is
the finest level of detail TACTIC gives.

zOTUs are known under several names: *zero-radius OTU* (zOTU, in USEARCH), *amplicon sequence variant* (ASV, in
DADA2) or *exact sequence variant* (ESV).

## How TACTIC makes zOTUs

1. All reads of all samples are pooled and identical reads are counted (*dereplication*).
2. **UNOISE3** separates real biological sequences from sequencing errors. An error is usually a rare sequence that
   differs by one or two bases from a very common one. Sequences seen fewer than `minsize` times (default 2) are
   dropped.
3. All reads are mapped back to the zOTUs (at ≥ 99 % identity, `match_id`) to count how often each zOTU occurs in
   each sample.
4. Each zOTU gets a taxonomy from SILVA (with SINA), and a phylogenetic tree is built.

The zOTU results are **always** produced: TIC and TAC are built on top of them. They are in `ZOTU_Pipeline/`.

## Strengths and limitations

- ✅ Highest resolution: can separate strains that differ by a single base.
- ✅ Exact sequences are comparable between studies.
- ⚠️ **Diversity inflation:** many bacteria carry several copies of the 16S gene that differ slightly. One
  bacterium can then appear as several zOTUs, so richness is overestimated. TIC and TAC group such zOTUs again.

**Reference:** Edgar R.C. (2016). UNOISE2: improved error-correction for Illumina 16S and ITS amplicon sequencing.
*bioRxiv* 081257. [doi:10.1101/081257](https://doi.org/10.1101/081257)
