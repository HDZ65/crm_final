# Naming and Classification Rules

## Subjects

- Prefer lowercase dot-separated subjects.
- Avoid spaces and slashes.
- Treat underscores as legacy; allow but warn.

### Recommended subject shapes

- Events (facts, past tense): `domain.entity.action` where action is past tense.
  - Examples: `contact.created`, `sender.email.failed`, `campaign.completed`
- Commands (intent, imperative): `domain.entity.command` where command is imperative.
  - Examples: `contacts.import.requested`, `campaign.execute`, `workflow.trigger`

### Allowed characters (recommended)

- `a-z`, `0-9`, dot, underscore.
- If wildcard subjects exist (`*`, `>`), keep them in `delivery.jetstream.subject_filter` rather than as canonical event subjects.

## Event vs command classification

- Event: describes something that happened (created/updated/deleted/sent/failed/completed).
- Command: requests that something be done (import/request/execute/run/enqueue/prepare/trigger).

If a subject is ambiguous, keep it but mark:
- `kind: unknown`
- `status: planned` (or `operational` if clearly used)
- Add a note in the inventory report.

## IDs

- Services: `svc-<domain>-<service>` (kebab-case).
- Events: `evt-<domain>-<name>-v<major>`.
- Commands: `cmd-<domain>-<name>-v<major>`.
- Queries: `qry-<domain>-<name>-v<major>`.

Keep IDs stable across refactors.
