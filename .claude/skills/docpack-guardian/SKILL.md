---
name: docpack-guardian
description: "Validate and maintain an agent-first documentation pack for a repository: AI_CONTEXT.md, catalogs/service_catalog.yaml, catalogs/event_catalog.yaml, and retrieval indexes (indexes/events.jsonl, indexes/services.jsonl). Use to lint and reconcile catalogs, rebuild JSONL indexes from YAML, detect orphan or missing events/commands/queries, enforce naming and required fields, and generate docs/INVENTORY_REPORT.md with metrics."
---

# Docpack Guardian

## Quick start

- Validate the doc pack and print a summary:
  - `python scripts/validate_docpack.py --repo .`
- Validate and write a report:
  - `python scripts/validate_docpack.py --repo . --write-report docs/INVENTORY_REPORT.md`
- Rebuild retrieval indexes from YAML catalogs:
  - `python scripts/build_indexes.py --repo .`

## Workflow decision tree

1. Need only regenerate JSONL indexes after editing YAML catalogs
   - Run `scripts/build_indexes.py`
2. Need a coherence check (missing files, broken references, naming issues, orphans)
   - Run `scripts/validate_docpack.py` (optionally with `--write-report`)
3. Need to fix catalogs
   - Apply the fix workflow below, then rebuild indexes

## Lint workflow

1. Confirm required files exist
   - `AI_CONTEXT.md`
   - `catalogs/service_catalog.yaml`
   - `catalogs/event_catalog.yaml`
   - `indexes/` directory

2. Parse YAML catalogs and validate basic invariants
   - Unique `id` per service and per catalog item
   - No duplicate `subject` inside events or commands

3. Cross-check catalogs
   - Every `producer.service` and `consumer.service` in event catalog must exist in service catalog
   - Every subject listed in `service_catalog.yaml` publishes/consumes should exist in `event_catalog.yaml` (or be called out as an inconsistency)

4. Enforce naming and classification heuristics
   - Event subjects should look like facts (past tense)
   - Command subjects should look like intents (imperative)
   - Flag unusual patterns (underscores, missing domain prefix) as warnings, not automatic errors
   - See `references/naming-rules.md`

5. Detect orphans and missing items
   - Orphan: producer exists, consumers list is empty
   - Missing: referenced in contracts/docs but not present in code-derived catalog (record as an explicit list in the report)

6. Produce a concise report
   - Use the template in `references/report-template.md`
   - Include metrics; do not claim completeness without counts

## Fix workflow

1. Make minimal diffs
   - Keep `id` stable
   - Update `last_updated` fields
   - Prefer adding evidence links over rewriting descriptions

2. Normalize ordering
   - Sort `services` by `name`
   - Sort `events`, `commands`, `queries` by `subject` or `name`

3. Rebuild indexes
   - Run `scripts/build_indexes.py`

## Output requirements

- Never output “Complete” without listing coverage metrics.
- When reporting orphans, always include the producer evidence link(s).

## References

- Naming rules and classification: `references/naming-rules.md`
- Inventory report template: `references/report-template.md`
