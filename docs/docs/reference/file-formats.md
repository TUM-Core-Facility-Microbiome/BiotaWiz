---
id: reference-file-formats
title: File formats
sidebar_position: 2
---

# File formats

All files TACTIC reads and writes are **plain text** (except `.xlsx`, `.zip` and `.gz`). You can open them with
any text editor, for example Notepad++ on Windows or gedit on Linux.

| Extension | Format | Where you meet it | Open with |
|---|---|---|---|
| `.fastq`, `.fq` (`.gz`) | [FASTQ](#fastq) | Your sequencing data | Text editor (after unpacking `.gz`) |
| `.fasta`, `.fa` | [FASTA](#fasta) | Sequences of OTUs/zOTUs, custom spike-ins | Text editor |
| `.tab`, `.csv`, `.tsv` | [TSV](#tsv) | Abundance tables, mapping file | Excel, LibreOffice Calc, R |
| `.xlsx` | Excel workbook | Mapping file while you edit it in BiotaWiz | Excel, LibreOffice Calc |
| `.yml` | [YAML](#yaml) | Pipeline settings (`TACTICPipeline_args.yml`) | Text editor |
| `.tre` | [Newick](#newick) | Phylogenetic trees | iTOL, FigTree, R (ape) |
| `.html` | Web page | Krona charts, *Output files explanation* | Web browser |
| `.txt` | Text | Logs, reports | Text editor |
| `.gz` | gzip compression | Compressed FASTQ | Read directly by TACTIC; unpack with 7-Zip or `gunzip` |

## TSV: tab-separated values {#tsv}

A **TSV** file is a table saved as plain text:
- each **line** is one row;
- the **columns** are separated by a **tab** character (the invisible character the `Tab ⇥` key inserts).

Here is what the mapping file looks like. `→` marks a tab:

```text
#SampleID→total_weight_in_g→spike_amount→parent_path
Mouse01→0.0279→3→Run_2025_01
Mouse02→0.0315→3→Run_2025_01
```

### TSV, CSV, and why TACTIC's TSV files are called ".csv"

- **CSV** (*comma-separated values*) uses commas between columns. In many European versions of Excel, "CSV" actually
  uses **semicolons**, because the comma is the decimal separator there.
- **TSV** uses tabs. Tabs never appear inside numbers or names, so TSV avoids that confusion. TACTIC therefore
  always uses tabs.
- The mapping file is named `.csv` only so that Excel opens it with a double-click. **Inside, it must use tabs.**
- The result tables use `.tab`. They are TSV, too.

### How to tell what separator a file uses

Open the file in a text editor (not Excel):
- Columns line up in wide steps → **tabs** ✅ (in Notepad++: *View › Show Symbol › Show All Characters* shows
  tabs as `→`).
- You see `,` or `;` between the values → **comma/semicolon** ❌ for TACTIC.

### Saving a TSV file yourself (command line users)

BiotaWiz writes the mapping file for you. If you prepare one for the [command line](../cli/cli.md):

- **Excel:** *File › Save As* › file type **Text (Tab delimited) (*.txt)**. Then rename the file to
  `mapping_file.csv` if you like; the name doesn't matter, the tabs do.
- **LibreOffice Calc:** *File › Save As* › **Text CSV (.csv)** › tick *Edit filter settings* › choose **Field delimiter:** `{Tab}`.

### Common pitfalls with spreadsheets

- **Decimal comma:** write `0.0279`, not `0,0279`. TACTIC tolerates the comma, but other tools may not.
- **Auto-formatting:** Excel turns some sample names into numbers or dates (`1E5` → `100000`, `MAR1` → `1-Mar`).
  Format the ID column as *Text* before typing, and check the IDs after saving.
- **Header:** the first line must start with `#SampleID`. Keep the column names exactly as given.
- **No extras:** no empty rows in between, no merged cells, no units in cells, only one sheet.

## FASTQ {#fastq}

The raw output of the sequencer. Each read takes **four lines**:

```text
@M01234:56:000000000-ABCDE:1:1101:15589:1331 1:N:0:1     ← 1. name, always starts with @
CCTACGGGAGGCAGCAGTGGGGAATATTGCACAATGGGCGAAAGCCTGATGCAG   ← 2. the DNA sequence
+                                                         ← 3. separator
CCCCCGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG   ← 4. one quality character per base
```

Each quality character encodes a [Phred score](glossary.md#sequencing-and-biology): `G` ≈ Q38 (very good),
`#` = Q2 (very bad). TACTIC expects the usual Illumina encoding (Phred+33). Files ending in `.gz` are compressed;
TACTIC reads them directly.

## FASTA {#fasta}

Sequences without quality values. Each entry has a name line starting with `>` and then the sequence:

```text
>Zotu1
TGGGGAATATTGCACAATGGGCGAAAGCCTGATGCAGCGACGCCGCGTGAGGGATGAAGG...
>Zotu2
TAGGGAATCTTCCGCAATGGACGAAAGTCTGACGGAGCAACGCCGCGTGAGTGATGAAGG...
```

## YAML {#yaml}

A readable settings format: `name: value`, with indentation for groups. TACTIC's settings file looks like this
(excerpt):

```yaml
TrimBothSidesArgs:
  stripleft: 17   # forward primer length
  stripright: 21  # reverse primer length
ComplexTICArgs:
  family_sim: 0.90
  genus_sim: 0.95
  species_sim: 0.987
```

Indentation must use **spaces, not tabs**. Text after `#` is a comment.

## Newick trees {#newick}

A tree written as nested brackets, e.g. `((Zotu1:0.01,Zotu2:0.02):0.05,Zotu3:0.07);`. The numbers are branch
lengths. Open `.tre` files in [iTOL](https://itol.embl.de/) or FigTree, or use them for UniFrac in Rhea and Namco.

## Abundance tables (`.tab`) {#tables}

TSV tables with one **row per OTU/zOTU** and one **column per sample**. The cells are read counts, or normalised
values in the `…_Normalized` versions. The last column, `taxonomy`, gives the classification as text separated
by semicolons, e.g. `Bacteria;Bacillota;Clostridia;Lachnospirales;Lachnospiraceae;Blautia;`. The
*Output files explanation* page in each results folder describes every table in detail.
