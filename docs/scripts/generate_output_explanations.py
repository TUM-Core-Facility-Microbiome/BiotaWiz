#!/usr/bin/env python3
"""Generate example "Output files explanation.html" pages for the documentation.

TACTIC writes one of these pages into every results folder. This script runs the pipeline's own
code to produce them, so the tutorial shows exactly what users get.

Usage: python3 scripts/generate_output_explanations.py /path/to/TACTIC-Pipeline
Output: static/examples/Analysis_example/ (relative to the docs folder)
"""
import shutil
import subprocess
import sys
from pathlib import Path

PIPELINES = ["otu", "zotu", "tac", "tic", "picrust2", "shared"]
EXPLANATION = "Output files explanation.html"
BANNER = (
    '<div style="background:#fff4ce;color:#3d2e00;border-bottom:1px solid #e0c060;'
    'padding:10px 16px;font:14px/1.4 system-ui,sans-serif">'
    "<strong>Example page.</strong> In your own results this page is in "
    "<code>Analysis_&lt;date&gt;_&lt;time&gt;/{folder}</code>, and its <em>Open</em> buttons open "
    "your files. Generated from TACTIC {version}.</div>"
)


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    pipeline_repo = Path(sys.argv[1]).resolve()
    out_dir = Path(__file__).resolve().parent.parent / "static" / "examples" / "Analysis_example"

    sys.path.insert(0, str(pipeline_repo))
    from tactic_pipeline.analysis.analysis_helper import write_all_pipeline_readmes

    version = subprocess.run(
        ["git", "-C", str(pipeline_repo), "describe", "--tags", "--always"],
        capture_output=True, text=True, check=False,
    ).stdout.strip() or "unknown version"

    if out_dir.exists():
        shutil.rmtree(out_dir)
    # Twice: the root page links to a sub-folder page only if that page already exists.
    for _ in range(2):
        written = write_all_pipeline_readmes(str(out_dir), PIPELINES)

    for page in map(Path, written):
        folder = page.parent.relative_to(out_dir).as_posix()
        folder = "" if folder == "." else folder + "/"
        html = page.read_text(encoding="utf-8")
        banner = BANNER.format(folder=folder, version=version)
        html = html.replace("<body>", "<body>" + banner, 1) if "<body>" in html else banner + html
        page.write_text(html, encoding="utf-8")
        print(page.relative_to(out_dir.parent))


if __name__ == "__main__":
    main()
