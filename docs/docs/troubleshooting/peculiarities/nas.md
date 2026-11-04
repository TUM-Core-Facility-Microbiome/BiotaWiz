---
id: troubleshooting-peculiarities-nas
title: Network drives and cloud folders
---

# Network drives and cloud folders

**Symptoms:** the analysis is very slow, stops with file errors, samples go missing, or results are incomplete,
while the same data works on another computer.

**Cause:** the base directory is on a network drive (NAS, a mapped drive such as `Z:\`, `\\server\share`) or in a
folder that is synchronised to the cloud (OneDrive, Dropbox, Google Drive, Nextcloud). TACTIC reads and writes
many thousands of files. Over a network this is slow. On top of that, sync clients lock or move files while
TACTIC is still using them. On Windows, WSL2 reaches such drives through an extra translation layer, which makes
it worse.

**Fix:** run the analysis on a local disk.

1. Copy the FASTQ files from the network drive to a local folder, for example `C:\Data\MyStudy` or
   `/home/me/MyStudy`.
2. Pause cloud synchronisation for that folder, or choose a folder that is not synchronised.
3. Run the analysis there.
4. When it has finished, copy the `Analysis_…` folder (and, if you want to keep them, the `__processed` folders)
   back to the network drive for archiving.
