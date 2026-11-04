---
id: kb-pipelines-tic
title: TIC
sidebar_position: 4
---

# Taxonomy Informed Clustering (TIC)

**In one sentence:** TIC first names each [zOTU](kb-pipelines-zotu) with SILVA, then clusters zOTUs only
**within** the same known taxon. Unknown bacteria are grouped into new family-, genus- and species-level units.

TIC is the **default** in TACTIC and the recommended choice for most studies.

## How it works

1. TACTIC creates zOTUs and assigns each a taxonomy with SINA and the SILVA database.
2. Where SILVA cannot name a rank below *order*, TIC marks it as unknown.
3. TIC fills the gaps step by step, always clustering only inside the known parent group:
   - zOTUs of a known **order** with unknown family are clustered at **90 %** → new families, **FOTUs**.
   - zOTUs of a known family with unknown genus are clustered at **95 %** → new genera, **GOTUs**.
   - zOTUs of a known genus are clustered at **98.7 %** → species-level units, **SOTUs**.
4. The result is a table of SOTUs (`SOTUs-Table-TIC.tab`), each with a complete taxonomy down to species level,
   in `TIC_Pipeline/`. The `Map-…` files show which zOTUs belong to which SOTU, GOTU and FOTU.

```text
Order: Lachnospirales
└── Family: Lachnospiraceae (known)
    ├── Genus: Blautia (known) ──98.7 %──▶ SOTU1, SOTU2 …
    └── Genus: unknown ──95 %──▶ GOTU1 ──98.7 %──▶ SOTU7 …
```

## Why this helps

- Two zOTUs from different genera are **never** merged, even if they are very similar.
- Sequences that belong together (e.g. gene copies of one species) are grouped, which reduces
  [diversity inflation](kb-pipelines-zotu#strengths-and-limitations).
- Novel bacteria that SILVA doesn't know still get a consistent place in the taxonomy (e.g. `GOTU12`), so they
  can be counted and compared.

## Settings

| Setting | Default | Meaning |
|---|---|---|
| `family_sim` | 0.90 | Similarity for creating new families |
| `genus_sim` | 0.95 | Similarity for creating new genera |
| `species_sim` | 0.987 | Similarity for species-level units |

Keep the order species ≥ genus ≥ family.

**References:**
- Lagkouvardos I., et al. (2022). Taxonomy informed clustering, an optimized method for purer and more
  informative clusters in diversity analysis and microbiome profiling. *Frontiers in Bioinformatics* 2:864597.
  [doi:10.3389/fbinf.2022.864597](https://doi.org/10.3389/fbinf.2022.864597)
- [ticlust Python package](https://pypi.org/project/ticlust/)
