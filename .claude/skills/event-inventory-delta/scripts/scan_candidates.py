#!/usr/bin/env python3
"""Scan a repo (optionally limited to specific services) and emit candidate subjects/endpoints.

Usage:
  python scripts/scan_candidates.py --repo . --out tmp/candidates.jsonl
  python scripts/scan_candidates.py --repo . --services contact-api-service,sender-worker --out tmp/candidates.jsonl

See event-inventory-refresh for how to validate findings.
"""

from __future__ import annotations

import argparse
import json
import os
import re
from pathlib import Path
from typing import Iterable, Iterator, Optional

SKIP_DIRS = {
    ".git",
    "node_modules",
    "dist",
    "build",
    "target",
    "vendor",
    "__pycache__",
    ".venv",
    "venv",
}

EXTS = {
    ".ts",
    ".js",
    ".py",
    ".go",
    ".java",
    ".kt",
    ".rs",
    ".proto",
    ".yaml",
    ".yml",
    ".json",
}

PUBLISH_RE = re.compile(r"\b(?:publish|emit|send)\s*\(\s*['\"]([^'\"]+)['\"]")
NC_PUBLISH_RE = re.compile(r"\bnc\.publish\s*\(\s*['\"]([^'\"]+)['\"]")
SUBSCRIBE_RE = re.compile(r"\bsubscribe\s*\(\s*['\"]([^'\"]+)['\"]")
DECORATOR_RE = re.compile(r"@(?:EventPattern|MessagePattern)\(\s*['\"]([^'\"]+)['\"]")
HTTP_DECORATOR_RE = re.compile(r"@(?:Get|Post|Put|Patch|Delete)\(\s*['\"]?([^'\")]+)?")
FASTAPI_RE = re.compile(r"@app\.(get|post|put|patch|delete)\(\s*['\"]([^'\"]+)['\"]")
EXPRESS_RE = re.compile(r"\b(app|router)\.(get|post|put|patch|delete)\(\s*['\"]([^'\"]+)['\"]")

SERVICE_RE = re.compile(r"^\s*service\s+(\w+)")
RPC_RE = re.compile(r"^\s*rpc\s+(\w+)\s*\(")


def _walk_files(repo: Path, allowed_prefixes: Optional[set[str]]) -> Iterator[Path]:
    for root, dirs, files in os.walk(repo):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        root_path = Path(root)

        if allowed_prefixes is not None:
            rel = root_path.relative_to(repo)
            # Only include services/<name>/... when filtered
            if len(rel.parts) >= 2 and rel.parts[0] == "services" and rel.parts[1] in allowed_prefixes:
                pass
            elif len(rel.parts) >= 1 and rel.parts[0] == "services":
                # Under services but not in allowed set
                dirs[:] = []
                continue

        for fn in files:
            p = root_path / fn
            if p.suffix in EXTS:
                yield p


def _emit(out_f, kind: str, value: str, file: Path, line_no: int, snippet: str) -> None:
    out_f.write(
        json.dumps(
            {
                "kind": kind,
                "value": value,
                "file": str(file),
                "line": line_no,
                "snippet": snippet.strip()[:200],
            },
            ensure_ascii=False,
        )
        + "\n"
    )


def scan(repo: Path, out_path: Path, services: Optional[set[str]]) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)

    allowed = services
    with out_path.open("w", encoding="utf-8") as out_f:
        for file in _walk_files(repo, allowed):
            rel = file.relative_to(repo)
            try:
                text = file.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue

            if file.suffix == ".proto":
                svc = None
                for i, ln in enumerate(text.splitlines(), start=1):
                    m = SERVICE_RE.match(ln)
                    if m:
                        svc = m.group(1)
                    m = RPC_RE.match(ln)
                    if m and svc:
                        _emit(out_f, "proto", f"{svc}.{m.group(1)}", rel, i, ln)
                continue

            for i, ln in enumerate(text.splitlines(), start=1):
                for r in (PUBLISH_RE, NC_PUBLISH_RE):
                    m = r.search(ln)
                    if m and "." in m.group(1):
                        _emit(out_f, "publish", m.group(1), rel, i, ln)

                for r in (SUBSCRIBE_RE, DECORATOR_RE):
                    m = r.search(ln)
                    if m and "." in m.group(1):
                        _emit(out_f, "subscribe", m.group(1), rel, i, ln)

                m = FASTAPI_RE.search(ln)
                if m:
                    _emit(out_f, "http", f"{m.group(1).upper()} {m.group(2)}", rel, i, ln)

                m = EXPRESS_RE.search(ln)
                if m:
                    _emit(out_f, "http", f"{m.group(2).upper()} {m.group(3)}", rel, i, ln)

                m = HTTP_DECORATOR_RE.search(ln)
                if m:
                    # NestJS decorators often omit path: @Get()
                    path = m.group(1) if m.group(1) else ""
                    _emit(out_f, "http", f"NEST_ROUTE {path}".strip(), rel, i, ln)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True, help="Path to repository root")
    ap.add_argument("--out", required=True, help="Output JSONL path")
    ap.add_argument(
        "--services",
        default="",
        help="Optional comma-separated service names to restrict scanning to services/<name>/...",
    )
    args = ap.parse_args()

    repo = Path(args.repo).resolve()
    out_path = Path(args.out)
    services = {s.strip() for s in args.services.split(",") if s.strip()} or None

    scan(repo, out_path, services)
    print(f"Wrote candidates to {out_path}")


if __name__ == "__main__":
    main()
