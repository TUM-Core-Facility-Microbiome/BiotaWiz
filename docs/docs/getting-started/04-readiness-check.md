---
title: 3. Check that BiotaWiz is ready
---

# 3. Check that BiotaWiz is ready

:::info You will need
BiotaWiz installed ([Windows](02-install-windows.md) or [Linux](03-install-linux.md)).
:::

Before your first analysis, go through these three checks. Each one shows something visible in BiotaWiz.

:::note Where is "Settings"?
Click the **Settings** (gear) icon at the bottom of the left sidebar, or use the menu **Window › Settings**.
In this tutorial, *Settings › Backend* means: open Settings, then click **Backend** in its left-hand list.
:::

## Check 1: The backend is connected

The **backend** is the part of your computer that actually runs the pipeline: WSL2 on Windows, Docker on Linux.
When BiotaWiz starts, it shows the backend status on the home screen:

| You see | Meaning | What to do |
|---|---|---|
| 🔵 **Checking backend...** | BiotaWiz is contacting WSL2/Docker. | Wait a few seconds. |
| 🟢 **Backend connected** | Everything is fine. The analysis cards (TIC, TAC, De Novo) appear. | Continue with check 2. |
| 🟠 **Could not connect to the backend!** | WSL2/Docker is missing or not running. The analysis cards stay hidden. | See below. |

{/* SCREENSHOT: home-backend-connected.png – home screen with "Backend connected" and the three analysis cards */}

<details>
<summary><b>"Could not connect to the backend!": how to fix it</b></summary>

- **Windows:** make sure WSL2 is installed and that you restarted the computer afterwards. Run `wsl --status` in
  PowerShell; it should say `Default Version: 2`. See [Install on Windows](02-install-windows.md).
- **Linux:** make sure Docker is running (`sudo systemctl start docker`) and that your user is in the `docker`
  group (`groups` should list `docker`; if not, see [Install on Linux](03-install-linux.md) and log out/in).
- Check which backend BiotaWiz uses: **Settings › Backend**. On Windows choose *WSL2* (recommended)
  or *Docker*; on Linux only *Docker* works. **Reset to Default Backend** restores the normal choice.
- Restart BiotaWiz.

More help: [Common issues](../troubleshooting/troubleshooting-common-issues#backend).
</details>

## Check 2: Internet access (first run only)

BiotaWiz checks whether it can reach the SILVA database server, both from your computer and, on Windows, from
inside WSL2. If something is wrong, a banner appears on the home screen:

| Banner | Meaning |
|---|---|
| No banner | Internet works. |
| 🟡 **Yellow** | No internet, but a SILVA database is already on your computer. **You can still run analyses.** |
| 🔴 **Red** | No internet and no SILVA database yet. The first analysis will fail with error 172 until internet works. |

The banner title tells you where the problem is:
- **"No internet connection."**: your computer is offline.
- **"WSL has no internet access, although Windows has."**: Windows is online but WSL2 is not. This is often
  caused by a VPN. See [Common issues › VPN](../troubleshooting/troubleshooting-common-issues#vpn).

## Check 3: A pipeline version is selected

Click the card of the analysis you want (for example **Taxonomy Informed Clustering (TIC)**). The first step,
**Base**, shows which TACTIC version will be used:

- ✅ `TACTIC pipeline version: v1.x.x (latest compatible version)`, or `(pinned version)` if you chose a fixed
  version (see below). Ready.
- ❌ `Could not select a TACTIC pipeline version: …` with a **Retry** button. BiotaWiz could not reach GitHub to
  look up versions. Check your internet connection and click **Retry**. If GitHub says the *rate limit* was
  reached, wait the time shown and retry. See [RAPIOF](../troubleshooting/troubleshooting-error-codes#rapiof).

{/* SCREENSHOT: base-step-version.png – Base step showing "TACTIC pipeline version: vX (latest compatible version)" */}

The pipeline itself is downloaded when you start the first run. On WSL2, BiotaWiz verifies the download with a
checksum (SHA-256, a digital fingerprint of the file), so a broken download is noticed and downloaded again.

:::tip Reproducible results: pin the version
By default BiotaWiz uses the newest compatible TACTIC version. To use the same version for a whole study, open
**Settings › Environments › TACTIC Pipeline**, and under **Update strategy** choose
**always use version X**.
:::

## All three checks passed?

You are ready. Continue with [4. Prepare your data](05-prepare-your-data.md).
