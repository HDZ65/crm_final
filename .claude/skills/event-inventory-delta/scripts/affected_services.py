#!/usr/bin/env python3
"""Derive affected services from a list of changed files.

Usage:
  python scripts/affected_services.py --repo . --changed-file-list tmp/changed.txt

Prints CSV service names on stdout and writes a JSON summary next to the input file.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--changed-file-list", required=True, help="Text file with one path per line")
    args = ap.parse_args()

    repo = Path(args.repo).resolve()
    lst = Path(args.changed_file_list)
    lines = [ln.strip() for ln in lst.read_text(encoding="utf-8").splitlines() if ln.strip()]

    services_root = repo / "services"
    affected = set()
    other = []

    for p in lines:
        pp = Path(p)
        parts = pp.parts
        if len(parts) >= 2 and parts[0] == "services":
            affected.add(parts[1])
        else:
            other.append(p)

    # Only keep services that exist on disk (if services_root exists)
    if services_root.exists():
        existing = {d.name for d in services_root.iterdir() if d.is_dir()}
        affected = {s for s in affected if s in existing}

    csv = ",".join(sorted(affected))
    print(csv)

    summary = {
        "repo": str(repo),
        "changed_file_list": str(lst),
        "affected_services": sorted(affected),
        "non_service_paths": other,
    }
    out_json = lst.with_suffix(lst.suffix + ".summary.json")
    out_json.write_text(json.dumps(summary, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
