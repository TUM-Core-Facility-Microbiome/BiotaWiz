---
title: 2b. Install on Linux
---

# 2b. Install on Linux

:::info You will need
- A 64-bit Debian-based Linux (Ubuntu, Debian, Linux Mint …) and `sudo` rights
- About 15 minutes
:::

BiotaWiz runs the TACTIC pipeline in **Docker**, a program that runs software in an isolated, ready-made
environment (a *container*).

## Step 1: Install Docker Engine

Install **Docker Engine** (not Docker Desktop) by following the
[official instructions](https://docs.docker.com/engine/install/) for your distribution.
On Ubuntu the short version is:

```bash
sudo apt update
sudo apt install -y docker.io
sudo systemctl enable --now docker
```

## Step 2: Allow your user to use Docker

```bash
sudo usermod -aG docker $USER
```

Then **log out and log back in** (or restart). This step is easy to forget, and BiotaWiz cannot connect to Docker
without it.

To check that it worked, open a terminal and run:

```bash
docker run hello-world
```

You should see `Hello from Docker!`, without having to type `sudo`.

## Step 3: Install BiotaWiz

1. Open the [latest BiotaWiz release](https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/releases/latest)
   and download the file ending in **`.deb`**.
2. Double-click it to open your software installer, or install it in a terminal:
   ```bash
   sudo apt install ./biotawiz_<version>_amd64.deb
   ```
3. Start **BiotaWiz** from your applications menu.

## Next step

[3. Check that BiotaWiz is ready](04-readiness-check.md)
