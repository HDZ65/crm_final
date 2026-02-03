#!/usr/bin/env python3
"""Build retrieval indexes (JSONL) from YAML catalogs.

Usage:
  python scripts/build_indexes.py --repo .

Produces:
  indexes/services.jsonl
  indexes/events.jsonl

Notes:
- YAML catalogs remain the source of truth.
- Index lines follow a fixed schema: id, type, title, tags, body, links.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List

import yaml


def _read_yaml(path: Path) -> Dict[str, Any]:
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"YAML root must be a mapping: {path}")
    return data


def _write_jsonl(path: Path, rows: List[Dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False))
            f.write("\n")


def _compact(s: str) -> str:
    return " ".join((s or "").strip().split())


def _service_tags(svc: Dict[str, Any]) -> List[str]:
    tags: List[str] = []
    if svc.get("domain"):
        tags.append(f"domain:{svc['domain']}")
    if svc.get("type"):
        tags.append(f"type:{svc['type']}")
    runtime = svc.get("runtime") or {}
    if runtime.get("language"):
        tags.append(f"lang:{runtime['language']}")
    if runtime.get("framework"):
        tags.append(f"fw:{runtime['framework']}")

    messaging = svc.get("messaging") or {}
    for subj in (messaging.get("publishes") or []):
        tags.append(f"publishes:{subj}")
    for subj in (messaging.get("consumes") or []):
        tags.append(f"consumes:{subj}")

    return tags


def _service_body(svc: Dict[str, Any]) -> str:
    parts: List[str] = []
    parts.append(f"Service {svc.get('name')} (domain={svc.get('domain')}, type={svc.get('type')}).")

    interfaces = svc.get("interfaces") or {}
    grpc = interfaces.get("grpc") or []
    http = interfaces.get("http") or []
    if grpc:
        parts.append(f"gRPC={len(grpc)}.")
    if http:
        parts.append(f"HTTP={len(http)}.")

    data = svc.get("data") or {}
    dbs = data.get("databases") or []
    if dbs:
        db_names = [d.get("name") for d in dbs if isinstance(d, dict) and d.get("name")]
        if db_names:
            parts.append(f"DBs={','.join(db_names)}.")

    messaging = svc.get("messaging") or {}
    pubs = messaging.get("publishes") or []
    cons = messaging.get("consumes") or []
    if pubs:
        parts.append(f"Publishes {len(pubs)}.")
    if cons:
        parts.append(f"Consumes {len(cons)}.")

    desc = svc.get("description")
    if desc:
        parts.append(_compact(desc))

    return _compact(" ".join(parts))


def _service_links(svc: Dict[str, Any]) -> List[str]:
    links: List[str] = []
    sid = svc.get("id")
    if sid:
        links.append(f"catalogs/service_catalog.yaml#{sid}")

    repo = svc.get("repo") or {}
    if repo.get("path"):
        links.append(repo["path"])

    interfaces = svc.get("interfaces") or {}
    for g in (interfaces.get("grpc") or []):
        if isinstance(g, dict) and g.get("proto"):
            links.append(g["proto"])
    for h in (interfaces.get("http") or []):
        if isinstance(h, dict) and h.get("openapi"):
            links.append(h["openapi"])

    return links


def _item_tags(item: Dict[str, Any]) -> List[str]:
    tags: List[str] = []
    kind = item.get("kind") or item.get("type")
    if kind:
        tags.append(f"kind:{kind}")
    if item.get("subject"):
        tags.append(f"subject:{item['subject']}")

    # transport
    transport = item.get("transport") or {}
    if isinstance(transport, dict) and transport.get("mode"):
        tags.append(f"transport:{transport['mode']}")

    delivery = item.get("delivery") or {}
    if isinstance(delivery, dict) and delivery.get("broker"):
        tags.append(f"broker:{delivery['broker']}")

    schema = item.get("schema") or {}
    if isinstance(schema, dict) and schema.get("version") is not None:
        tags.append(f"schema:v{schema['version']}")

    # producer / receiver / responder
    producer = item.get("producer") or {}
    if isinstance(producer, dict) and producer.get("service"):
        tags.append(f"producer:{producer['service']}")

    sender = item.get("sender") or {}
    if isinstance(sender, dict) and sender.get("service"):
        tags.append(f"sender:{sender['service']}")

    receiver = item.get("receiver") or {}
    if isinstance(receiver, dict) and receiver.get("service"):
        tags.append(f"receiver:{receiver['service']}")

    responder = item.get("responder") or {}
    if isinstance(responder, dict) and responder.get("service"):
        tags.append(f"responder:{responder['service']}")

    # consumers
    for c in (item.get("consumers") or []):
        if isinstance(c, dict) and c.get("service"):
            tags.append(f"consumer:{c['service']}")

    for t in (item.get("tags") or []):
        tags.append(str(t))

    # domain event mapping
    if item.get("domain_event"):
        tags.append(f"domain_event:{item['domain_event']}")

    return tags


def _item_title(item: Dict[str, Any]) -> str:
    if item.get("subject"):
        return str(item["subject"])

    # gRPC / HTTP fallbacks
    transport = item.get("transport") or {}
    grpc = transport.get("grpc") if isinstance(transport, dict) else None
    http = transport.get("http") if isinstance(transport, dict) else None

    if isinstance(grpc, dict) and grpc.get("service") and grpc.get("method"):
        return f"{grpc['service']}.{grpc['method']}"
    if isinstance(http, dict) and http.get("method") and http.get("path"):
        return f"{http['method']} {http['path']}"

    return str(item.get("name") or item.get("id") or "unknown")


def _item_body(item: Dict[str, Any]) -> str:
    parts: List[str] = []
    parts.append(_compact(item.get("description") or ""))

    kind = item.get("kind") or "item"
    parts.append(f"Kind={kind}.")

    producer = item.get("producer") or {}
    if isinstance(producer, dict) and producer.get("service"):
        parts.append(f"Producer={producer['service']}.")

    sender = item.get("sender") or {}
    if isinstance(sender, dict) and sender.get("service"):
        parts.append(f"Sender={sender['service']}.")

    receiver = item.get("receiver") or {}
    if isinstance(receiver, dict) and receiver.get("service"):
        parts.append(f"Receiver={receiver['service']}.")

    responder = item.get("responder") or {}
    if isinstance(responder, dict) and responder.get("service"):
        parts.append(f"Responder={responder['service']}.")

    consumers = item.get("consumers") or []
    if consumers:
        svc_names = [c.get("service") for c in consumers if isinstance(c, dict) and c.get("service")]
        if svc_names:
            parts.append("Consumers=" + ",".join(svc_names) + ".")

    schema = item.get("schema") or {}
    if isinstance(schema, dict):
        if schema.get("name"):
            parts.append(f"Schema={schema['name']}.")
        if schema.get("version") is not None:
            parts.append(f"SchemaVersion={schema['version']}.")

        req = schema.get("required_fields") or []
        if req:
            parts.append("Required=" + ",".join(map(str, req[:12])) + ("..." if len(req) > 12 else "") + ".")

    delivery = item.get("delivery") or {}
    if isinstance(delivery, dict):
        js = delivery.get("jetstream") or {}
        if isinstance(js, dict) and js.get("stream"):
            parts.append(f"Stream={js['stream']}.")
        if isinstance(js, dict) and js.get("subject_filter"):
            parts.append(f"Filter={js['subject_filter']}.")

        rel = delivery.get("reliability") or {}
        if isinstance(rel, dict):
            retry = rel.get("retry") or {}
            if isinstance(retry, dict) and retry.get("policy"):
                parts.append(f"Retry={retry['policy']}.")
            if isinstance(retry, dict) and retry.get("max_attempts") is not None:
                parts.append(f"MaxAttempts={retry['max_attempts']}.")
            if rel.get("dlq_subject"):
                parts.append(f"DLQ={rel['dlq_subject']}.")

    return _compact(" ".join([p for p in parts if p]))


def _item_links(item: Dict[str, Any], catalog_path: str) -> List[str]:
    links: List[str] = []
    iid = item.get("id")
    if iid:
        links.append(f"{catalog_path}#{iid}")

    links_block = item.get("links") or {}
    if isinstance(links_block, dict):
        for k in ("contracts", "docs", "runbook"):
            for v in (links_block.get(k) or []):
                links.append(str(v))

        # code refs / handler refs
        for v in (links_block.get("code_refs") or []):
            links.append(str(v))
        for v in (links_block.get("handler_refs") or []):
            links.append(str(v))

    # direct inline refs (common during iterative edits)
    for v in (item.get("code_refs") or []):
        links.append(str(v))
    for v in (item.get("handler_refs") or []):
        links.append(str(v))

    return links


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=".", help="Repo root")
    parser.add_argument("--service-catalog", default="catalogs/service_catalog.yaml")
    parser.add_argument("--event-catalog", default="catalogs/event_catalog.yaml")
    parser.add_argument("--out-dir", default="indexes")
    args = parser.parse_args()

    repo = Path(args.repo).resolve()
    svc_path = (repo / args.service_catalog).resolve()
    evt_path = (repo / args.event_catalog).resolve()
    out_dir = (repo / args.out_dir).resolve()

    services_catalog = _read_yaml(svc_path)
    event_catalog = _read_yaml(evt_path)

    services = services_catalog.get("services") or []
    if not isinstance(services, list):
        raise ValueError("service_catalog.yaml: 'services' must be a list")

    svc_rows: List[Dict[str, Any]] = []
    for svc in services:
        if not isinstance(svc, dict):
            continue
        sid = svc.get("id")
        name = svc.get("name")
        if not sid or not name:
            continue
        svc_rows.append(
            {
                "id": sid,
                "type": "service",
                "title": name,
                "tags": _service_tags(svc),
                "body": _service_body(svc),
                "links": _service_links(svc),
            }
        )

    catalog_root = event_catalog.get("catalog") or {}
    items: List[Dict[str, Any]] = []
    for k in ("events", "commands", "queries"):
        chunk = catalog_root.get(k) or []
        if isinstance(chunk, list):
            items.extend([x for x in chunk if isinstance(x, dict)])

    item_rows: List[Dict[str, Any]] = []
    for it in items:
        iid = it.get("id")
        kind = it.get("kind")
        if not iid or not kind:
            continue
        item_rows.append(
            {
                "id": iid,
                "type": kind,
                "title": _item_title(it),
                "tags": _item_tags(it),
                "body": _item_body(it),
                "links": _item_links(it, "catalogs/event_catalog.yaml"),
            }
        )

    _write_jsonl(out_dir / "services.jsonl", svc_rows)
    _write_jsonl(out_dir / "events.jsonl", item_rows)

    print(f"Wrote {len(svc_rows)} services to {out_dir/'services.jsonl'}")
    print(f"Wrote {len(item_rows)} items to {out_dir/'events.jsonl'}")


if __name__ == "__main__":
    main()
