---
sidebar_position: 1
title: About TACTIC & BiotaWiz
---

# About TACTIC & BiotaWiz

**TACTIC** turns raw 16S rRNA amplicon sequencing reads (FASTQ files) into tables that say which bacteria are in
each of your samples and how abundant they are. It also gives you their taxonomy, phylogenetic trees, interactive
Krona charts and input files for PICRUSt2.

**BiotaWiz** is a desktop program for Windows and Linux that runs TACTIC for you. You click through five steps
instead of typing commands.

```text
Your FASTQ files ──▶ BiotaWiz ──▶ TACTIC pipeline ──▶ Analysis_<date>_<time>/ ──▶ Namco or Rhea
                    (desktop      (runs in WSL2        (tables, taxonomy,         (statistics
                     program)      or Docker)           trees, charts)             and plots)
```

:::tip New here? Start with the step-by-step tutorial
Follow [Getting started](category/getting-started-biotawiz) from top to bottom: requirements → install →
readiness check → prepare data → run → results. Each page takes a few minutes. Words you might not know are
explained in the [Glossary](reference/glossary.md).
:::

## Which analysis should I choose?

TACTIC offers four ways to group sequences. BiotaWiz offers the first three as cards on its home screen.

| Card in BiotaWiz | Short name | What it does | Read more |
|---|---|---|---|
| Taxonomy Informed Clustering (TIC) | TIC | Uses the taxonomy of each sequence to group sequences into species-, genus- and family-level units. **Recommended default.** | [TIC](knowledge-base/description-of-pipelines/kb-pipelines-tic) |
| Taxonomy Agnostic Clustering (TAC) | TAC | Groups sequences that are at least 98.7 % identical, without looking at taxonomy. | [TAC](knowledge-base/description-of-pipelines/kb-pipelines-tac) |
| De Novo Clustering (UPARSE OTU clustering) | OTU | Classic 97 % OTU clustering, comparable to older studies. | [OTU](knowledge-base/description-of-pipelines/kb-pipelines-otu) |
| *(always produced)* | zOTU | Exact, error-corrected sequence variants. TIC and TAC are built on them. | [zOTU](knowledge-base/description-of-pipelines/kb-pipelines-zotu) |

Not sure? [Which pipeline and which files?](knowledge-base/choosing-a-pipeline.md) gives concrete advice per research question.

## Two ways to run TACTIC

| | **BiotaWiz (desktop program)** | **TACTIC command line** |
|---|---|---|
| For whom | Anyone; no programming needed | Bioinformaticians, servers, compute clusters |
| How | Point and click, five steps | `docker run …` in a terminal |
| Runs on | Windows 10/11 (WSL2 or Docker), Linux (Docker) | Any system with Docker |
| Start here | [Getting started](category/getting-started-biotawiz) | [TACTIC CLI](cli/cli.md) |

Both use the same TACTIC pipeline and give the same results.

## Getting help

- Something went wrong? See [Common issues](troubleshooting/troubleshooting-common-issues) and
  [Error codes](troubleshooting/troubleshooting-error-codes).
- Questions: [GitHub Discussions](https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/discussions)
- Bugs: [GitHub Issues](https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/issues)
- Which version do I have, what is new? See [Versions and what changed](getting-started/11-versions-and-changes.md).
