---
title: 4. Prepare your data
---

# 4. Prepare your data

:::info You will need
- The FASTQ files from your sequencing provider
- If you used a spike-in standard: the weight of each sample and the amount of spike-in added
:::

## One folder for the study

Put all FASTQ files you want to analyse together into **one folder** on a local disk. Sub-folders are fine. This
folder is called the **base directory**: BiotaWiz searches it for FASTQ files and writes the results into it.

```text
MyStudy/                        ← base directory
├── Run_2025_01/
│   ├── Mouse01_S1_L001_R1_001.fastq.gz
│   ├── Mouse01_S1_L001_R2_001.fastq.gz
│   ├── Mouse02_S2_L001_R1_001.fastq.gz
│   └── Mouse02_S2_L001_R2_001.fastq.gz
└── Run_2025_02/
    ├── Mouse03_R1.fastq.gz
    └── Mouse03_R2.fastq.gz
```

:::warning Only combine samples sequenced with the same primers
All samples in one analysis must target the same 16S region (for example V3–V4). Analyse samples with different
primers separately.
:::

## File types BiotaWiz recognises

- Extensions: `.fastq`, `.fq`, `.fastq.gz`, `.fq.gz`. `.gz` means the file is compressed; you don't need to unpack
  it. Upper case is fine for `FASTQ`/`FQ`, but `.gz` must be lower case. Other compression formats (`.zip`,
  `.zst`) are not supported.
- The file must be a real FASTQ file: its first character is `@`. Empty files and FASTA files are skipped.
  See [File formats › FASTQ](../reference/reference-file-formats#fastq).
- Quality values must use the standard Illumina encoding (Phred+33), which all current sequencers produce.

## How BiotaWiz finds read pairs

With **paired-end** sequencing, each sample has two files: **R1** (read from the forward primer) and **R2**
(read from the reverse primer). BiotaWiz pairs them by name. The two names must be identical except for the
part that marks forward and reverse:

| Pattern | Example forward file | Example reverse file |
|---|---|---|
| `R1` / `R2` | `Mouse01_S1_L001_R1_001.fastq.gz` | `Mouse01_S1_L001_R2_001.fastq.gz` |
| `read1` / `read2` | `Mouse01.read1.fq.gz` | `Mouse01.read2.fq.gz` |
| `forward` / `reverse` | `Mouse01-forward.fastq` | `Mouse01-reverse.fastq` |
| `_1` / `_2` at the end | `Mouse01_1.fastq.gz` | `Mouse01_2.fastq.gz` |
| `F` / `R` at the end | `Mouse01_F.fastq.gz` | `Mouse01_R.fastq.gz` |
| `_F_` / `_R_` before a number | `Mouse01_F_001.fastq.gz` | `Mouse01_R_001.fastq.gz` |
| `@F` / `@R` | `Mouse01@F.fastq.gz` | `Mouse01@R.fastq.gz` |

Rules that matter in practice:
- The marker must be separated from the rest of the name by `_`, `-` or `.` (except `@F`/`@R`). Upper and lower case both work.
- `_1`/`_2` and `F`/`R` count only **directly before the extension**: `Sample-1.fq` is *not* a forward file.
- `_F_`/`_R_` count only when followed by a three-digit number such as `_001`.
- If a name contains several markers, the **rightmost** one counts.
- R1 and R2 must be in the **same folder**.

### Sample names

The sample name is everything **before** the marker. For `Mouse01_S1_L001_R1_001.fastq.gz` it is
`Mouse01_S1_L001`. Every sample needs a different name. Avoid two situations:
- **Mixed naming schemes:** `X_R1.fastq` and `X_1.fastq` both become sample `X`.
- **Split files:** `B2_S2_L001_R1_001.fastq` and `B2_S2_L001_R1_002.fastq` both become `B2_S2_L001`. Join the parts
  into one file per direction first (on Linux, `cat part1.fastq.gz part2.fastq.gz > joined.fastq.gz`).

### Single-end files

A file that has no partner is treated as **single-end** (only one read per DNA fragment). That is fine if you
really sequenced single-end. If you expected pairs, rename the files to one of the patterns above.
Don't put a **reverse** marker (`R2`, `_2` …) in single-end file names: a reverse file without a forward partner
is ignored.

:::note TACTIC versions before 1.0.0
Older pipeline versions recognise fewer patterns (`_R1_`/`_R2_`, `_F_`/`_R_`, `_R1`/`_R2`, `@F`/`@R`, `_1`/`_2`),
only in the exact case shown, and only with lower-case extensions.
:::

## Folders BiotaWiz ignores

BiotaWiz skips anything it created itself in earlier runs:
- folders whose name contains `__processed` (one per sample, created during processing), and
- folders whose name starts with `Analysis_` (results of earlier runs).

You don't need to move them away. If you **rerun** the same base directory, samples that already have a complete
`__processed` folder are not processed again. This saves time. See [Reset levels](10-reset-environment.md#level-4)
if you want them processed again.

## Next step

[5. Run the analysis wizard](06-run-wizard.md)
