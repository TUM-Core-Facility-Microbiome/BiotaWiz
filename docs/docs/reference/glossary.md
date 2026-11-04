---
id: reference-glossary
title: Glossary of terms and abbreviations
sidebar_position: 1
---

# Glossary of terms and abbreviations

Terms are sorted alphabetically within each group.

## Sequencing and biology

| Term | Meaning |
|---|---|
| **16S rRNA gene** | A gene (about 1,500 bases) that every bacterium and archaeon carries. Parts of it are the same in all of them (*conserved regions*), other parts differ between groups (*variable regions*, V1–V9). This makes it a "barcode" for identifying bacteria. |
| **Amplicon** | The piece of DNA copied by PCR, e.g. the V3–V4 region of the 16S gene. *Amplicon sequencing* sequences only this piece. |
| **bp** | *Base pairs*: the unit of DNA length. A 460 bp amplicon is 460 bases long. |
| **Demultiplexing** | Sorting the reads of a sequencing run into one file (or pair of files) per sample, using the sample barcodes. Usually done by the sequencing provider. |
| **Forward / reverse primer** | The two short DNA pieces that start the PCR at each end of the amplicon. Example: 341F (forward) and 785R (reverse). |
| <span id="iupac"></span>**IUPAC codes** | One-letter codes for "one of several bases", used in primers that should match several bacteria: `R` = A/G, `Y` = C/T, `S` = G/C, `W` = A/T, `K` = G/T, `M` = A/C, `B` = C/G/T, `D` = A/G/T, `H` = A/C/T, `V` = A/C/G, `N` = any base. |
| **Low biomass** | Samples with very few bacteria (e.g. tissue, skin swabs). They are sensitive to contamination and may give few reads. |
| **Paired-end** | Each DNA fragment is read from both ends. That gives two files per sample: **R1** (forward read) and **R2** (reverse read). TACTIC *merges* each R1/R2 pair into one longer sequence. |
| **Phred quality score (Q)** | A number per base that says how sure the sequencer is: Q = −10·log₁₀(error probability). Q20 = 1 % error chance, Q30 = 0.1 %. |
| **Read** | One sequence produced by the sequencer. |
| **Single-end** | Each fragment is read from one end only, so there is one file per sample. |
| **Spike-in standard** | A known amount of artificial DNA added to each sample before DNA extraction. It makes it possible to calculate **absolute** abundances (cells per gram). See [Spike-in and the mapping file](../getting-started/07-mapping-file.md). |
| **V3–V4** | Variable regions 3 and 4 of the 16S gene; the region amplified by the default primers 341F/785R. |

## Analysis results

