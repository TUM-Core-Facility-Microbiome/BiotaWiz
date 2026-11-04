# BiotaWiz & TACTIC documentation

User documentation for BiotaWiz and the TACTIC pipeline, built with [Docusaurus](https://docusaurus.io/).
Published at https://tum-core-facility-microbiome.github.io/BiotaWiz/.

The pages are Markdown files in `docs/`. The sidebar is generated from the folder structure
(`_category_.json` and `sidebar_position` set the order).

## Preview while writing

With Docker only (nothing else installed):

```bash
cd docs
./docusaurus_docker_run.sh      # http://localhost:30000/BiotaWiz/
```

With Node.js 18+ installed:

```bash
cd docs
npm ci
npm start                       # http://localhost:3000/BiotaWiz/
```

## Check before pushing

```bash
npm run typecheck && npm run build && npm run serve
```

`build` fails on broken internal links, so a successful build means every link resolves.

## Publishing

Pushing changes under `docs/` to `main` runs `.github/workflows/deploy-docs.yml`, which builds the
site and deploys it to GitHub Pages. Do not use `npm run deploy`.

## Example "Output files explanation" pages

`static/examples/Analysis_example/` holds the explanation pages TACTIC writes into every results folder.
They are generated from the pipeline code. To refresh them after the pipeline changes:

```bash
python3 scripts/generate_output_explanations.py /path/to/TACTIC-Pipeline
```

## Screenshots

`SCREENSHOTS.md` lists every screenshot the GUI pages expect, with the file name to save it under.
