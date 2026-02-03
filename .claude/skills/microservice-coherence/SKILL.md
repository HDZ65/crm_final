---
name: microservice-coherence
description: Coach-mode skill for scanning microservice monorepos to detect and fix cross-service inconsistencies. Use when the user wants to audit, compare, harmonize, or fix coherence issues across multiple services (structure, conventions, contracts, events, migrations, tests, docker, dependencies). Triggers on phrases like "check coherence", "audit services", "compare microservices", "harmonize conventions", "fix inconsistencies".
---

# Microservice Coherence Coach

Audit and harmonize microservices in any monorepo. Ecosystem-agnostic, minimal interventions, coach-first approach.

## Core Principles

1. **Discover, don't assume** - Build Service Manifests before comparing
2. **Coach, don't dictate** - One question at a time, only when discovery reveals ambiguity
3. **Minimal fixes** - Smallest change that fixes the issue, always with rollback
4. **Propose, then apply** - Never modify without explicit user confirmation

## Workflow Phases

### Phase 0: Scope Selection

Ask user for scope OR auto-detect:
- Root of monorepo
- Specific folder (e.g., `services/`, `apps/`)
- Subset of services by name pattern

If user unsure, scan for common patterns: `services/`, `apps/`, `packages/`, `modules/`, or top-level dirs with `package.json`/`go.mod`/`Cargo.toml`/`pom.xml`.

### Phase 1: Service Manifest Generation

For each detected service, build a **Service Manifest** (see [references/service-manifest-schema.md](references/service-manifest-schema.md)).

Steps:
1. Glob for service indicators: `package.json`, `go.mod`, `Cargo.toml`, `pom.xml`, `pyproject.toml`, `Dockerfile`
2. For each service root, extract:
   - Type (api/worker/library/gateway)
   - Language/framework
   - Directory structure (layers)
   - Ports/endpoints
   - Scripts (build/test/lint)
   - Key dependencies + versions
   - Contract files (proto/openapi/graphql)
   - Database config (ORM, migrations path)
   - Events (catalog, pub/sub patterns)
   - Tests (location, framework)
   - Docker (Dockerfile, compose refs)
   - Healthchecks
   - Observability (logging, tracing, metrics libs)
3. Store manifests in memory for comparison

### Phase 2: Archetype Detection & Profile Selection

Cluster services by similarity:
- Same language/framework → potential archetype
- Same type (api vs worker) → compare within type
- Similar structure → expect similar conventions

Select a **Rule Profile** heuristically (see [references/rule-profiles.md](references/rule-profiles.md)):
- Mostly TypeScript APIs → `typescript-api`
- Go gRPC services → `go-grpc`
- Python workers → `python-worker`
- Mixed stack → `minimal` (cross-lang rules only)

**Dynamic question (if ambiguous)**:
> I detected N services: X TypeScript APIs, Y Go workers. Should I compare:
> 1. Same-archetype only (stricter)
> 2. Cross-stack (common conventions only)
> ?

### Phase 3: Coherence Scan & Report

Apply rules from selected profile against manifests.

For each rule violation:
- Severity: `critical` | `warning` | `info`
- Proof: file paths, snippets, tree diffs
- Suggestion: minimal fix

Sort by severity, then by fix cost (fewer files = lower cost).

Output format:
```
## Coherence Report

### Summary
- Services scanned: N
- Archetypes: [list]
- Profile: X
- Issues: C critical, W warnings, I info

### Top Issues

#### [CRITICAL] Missing healthcheck in service-foo
**Proof**: No `/health` endpoint in `service-foo/src/routes/`
**Impact**: K8s probes will fail
**Suggestion**: Add healthcheck route matching `service-bar/src/routes/health.ts`

#### [WARNING] Inconsistent test structure
**Proof**: `service-a/tests/` vs `service-b/__tests__/`
**Impact**: CI scripts may miss tests
**Suggestion**: Standardize to `tests/` (majority convention)
```

### Phase 4: Fix Pack Proposal

Generate Fix Packs for top 10 issues (see [references/fix-packs.md](references/fix-packs.md)).

Each Fix Pack contains:
- ID: `FP-001`
- Goal
- Files to modify (exact paths)
- Diff preview (minimal)
- Risk assessment
- Pre/post validation commands
- Rollback steps

**Dynamic question**:
> I have N Fix Packs ready. Want to:
> 1. Review all first
> 2. Apply FP-001 now
> 3. Skip to validation commands
> ?

### Phase 5: Validation

After any Fix Pack application, propose validation:
- Build commands per service
- Test commands per service
- Smoke test suggestions
- Linting if available

If user wants full validation, run sequentially and report results.

### Phase 6: CI Guardrails (Optional)

Offer to generate CI-ready coherence check (see [references/ci-guardrails.md](references/ci-guardrails.md)):
- Shell script or Node/Python checker
- Exit codes (0=ok, 1=warnings, 2=critical)
- Markdown summary artifact
- Integration snippet for common CI platforms

## Dynamic Questions (Conditional Only)

Never ask static Q1-Q10. Only ask when:

| Condition | Question |
|-----------|----------|
| Multiple archetypes | Compare same-archetype or cross-stack? |
| No clear majority convention | Pick golden reference or use median? |
| Contracts detected | Include proto/openapi compat check? |
| Events detected | Analyze event catalog coherence? |
| Applying fix | Apply Fix Pack #N now? |
| After fixes | Run validation suite? |
| Session end | Generate CI guardrail script? |

## Output Artifacts

1. **Inline report** (always) - Markdown in response
2. **coherence_report.md** (optional) - Only if user requests or repo has `docs/` convention
3. **ci-coherence-check.sh** (optional) - If user opts for CI guardrails

## Extending the Skill

See [references/rule-profiles.md](references/rule-profiles.md) section "Adding Custom Rules".
See [references/scanning-playbook.md](references/scanning-playbook.md) for detection patterns.

## Constraints

- Never bulk-rename or bulk-restructure services
- No "grand refactor" proposals
- Stay within user-defined scope
- Minimal option first, advanced second
- Always provide rollback
- Do not hardcode service names or ecosystem-specific paths