| Term | Meaning |
|---|---|
| **Abundance (relative / absolute)** | *Relative*: share of reads in a sample (e.g. 20 %). *Absolute*: amount per gram of sample, only available with a spike-in. |
| **Alpha diversity** | Diversity *within* one sample: how many different bacteria (**richness**) and how evenly they are spread (e.g. Shannon index). |
| **Beta diversity** | How different two samples are, given as a distance between 0 (identical) and 1 (nothing shared). Common measures: **Jaccard** (which taxa are present), **Bray-Curtis** (taxa and their abundances), and **UniFrac** (also uses the phylogenetic tree, so closely related taxa count as similar). See [Which pipeline and which files?](../knowledge-base/kb-choosing-a-pipeline). |
| **Clustering** | Grouping similar sequences into one unit (e.g. all sequences that are ≥ 97 % identical). |
| **Denoising** | Removing sequencing errors so that only true biological sequences remain. TACTIC uses UNOISE3. |
| **Diversity inflation** | Overestimating the number of different bacteria, e.g. because one bacterium has several slightly different 16S copies. TIC and TAC reduce it. |
| **FOTU / GOTU / SOTU** | Family-, Genus- and Species-level OTU: the units TIC creates at 90 %, 95 % and 98.7 % similarity. |
| **Krona chart** | An interactive, zoomable pie chart of the taxonomic composition (an `.html` file). |
| **Mock community** | A sample mixed from known bacteria in known amounts. Used to test how accurately an analysis method finds the true composition. |
| **Normalisation** | Making samples comparable despite different numbers of reads. TACTIC writes `SampleMinCount_Normalized` (every sample's counts scaled to the total of the smallest sample) and, with spike-ins, `Spike_Normalized` (absolute) tables. |
| **OTU** | *Operational Taxonomic Unit*: a group of sequences that are at least a set percentage identical (classically 97 %). See [OTU](../knowledge-base/description-of-pipelines/kb-pipelines-otu). |
| **Phylogeny-aware / phylogeny-agnostic** | Whether a diversity measure uses the phylogenetic tree (aware, e.g. UniFrac) or treats all taxa as equally different (agnostic, e.g. Jaccard, Bray-Curtis). |
| **Phylogenetic tree** | A tree diagram showing how related the sequences are. Needed for UniFrac distances. TACTIC builds trees with *rapidnj* (`-nj` files). |
| **PICRUSt2** | A tool that predicts the functional potential (genes, pathways) of a community from 16S data. TACTIC prepares its input files. |
| **Rarefying** | Randomly subsampling every sample down to the same number of reads, usually before comparing richness. Tools such as Rhea and Namco can do it. TACTIC's `SampleMinCount_Normalized` tables are *scaled*, not rarefied. |
| **Richness** | The number of different taxa (e.g. species) in a sample. Inflated if one species is split into several units. |
| **TAC** | *Taxonomy Agnostic Clustering*: clustering zOTUs at 98.7 % without using taxonomy. See [TAC](../knowledge-base/description-of-pipelines/kb-pipelines-tac). |
| **Taxonomy** | The classification of an organism: Domain › (Kingdom ›) Phylum › Class › Order › Family › Genus › Species. |
| **TIC** | *Taxonomy Informed Clustering*: clustering that uses taxonomy to create species-, genus- and family-level units. See [TIC](../knowledge-base/description-of-pipelines/kb-pipelines-tic). |
| **zOTU / ASV** | *Zero-radius OTU* / *Amplicon Sequence Variant*: an exact, error-corrected sequence. The finest resolution. See [zOTU](../knowledge-base/description-of-pipelines/kb-pipelines-zotu). |

## Software and databases

| Term | Meaning |
|---|---|
| **Backend** | The part of the computer that runs the pipeline for BiotaWiz: WSL2 or Docker. |
| **Bowtie2** | Program TACTIC uses to find and remove spike-in reads. |
| **CLI** | *Command Line Interface*: running a program by typing commands in a terminal. |
| **Container / image** | A packaged, ready-to-run software environment. The TACTIC *image* contains all programs it needs; running it creates a *container*. |
| **Docker** | Software that runs containers. BiotaWiz uses it on Linux (and optionally on Windows). |
| **FastQC** | Program that creates a quality report for FASTQ files. |
| **GUI** | *Graphical User Interface*: a program with windows and buttons, like BiotaWiz. |
| **SHA-256 / checksum** | A "fingerprint" of a file. If the fingerprint of a download matches the expected one, the file is complete and unchanged. |
| **SILVA** | A curated database of ribosomal RNA sequences with their taxonomy. TACTIC uses it to name your bacteria. |
| **SINA** | The program that compares your sequences with SILVA and assigns taxonomy. |
| **SortMeRNA** | Program that keeps only bacterial/archaeal 16S sequences. |
| **Thread** | One task the processor works on. More threads = more work in parallel, but more memory. |
| **UNOISE3** | The denoising algorithm (part of USEARCH) that creates zOTUs. |
| **UPARSE** | The classic OTU clustering algorithm (part of USEARCH) used for 97 % OTUs. |
| **USEARCH** | A collection of sequence analysis tools; TACTIC uses it for merging, filtering, denoising and clustering. |
| **WSL2** | *Windows Subsystem for Linux, version 2*: a Windows feature that runs Linux programs. BiotaWiz uses it on Windows. |

## Values and placeholders

| Term | Meaning |
|---|---|
| **NaN / nan** | *Not a Number*: means "no value / unknown". Used in the mapping file when no weight is known. |
| **Base directory** | The folder you select in BiotaWiz that contains your FASTQ files; results are written there. |
| **Exit code** | A number a program returns when it ends; 0 means success. See [Error codes](../troubleshooting/troubleshooting-error-codes). |
