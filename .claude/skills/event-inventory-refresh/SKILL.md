---
name: event-inventory-refresh
description: "Perform a full repository scan to inventory async events (NATS/JetStream), commands, and queries with evidence and confidence scoring, then update catalogs/service_catalog.yaml, catalogs/event_catalog.yaml, and retrieval indexes (indexes/*.jsonl). Use when asked to rebuild or verify the event/command/query inventory from scratch, audit messaging and API endpoints, or identify orphans/missing items."
---

# Event Inventory Refresh

## Overview

Build a verifiable inventory of services, events, commands, and queries by reading the entire codebase. Prefer proof over inference.

## Workflow (follow in order)

1. Map the repository
   - List service roots (default: `services/*`), contracts (`contracts/*`, `proto/*`), and infra (docker/helm/k8s/terraform).

2. Scan every service directory
   - Identify runtime and entrypoints.
   - Identify messaging client usage (NATS/JetStream).
   - Identify write endpoints (commands) and read endpoints (queries) (gRPC/HTTP).

3. Extract evidence
   - For each subject or endpoint, record repo-relative `code_refs` with a line number or short snippet.

4. Classify
   - Event: past fact (created/updated/deleted/sent/failed/completed).
   - Command: imperative intent (import/request/execute/run/enqueue/prepare/trigger).
   - When ambiguous, keep the item but mark it as ambiguous in the report and lower confidence.

5. Update catalogs
   - Add or update services in `catalogs/service_catalog.yaml`.
   - Add or update items in `catalogs/event_catalog.yaml` under `catalog.events`, `catalog.commands`, `catalog.queries`.

6. Regenerate retrieval indexes
   - Run `python scripts/build_indexes.py --repo .`

7. Write a report
   - Write `docs/INVENTORY_REPORT.md` using `references/report-template.md`.
   - Include coverage metrics, inferred items count, inconsistencies, and orphans.

## Confidence scoring

- HIGH: literal subject/endpoint + producer + consumer/handler found.
- MEDIUM: literal subject/endpoint found + producer found; consumer/handler indirect or incomplete.
- LOW: inferred or constructed subject/endpoint; wrappers hide evidence.

Add the confidence level in each catalog item (use `tags` or an `evidence` note).

## Use helper scripts

- Generate candidate lists (subjects, endpoints) to speed up manual review:
  - `python scripts/scan_candidates.py --repo . --out tmp/candidates.jsonl`
- Rebuild indexes from catalogs:
  - `python scripts/build_indexes.py --repo .`

## Output requirements

- Never claim completeness without coverage metrics.
- Keep diffs minimal: keep IDs stable; sort lists; update `last_updated`.

## References

- Search patterns by tech stack: `references/search-patterns.md`
- Report template: `references/report-template.md`
- Evidence format: `references/evidence-format.md`
