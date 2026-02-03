# Evidence Format

Always attach evidence to every catalog item.

## Preferred evidence

- Repo-relative file path + line number/range:
  - `services/sender-worker/src/nats/publisher.ts:120-137`

## If line numbers are hard

- Provide a unique 1-2 line snippet (max 2 lines) that makes the location searchable.

## How to store evidence in YAML

Use `code_refs` / `handler_refs` arrays, each item as one string.

Examples:

- `code_refs: ["services/.../publisher.ts:120-137"]`
- `handler_refs: ["services/.../handler.ts:55-89"]`

## Confidence

- HIGH: publish + subscribe/handler found.
- MEDIUM: publish found, consumer indirect.
- LOW: inferred (dynamic subject strings, config-driven, wrapper hides subject).

Store confidence as a tag:
- `tags: ["confidence:high"]`

Or add a short note in the report.
