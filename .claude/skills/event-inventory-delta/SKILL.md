---
name: event-inventory-delta
description: "Incrementally maintain catalogs/service_catalog.yaml, catalogs/event_catalog.yaml, and retrieval indexes by scanning only the services affected by a PR or commit diff. Use when asked to update event/command/query documentation after code changes, reconcile docs with a file diff, or keep catalogs in sync during development."
---

# Event Inventory Delta

## Overview

Update the catalogs and JSONL indexes using a file diff, without re-scanning the entire repo.

## Workflow

1. Get the list of changed files
   - Prefer: `git diff --name-only <base>...<head>`
   - If git is not available, accept a plain text list of paths.

2. Derive affected services
   - Run: `python scripts/affected_services.py --repo . --changed-file-list <path>`
   - Treat anything under `services/<service>/` as belonging to that service.

3. Rescan affected services only
   - Use `references/search-patterns.md` to find publish/subscribe and endpoints.
   - Use `scripts/scan_candidates.py --repo . --services <csv> --out tmp/candidates.jsonl` to speed up.

4. Update catalogs
   - Update only the impacted services and catalog items.
   - Keep IDs stable.
   - Do not delete existing items unless you have evidence they were removed.

5. Regenerate indexes
   - Run: `python scripts/build_indexes.py --repo .`

6. Write a delta report
   - Append a section to `docs/INVENTORY_REPORT.md` with:
     - changed files
     - affected services
     - new/changed/removed items
     - new orphans or resolved orphans

## Output requirements

- Prefer minimal diffs (do not reorder unrelated sections).
- Always attach evidence for new or changed items.

## References

- Search patterns: `references/search-patterns.md`
- Evidence format: `references/evidence-format.md`
