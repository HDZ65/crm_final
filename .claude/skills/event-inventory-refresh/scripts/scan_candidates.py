#!/usr/bin/env python3
"""Scan a repo and emit candidate subjects/endpoints for manual cataloging.

This is intentionally heuristic: it helps you find likely events/commands (NATS subjects)
and likely endpoints (HTTP decorators, proto RPCs). You must still validate by reading
code and attaching evidence.

Usage:
  python scripts/scan_candidates.py --repo . --out tmp/candidates.jsonl

Output JSONL schema (one line per match):
  {
    "kind": "publish|subscribe|http|proto",
    "value": "contact.created" | "GET /contacts" | "ContactService.GetContact",
    "file": "services/...",
    "line": 123,
    "snippet": "..."
  }
"""

from __future__ import annotations

import argparse
import json
import os
import re
from pathlib import Path
from typing import Iterable, Iterator, List, Tuple


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
    ".idea",
    ".next",
}

TEXT_EXTS = {
    ".ts",
    ".tsx",
    ".js",
    ".mjs",
    ".cjs",
    ".py",
    ".go",
    ".rs",
    ".java",
    ".kt",
    ".proto",
    ".yaml",
    ".yml",
    ".json",
}

# NATS subjects: at least one dot, mostly lowercase-ish, allow underscore.
SUBJECT_RE = r"([a-zA-Z0-9][a-zA-Z0-9_]*\.[a-zA-Z0-9_.>-]+)"

PUBLISH_PATTERNS: List[Tuple[str, re.Pattern]] = [
    ("publish", re.compile(r"\b(?:publish|emit|send)\s*\(\s*['\"]" + SUBJECT_RE + r"['\"]")),
    ("publish", re.compile(r"\bnc\.publish\s*\(\s*['\"]" + SUBJECT_RE + r"['\"]")),
    ("publish", re.compile(r"\bjs\.publish\s*\(\s*['\"]" + SUBJECT_RE + r"['\"]")),
]

SUBSCRIBE_PATTERNS: List[Tuple[str, re.Pattern]] = [
    ("subscribe", re.compile(r"\bsubscribe\s*\(\s*['\"]" + SUBJECT_RE + r"['\"]")),
    ("subscribe", re.compile(r"\bjs\.subscribe\s*\(\s*['\"]" + SUBJECT_RE + r"['\"]")),
    ("subscribe", re.compile(r"@(?:EventPattern|MessagePattern)\(\s*['\"]" + SUBJECT_RE + r"['\"]")),
]

# NestJS + FastAPI + express-like
HTTP_DECORATOR = re.compile(r"@(?:Get|Post|Put|Patch|Delete)\(\s*['\"]?([^'\")]+)?['\"]?\s*\)")
FASTAPI_DECORATOR = re.compile(r"@app\.(get|post|put|patch|delete)\(\s*['\"]([^'\"]+)['\"]")
EXPRESS_ROUTE = re.compile(r"\b(app|router)\.(get|post|put|patch|delete)\(\s*['\"]([^'\"]+)['\"]")

PROTO_SERVICE = re.compile(r"^\s*service\s+(\w+)")
PROTO_RPC = re.compile(r"^\s*rpc\s+(\w+)\s*\(")


def _iter_files(repo: Path) -> Iterator[Path]:
    for root, dirs, files in os.walk(repo):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for fn in files:
            p = Path(root) / fn
            if p.suffix.lower() in TEXT_EXTS:
                yield p


def _safe_read_lines(path: Path) -> List[str]:
    try:
        return path.read_text(encoding="utf-8", errors="replace").splitlines()
    except Exception:
        return []


def _emit(out_fh, kind: str, value: str, file: Path, line: int, snippet: str) -> None:
    out_fh.write(
        json.dumps(
            {
                "kind": kind,
                "value": value,
                "file": file.as_posix(),
                "line": line,
                "snippet": snippet.strip()[:240],
            },
            ensure_ascii=False,
        )
        + "\n"
    )


def scan(repo: Path, out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as out_fh:
        for p in _iter_files(repo):
            rel = p.relative_to(repo)
            lines = _safe_read_lines(p)

            # Proto parsing state
            current_service = None

            for idx, line in enumerate(lines, start=1):
                # Publish
                for _, pat in PUBLISH_PATTERNS:
                    m = pat.search(line)
                    if m:
                        _emit(out_fh, "publish", m.group(1), rel, idx, line)

                # Subscribe
                for _, pat in SUBSCRIBE_PATTERNS:
                    m = pat.search(line)
                    if m:
                        _emit(out_fh, "subscribe", m.group(1), rel, idx, line)

                # HTTP
                m = HTTP_DECORATOR.search(line)
                if m:
                    path = (m.group(1) or "").strip() or "/"
                    # method is in decorator name, but not captured; store snippet.
                    _emit(out_fh, "http", f"route {path}", rel, idx, line)

                m = FASTAPI_DECORATOR.search(line)
                if m:
                    method, path = m.group(1).upper(), m.group(2)
                    _emit(out_fh, "http", f"{method} {path}", rel, idx, line)

                m = EXPRESS_ROUTE.search(line)
                if m:
                    method, path = m.group(2).upper(), m.group(3)
                    _emit(out_fh, "http", f"{method} {path}", rel, idx, line)

                # Proto
                if p.suffix.lower() == ".proto":
                    sm = PROTO_SERVICE.match(line)
                    if sm:
                        current_service = sm.group(1)
                    rm = PROTO_RPC.match(line)
                    if rm and current_service:
                        _emit(out_fh, "proto", f"{current_service}.{rm.group(1)}", rel, idx, line)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True, help="Path to repository root")
    ap.add_argument("--out", required=True, help="Output JSONL path")
    args = ap.parse_args()

    repo = Path(args.repo).resolve()
    out_path = Path(args.out)
    scan(repo, out_path)
    print(f"Wrote candidates to {out_path}")


if __name__ == "__main__":
    main()
