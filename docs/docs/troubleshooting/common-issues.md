---
id: troubleshooting-common-issues
title: Common issues
sidebar_position: 1
---

# Common issues

Find your symptom, then follow the fix. If an error **code** is shown, see [Error codes](troubleshooting-error-codes).

## "Could not connect to the backend!" {#backend}

**Cause:** BiotaWiz cannot reach WSL2 (Windows) or Docker (Linux).

**Fix:**
- **Windows:** run `wsl --status` in PowerShell. If WSL is missing, [install it](../getting-started/02-install-windows.md#step-1-install-wsl2)
  and restart. If it says virtualisation is disabled, ask IT to switch on VT-x/AMD-V in the BIOS.
- **Linux:** run `docker run hello-world`.
  - *Cannot connect to the Docker daemon*: start Docker with `sudo systemctl start docker`.
  - *permission denied*: add yourself to the docker group (`sudo usermod -aG docker $USER`), then log out and in.
- Check **Settings › Backend** and click **Reset to Default Backend**. See [Reset level 3](../getting-started/10-reset-environment.md#level-3).

## The pipeline download fails or stops {#download}

**Symptoms:** error **DOCPIF**, **RASMIS**, or a download that never finishes.

**Fix:**
1. Check your internet connection and try again.
2. [Reset level 1](../getting-started/10-reset-environment.md#level-1) (clear download cache), then
   [level 2](../getting-started/10-reset-environment.md#level-2) (delete the installed pipeline).
3. If a specific version fails, set **Settings › Environments › TACTIC Pipeline › Update strategy** to
   **auto-update to latest version every run**.

## No internet inside WSL / VPN problems {#vpn}

**Symptoms:** the banner **"WSL has no internet access, although Windows has."**, or error 172 (SILVA could not
be downloaded).

**Cause:** VPN clients (Cisco AnyConnect, GlobalProtect, Zscaler …) and some firewalls block network traffic from
WSL2 while Windows itself still works.

**Fix:**
- Disconnect the VPN for the **first** run, so the pipeline and SILVA can download. Later runs work offline.
- Or ask IT to allow WSL2 traffic. Microsoft describes the *mirrored networking* setting for this case in its
  [WSL networking guide](https://learn.microsoft.com/en-us/windows/wsl/networking).

## Samples are missing or not paired {#samples}

**Symptoms:** a sample doesn't appear in the **Samples** step, or R1 and R2 appear as two separate samples.

**Fix:**
- Check the extension: `.fastq`, `.fq`, `.fastq.gz` or `.fq.gz`. `.gz` must be lowercase; `.zip` and other
  compression formats are not supported.
- Check the names: R1 and R2 must be in the **same folder** and named with one of the
  [supported patterns](../getting-started/05-prepare-your-data.md#how-biotawiz-finds-read-pairs).
- A file is skipped if it is empty or not FASTQ (its first character is not `@`).
- Files in folders containing `__processed` or starting with `Analysis_` are ignored on purpose.
- Two files that would get the same sample name (for example a sample split into `_001` and `_002` parts) clash.
  Join the parts into one file per direction first.

## Some samples failed (IMNPREC, IMNPREA) {#failed-samples}

**Typical causes:**
- **Too few reads.** Compare the file size with the other samples. Much smaller files usually contain too few
  reads to pass the filters.
- **Low read quality.** If the size is normal, the reads may be of poor quality and are removed by the quality filter.
- **Wrong primer trimming or unusual amplicon length.** Check
  [stripleft/stripright](../getting-started/08-parameters.md#primer-trimming-stripleft-and-stripright) and the merged
  read length limits.
- **Samples from different primer pairs** in the same run.

The failed samples are listed in `Missed_samples.txt` in your base directory. For each sample,
`<sample>__processed/reads_report.txt` shows at which step the reads were lost.

## The run fails with "out of memory" (USEARCHMEM, exit code 137) {#memory}

**Fix:**
- Lower the **Number of CPU threads** in the [Parameters](../getting-started/08-parameters.md#number-of-cpu-threads) step.
- Close other programs.
- Windows: WSL2 may use only part of your RAM. Create or edit the file `%UserProfile%\.wslconfig`:
  ```ini
  [wsl2]
  memory=12GB
  ```
  Then run `wsl --shutdown` in PowerShell and start BiotaWiz again.

## The mapping file is not accepted or numbers look wrong {#mapping}

BiotaWiz does not check the mapping file; TACTIC reads it as it is. Check:
- Sample IDs were not changed. (Excel can silently change IDs such as `1E5` or `MAR1` into numbers or dates.)
- Numbers have no units and no empty cells.
- If you edit the `.csv` version yourself, the columns must be separated by **tabs**, not commas or semicolons.
  See [TSV files](../reference/reference-file-formats#tsv).

## Everything is very slow, or random files are missing {#nas}

You are probably working on a network drive or a cloud-synchronised folder. See
[Network drives](peculiarities/troubleshooting-peculiarities-nas).

## Still stuck?

Ask in [GitHub Discussions](https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/discussions) or open an
[issue](https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/issues). Attach `Pipeline_log.txt` from your
base directory and say which BiotaWiz version you use (shown in **Settings › About**).
