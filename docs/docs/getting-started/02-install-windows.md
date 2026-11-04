---
title: 2a. Install on Windows
---

# 2a. Install on Windows

:::info You will need
- Windows 10 or 11 (64-bit) and an administrator account (or someone from IT who has one)
- About 20 minutes, including one restart
:::

BiotaWiz runs the TACTIC pipeline inside **WSL2** (*Windows Subsystem for Linux*), a feature built into Windows
that runs Linux programs. You install it once.

## Step 1: Install WSL2

1. Click **Start**, type `PowerShell`, right-click **Windows PowerShell** and choose **Run as administrator**.
2. Type the following command and press **Enter**:
   ```powershell
   wsl --install
   ```
3. Wait until it finishes, then **restart your computer**.
4. To check that it worked, open PowerShell again (normal, not as administrator) and run:
   ```powershell
   wsl --status
   ```
   You should see `Default Version: 2`.

:::tip If `wsl --install` fails
Virtualisation may be switched off in your computer's firmware (BIOS/UEFI). The setting is usually called
*Intel VT-x*, *Intel Virtualization Technology* or *AMD-V / SVM*. Ask your IT department to switch it on.
Microsoft's [WSL installation guide](https://learn.microsoft.com/en-us/windows/wsl/install) has more details.
:::

## Step 2: Download BiotaWiz

Open the [latest BiotaWiz release](https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/releases/latest)
and download the file ending in **`Setup.exe`**.

The installer is not yet signed, so your browser and Windows show warnings. They are expected. Here is how to
continue.

<details>
<summary><b>Your browser says the file is not commonly downloaded</b></summary>

![Download warning in the browser](/img/windows/download_warning.png)

Hover over the download, click the three dots, and choose **Keep**.

![Choose Keep](/img/windows/click_keep.png)

If a second warning appears, click **Show more** and then **Keep anyway**.

![Click Show more](/img/windows/click_show_more.png)
![Click Keep anyway](/img/windows/click_keep_anyway.png)
</details>

## Step 3: Run the installer

Double-click the downloaded `Setup.exe`.

<details>
<summary><b>Windows SmartScreen says "Windows protected your PC"</b></summary>

Click **More info** and then **Run anyway**.

![Click More info](/img/windows/click_more.png)
![Click Run anyway](/img/windows/click_run_anyway.png)
</details>

The installer installs BiotaWiz and starts it. Later you can find **BiotaWiz** in the Start menu.

:::note Docker Desktop instead of WSL2
BiotaWiz uses WSL2 by default. If you already use Docker Desktop and prefer it, you can switch later in
**Settings › Backend**. Most users should keep WSL2.
:::

## Next step

[3. Check that BiotaWiz is ready](04-readiness-check.md)
