#!/usr/bin/env python3
"""Validate the agent-first doc pack.

Checks:
- Required files exist
- YAML catalogs parse
- Unique IDs
- Service references are valid
- Duplicate subjects
- Orphan events (published with no consumers)

Usage:
  python scripts/validate_docpack.py --repo .
  python scripts/validate_docpack.py --repo . --write-report docs/INVENTORY_REPORT.md
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple

import yaml


@dataclass
class Finding:
    level: str  # ERROR | WARNING | INFO
    title: str
    detail: str


def _load_yaml(path: Path) -> Any:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def _collect_service_ids(service_catalog: Dict[str, Any]) -> Tuple[Set[str], Set[str]]:
    services = service_catalog.get("services") or []
    ids = set()
    names = set()
    for svc in services:
        if isinstance(svc, dict):
            sid = str(svc.get("id", "")).strip()
            name = str(svc.get("name", "")).strip()
            if sid:
                ids.add(sid)
            if name:
                names.add(name)
    return ids, names


def _collect_catalog_items(event_catalog: Dict[str, Any]) -> List[Dict[str, Any]]:
    cat = event_catalog.get("catalog") or {}
    items: List[Dict[str, Any]] = []
    for key in ("events", "commands", "queries"):
        for it in (cat.get(key) or []):
            if isinstance(it, dict):
                items.append(it)
    return items


def _item_kind(it: Dict[str, Any]) -> str:
    return str(it.get("kind") or "").strip() or "unknown"


def _item_subject(it: Dict[str, Any]) -> str:
    if _item_kind(it) in ("event", "command"):
        return str(it.get("subject") or "").strip()
    return ""


def _producer_service(it: Dict[str, Any]) -> str:
    prod = it.get("producer")
    if isinstance(prod, dict):
        return str(prod.get("service") or "").strip()
    if isinstance(prod, str):
        return prod.strip()
    # commands use receiver/sender
    return ""


def _consumer_services(it: Dict[str, Any]) -> List[str]:
    consumers = it.get("consumers")
    out: List[str] = []
    if isinstance(consumers, list):
        for c in consumers:
            if isinstance(c, dict):
                s = str(c.get("service") or "").strip()
                if s:
                    out.append(s)
            elif isinstance(c, str):
                s = c.strip()
                if s:
                    out.append(s)
    return out


def _service_pubsub(service_catalog: Dict[str, Any]) -> Tuple[Set[str], Set[str]]:
    pubs: Set[str] = set()
    subs: Set[str] = set()
    for svc in (service_catalog.get("services") or []):
        if not isinstance(svc, dict):
            continue
        messaging = svc.get("messaging") or {}
        for s in (messaging.get("publishes") or []):
            if isinstance(s, str) and s.strip():
                pubs.add(s.strip())
        for s in (messaging.get("consumes") or []):
            if isinstance(s, str) and s.strip():
                subs.add(s.strip())
    return pubs, subs


def validate(repo: Path) -> Tuple[List[Finding], Dict[str, Any]]:
    findings: List[Finding] = []

    required = [
        repo / "AI_CONTEXT.md",
        repo / "catalogs" / "service_catalog.yaml",
        repo / "catalogs" / "event_catalog.yaml",
    ]
    for p in required:
        if not p.exists():
            findings.append(Finding("ERROR", "Missing required file", str(p)))

    if any(f.level == "ERROR" for f in findings):
        return findings, {}

    svc_path = repo / "catalogs" / "service_catalog.yaml"
    evt_path = repo / "catalogs" / "event_catalog.yaml"

    try:
        service_catalog = _load_yaml(svc_path) or {}
    except Exception as e:
        findings.append(Finding("ERROR", "Failed to parse service_catalog.yaml", repr(e)))
        return findings, {}

    try:
        event_catalog = _load_yaml(evt_path) or {}
    except Exception as e:
        findings.append(Finding("ERROR", "Failed to parse event_catalog.yaml", repr(e)))
        return findings, {}

    service_ids, service_names = _collect_service_ids(service_catalog)
    if not service_ids:
        findings.append(Finding("WARNING", "No services found", "service_catalog.yaml has an empty services list"))

    # Uniqueness checks
    seen_item_ids: Set[str] = set()
    dup_item_ids: Set[str] = set()
    seen_subjects: Set[str] = set()
    dup_subjects: Set[str] = set()

    items = _collect_catalog_items(event_catalog)
    for it in items:
        iid = str(it.get("id") or "").strip()
        if iid:
            if iid in seen_item_ids:
                dup_item_ids.add(iid)
            seen_item_ids.add(iid)
        subj = _item_subject(it)
        if subj:
            if subj in seen_subjects:
                dup_subjects.add(subj)
            seen_subjects.add(subj)

        # Service reference checks
        prod = _producer_service(it)
        cons = _consumer_services(it)
        if prod and (prod not in service_ids):
            findings.append(Finding("WARNING", "Unknown producer service", f"{iid} -> {prod}"))
        for c in cons:
            if c and (c not in service_ids):
                findings.append(Finding("WARNING", "Unknown consumer service", f"{iid} -> {c}"))

    if dup_item_ids:
        findings.append(Finding("ERROR", "Duplicate catalog item IDs", ", ".join(sorted(dup_item_ids))))
    if dup_subjects:
        findings.append(Finding("WARNING", "Duplicate subjects", ", ".join(sorted(dup_subjects))))

    # Cross-check pub/sub lists vs event catalog subjects
    pubs, subs = _service_pubsub(service_catalog)
    missing_from_event_catalog = sorted((pubs | subs) - seen_subjects)
    if missing_from_event_catalog:
        findings.append(
            Finding(
                "WARNING",
                "Subjects referenced by service_catalog but not present in event_catalog",
                "\n".join(missing_from_event_catalog[:200]),
            )
        )

    # Orphans: events with producer but no consumers
    orphans: List[Dict[str, str]] = []
    for it in items:
        if _item_kind(it) != "event":
            continue
        iid = str(it.get("id") or "").strip()
        subj = _item_subject(it)
        prod = _producer_service(it)
        cons = _consumer_services(it)
        status = str(it.get("status") or "").strip() or ""
        if prod and not cons and status not in ("deprecated",):
            orphans.append({"id": iid, "subject": subj, "producer": prod, "status": status or "orphan"})

    summary = {
        "services": len(service_names),
        "items": len(items),
        "events": sum(1 for it in items if _item_kind(it) == "event"),
        "commands": sum(1 for it in items if _item_kind(it) == "command"),
        "queries": sum(1 for it in items if _item_kind(it) == "query"),
        "orphans": orphans,
    }
    return findings, summary


def _render_report(repo: Path, findings: List[Finding], summary: Dict[str, Any]) -> str:
    from datetime import date

    lines: List[str] = []
    lines.append("# Inventory Report")
    lines.append("")
    lines.append("## Summary")
    lines.append(f"- Repo: {repo}")
    lines.append(f"- Date: {date.today().isoformat()}")
    lines.append(f"- Services cataloged: {summary.get('services', 0)}")
    lines.append(
        f"- Items: {summary.get('items', 0)} (events: {summary.get('events', 0)}, commands: {summary.get('commands', 0)}, queries: {summary.get('queries', 0)})"
    )
    lines.append("")

    lines.append("## Findings")
    for level in ("ERROR", "WARNING", "INFO"):
        group = [f for f in findings if f.level == level]
        if not group:
            continue
        lines.append(f"### {level}")
        for f in group:
            lines.append(f"- **{f.title}**: {f.detail}")
        lines.append("")

    lines.append("### Orphans")
    lines.append("| id | subject | producer | status |")
    lines.append("|---|---|---|---|")
    for o in summary.get("orphans", []):
        lines.append(f"| {o.get('id','')} | {o.get('subject','')} | {o.get('producer','')} | {o.get('status','')} |")

    lines.append("")
    lines.append("## Actions")
    lines.append("1. Fix errors and rerun validation.")
    lines.append("2. Decide what to do with orphans (add consumer, deprecate, or document external consumer).")
    lines.append("3. Rebuild indexes after catalog changes.")
    lines.append("")

    return "\n".join(lines)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=".", help="Repo root")
    ap.add_argument("--write-report", default="", help="Write a Markdown report to this path")
    args = ap.parse_args()

    repo = Path(args.repo).resolve()
    findings, summary = validate(repo)

    # Console output
    print(f"Repo: {repo}")
    if not summary:
        for f in findings:
            print(f"{f.level}: {f.title} :: {f.detail}")
        raise SystemExit(2)

    for f in findings:
        print(f"{f.level}: {f.title} :: {f.detail}")

    print("")
    print(f"Services: {summary.get('services', 0)}")
    print(f"Events: {summary.get('events', 0)}")
    print(f"Commands: {summary.get('commands', 0)}")
    print(f"Queries: {summary.get('queries', 0)}")
    print(f"Orphans: {len(summary.get('orphans', []))}")

    if args.write_report:
        out_path = (repo / args.write_report).resolve() if not Path(args.write_report).is_absolute() else Path(args.write_report)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(_render_report(repo, findings, summary), encoding="utf-8")
        print(f"\nWrote report to {out_path}")


if __name__ == "__main__":
    main()
