"""
Generates expected-v1.json: the results of the TACTIC pipeline's own FASTQ discovery code for the fixture tree in
tree.json. The tests in test/jest/unit/fastqDiscovery.test.ts compare src/utils/fastqDiscovery.ts against them.

Run it with the Python version of the pipeline image (3.12) and the pipeline sources of the version to compare with:

  docker run --rm --entrypoint python3 -w /tmp \
    -v <pipeline checkout>/tactic_pipeline:/pipeline/tactic_pipeline:ro \
    -v <pipeline checkout>/run_tactic.py:/pipeline/run_tactic.py:ro \
    -v <this directory>:/fixture:ro \
    ghcr.io/mpourjam/tactic-pipeline:<version> /fixture/generate.py /pipeline <pipeline commit> > expected-v1.json
"""
import ast
import base64
import gzip
import json
import os
import sys
import tempfile
import types
from pathlib import Path, PurePath

FASTQ = b"@r1\nACGT\n+\nIIII\n"
FASTA = b">r1\nACGT\n"

# exported to expected-v1.json ("content"), so the tests build the tree from the same bytes
CONTENT = {
    "fastq": FASTQ,
    "fastq-gz": gzip.compress(FASTQ, mtime=0),
    "fastq-crlf": FASTQ.replace(b"\n", b"\r\n"),
    "fastq-gz-truncated": gzip.compress(FASTQ * 500, mtime=0)[:40],
    "fastq-gz-truncated-header": gzip.compress(FASTQ * 500, mtime=0)[:14],
    "fasta": FASTA,
    "fasta-gz": gzip.compress(FASTA, mtime=0),
    "non-ascii-header": "@rëad\nACGT\n+\nIIII\n".encode("utf-8"),
    "empty": b"",
    "zst": bytes([0x28, 0xB5, 0x2F, 0xFD, 0x00, 0x58, 0x61, 0x00, 0x00]),
    "invalid-utf8-early": b"@r1\nACGT\n+\n\xff\xfe\n",
    "invalid-utf8-late": b"@r1\n" + b"A" * 9000 + b"\n\xff\n",
    "text": b"not a sequence file\n",
}


def build_tree(base: Path, spec: dict):
    for relative, kind in spec["files"]:
        file = base / relative
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(CONTENT[kind])
    for relative, target in spec["symlinks"]:
        link = base / relative
        link.parent.mkdir(parents=True, exist_ok=True)
        os.symlink(target, link)


def load_pipeline(pipeline: Path):
    sys.path.insert(0, str(pipeline))
    try:
        import zstandard  # noqa: F401
    except ImportError:
        # only needed for SILVA downloads, which are not used here
        sys.modules["zstandard"] = types.ModuleType("zstandard")
    from tactic_pipeline import processing_helper

    # is_in_processed_dir from run_tactic.py, without running the script
    module = ast.parse((pipeline / "run_tactic.py").read_text())
    function = next(node for node in module.body
                    if isinstance(node, ast.FunctionDef) and node.name == "is_in_processed_dir")
    suffix = next(ast.literal_eval(node.value) for node in module.body
                  if isinstance(node, ast.Assign) and any(getattr(t, "id", None) == "PROC_DIR_SUFFIX" for t in node.targets))
    namespace = {"Path": Path, "PurePath": PurePath, "PROC_DIR_SUFFIX": suffix, "proc_helper": processing_helper}
    exec(compile(ast.Module(body=[function], type_ignores=[]), "run_tactic.py", "exec"), namespace)
    return processing_helper, namespace["is_in_processed_dir"]


def main():
    pipeline = Path(sys.argv[1])
    commit = sys.argv[2] if len(sys.argv) > 2 else "unknown"
    ph, is_in_processed_dir = load_pipeline(pipeline)
    spec = json.loads(Path(__file__).with_name("tree.json").read_text(encoding="utf-8"))

    with tempfile.TemporaryDirectory() as temp:
        base = (Path(temp) / "inputs").resolve()
        build_tree(base, spec)

        def relative(file) -> str:
            return Path(file).relative_to(base).as_posix() if file else ""

        # as run_tactic.py does without a mapping file
        pairs = ph.pair_seq_files(str(base))
        pairs = [pair for pair in pairs if not is_in_processed_dir(pair[0]) and not is_in_processed_dir(pair[1])]

        # resolve the samples BiotaWiz writes to the mapping file, as run_tactic.py does with a mapping file
        claimed = set()
        mapping = []
        for forward, reverse in pairs:
            parent = Path(forward).parent.relative_to(base).as_posix()
            parent = "" if parent == "." else parent
            sample_id = ph.get_base_name(Path(forward))
            found = ph.find_fastq_pair_for_sample(sample_id, parent, base_fastq_dir=base, claimed_files=claimed)
            if found[0]:
                claimed.add(str(found[0]))
                if found[1]:
                    claimed.add(str(found[1]))
            mapping.append({
                "sample_id": sample_id,
                "parent_path": parent,
                "pair": [relative(forward), relative(reverse)],
                "resolved": [relative(found[0]), relative(found[1])],
            })

        is_seq_file = {}
        for directory, _, files in os.walk(base):
            for name in files:
                file = Path(directory) / name
                is_seq_file[relative(file)] = ph.is_seq_file(file, seq_file_format="fastq")

    result = {
        "generator": "test/fixtures/fastq-discovery/generate.py",
        "pipeline_commit": commit,
        "python": sys.version.split()[0],
        "pairs": [[relative(forward), relative(reverse)] for forward, reverse in pairs],
        "base_names": {relative(forward): ph.get_base_name(Path(forward)) for forward, _ in pairs},
        "mapping": mapping,
        "is_seq_file": dict(sorted(is_seq_file.items())),
        "names": {
            name: {
                "is_fastq_extension": ph.is_fastq_extension(name),
                "base_name": ph.get_base_name(Path("/base/inputs") / name),
                "is_forward": ph.is_forward_file(name),
                "is_reverse": ph.is_reverse_file(name),
                "strip_illumina_suffix": ph.strip_illumina_suffix(name),
            } for name in spec["names"]
        },
        "tokens": {token: ph._predict_reverse_token(token) for token in spec["tokens"]},
        "content": {kind: base64.b64encode(data).decode("ascii") for kind, data in CONTENT.items()},
    }
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
