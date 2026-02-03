# Rule Profiles

Rule profiles are collections of coherence rules grouped by stack/archetype. The skill selects a profile heuristically based on detected services, then applies its rules.

## Profile Selection Heuristic

```
if majority(services).language == "typescript":
  if majority(services).contracts.hasProto:
    profile = "typescript-grpc"
  else:
    profile = "typescript-api"
elif majority(services).language == "go":
  if majority(services).contracts.hasProto:
    profile = "go-grpc"
  else:
    profile = "go-api"
elif majority(services).language == "python":
  if majority(services).type == "worker":
    profile = "python-worker"
  else:
    profile = "python-api"
elif mixed_languages:
  profile = "minimal"
else:
  profile = "minimal"
```

## Available Profiles

### minimal

Cross-language, universally applicable rules. Use when services are heterogeneous.

| Rule ID | Severity | Description |
|---------|----------|-------------|
| MIN-001 | critical | All services must have a Dockerfile |
| MIN-002 | critical | All services must have a healthcheck endpoint |
| MIN-003 | warning | All services should have a test script |
| MIN-004 | warning | All services should have a build script |
| MIN-005 | warning | Dockerfiles should use multi-stage builds |
| MIN-006 | info | Services should have consistent port conventions |
| MIN-007 | info | README or docs should exist per service |

### typescript-api

For TypeScript/JavaScript REST API services.

Inherits: `minimal`

| Rule ID | Severity | Description |
|---------|----------|-------------|
| TS-001 | critical | TypeScript config (tsconfig.json) must exist |
| TS-002 | critical | Package manager lockfile must exist |
| TS-003 | warning | Test framework should be consistent (jest/vitest) |
| TS-004 | warning | Logging library should be consistent (pino/winston) |
| TS-005 | warning | Tests directory structure should match across services |
| TS-006 | warning | ESLint/Prettier config should be consistent |
| TS-007 | info | Node version should match (engines field or .nvmrc) |
| TS-008 | info | Script naming should be consistent (dev/start/build/test) |
| TS-009 | info | Source structure (by-type vs by-feature) should match |
| TS-010 | warning | Key framework versions should match (express/fastify/nest) |
| TS-011 | warning | ORM should be consistent if multiple services use DB |
| TS-012 | info | Validation library should match (zod/yup/joi) |

### typescript-grpc

For TypeScript services using gRPC/Protocol Buffers.

Inherits: `typescript-api`

| Rule ID | Severity | Description |
|---------|----------|-------------|
| TSGRPC-001 | critical | Proto files must exist for gRPC services |
| TSGRPC-002 | critical | Proto generation script must exist |
| TSGRPC-003 | warning | Proto file organization should match |
| TSGRPC-004 | warning | Proto package naming convention should be consistent |
| TSGRPC-005 | info | Proto linting (buf) should be configured |

### go-api

For Go HTTP API services.

Inherits: `minimal`

| Rule ID | Severity | Description |
|---------|----------|-------------|
| GO-001 | critical | go.mod must exist |
| GO-002 | warning | Go version should match across services |
| GO-003 | warning | HTTP framework should be consistent (gin/echo/chi/fiber) |
| GO-004 | warning | Logging library should match (zap/logrus/zerolog) |
| GO-005 | warning | Project layout should match (cmd/internal/pkg) |
| GO-006 | info | Makefile targets should be consistent |
| GO-007 | info | Linter config (.golangci.yml) should match |
| GO-008 | warning | Error handling pattern should be consistent |

### go-grpc

For Go gRPC services.

Inherits: `go-api`

| Rule ID | Severity | Description |
|---------|----------|-------------|
| GOGRPC-001 | critical | Proto files must exist |
| GOGRPC-002 | critical | Proto generation (protoc/buf) must be configured |
| GOGRPC-003 | warning | Proto file location should match |
| GOGRPC-004 | warning | Generated code location should match |
| GOGRPC-005 | info | buf.yaml/buf.gen.yaml should be consistent |

### python-api

For Python API services (FastAPI, Flask, Django).

Inherits: `minimal`

| Rule ID | Severity | Description |
|---------|----------|-------------|
| PY-001 | critical | Dependency file must exist (requirements.txt/pyproject.toml) |
| PY-002 | warning | Python version should match (.python-version/pyproject.toml) |
| PY-003 | warning | Framework should be consistent (fastapi/flask/django) |
| PY-004 | warning | Test framework should match (pytest) |
| PY-005 | warning | Linting tools should match (ruff/black/flake8) |
| PY-006 | info | Project structure should match (src layout vs flat) |
| PY-007 | info | Async patterns should be consistent |

### python-worker

For Python background workers (Celery, RQ, etc.).

Inherits: `python-api`

| Rule ID | Severity | Description |
|---------|----------|-------------|
| PYWORK-001 | critical | Task queue library must be declared |
| PYWORK-002 | warning | Task discovery pattern should match |
| PYWORK-003 | warning | Retry/backoff configuration should be consistent |
| PYWORK-004 | info | Task naming convention should match |

### event-driven

Additional rules for event-driven architectures. Can be combined with any stack profile.

| Rule ID | Severity | Description |
|---------|----------|-------------|
| EVT-001 | critical | Event schemas must be defined (AsyncAPI/JSON Schema) |
| EVT-002 | warning | Event naming convention should be consistent |
| EVT-003 | warning | Event versioning strategy should match |
| EVT-004 | warning | Dead letter handling should exist |
| EVT-005 | info | Event catalog/registry should be maintained |

### ddd-strict

Rules for Domain-Driven Design patterns. Can be combined with stack profiles.

| Rule ID | Severity | Description |
|---------|----------|-------------|
| DDD-001 | warning | Domain layer should not import infrastructure |
| DDD-002 | warning | Application layer should only import domain |
| DDD-003 | info | Aggregate boundaries should be documented |
| DDD-004 | info | Ubiquitous language terms should be consistent |

---

## Rule Definition Format

Each rule follows this structure:

```typescript
interface Rule {
  id: string;                    // Unique identifier (PREFIX-NNN)
  profile: string;               // Parent profile
  severity: 'critical' | 'warning' | 'info';
  description: string;           // Human-readable description
  check: CheckFunction;          // How to detect violation
  evidence: EvidenceFunction;    // How to produce proof
  suggestion: SuggestionFunction; // How to fix
  cost: CostEstimate;            // Fix complexity
}

interface CheckFunction {
  // Pseudocode for detecting the issue
  // Returns: { violated: boolean, services: string[] }
}

interface EvidenceFunction {
  // Returns: { files: string[], snippets: string[], trees: string[] }
}

interface SuggestionFunction {
  // Returns: { description: string, fixPack: FixPack | null }
}

type CostEstimate = 'trivial' | 'low' | 'medium' | 'high';
```

---

## Rule Check Examples

### MIN-002: Healthcheck Required

```
check(manifests):
  violations = []
  for manifest in manifests:
    if manifest.type in ['api', 'gateway', 'worker']:
      if not manifest.healthcheck.hasHealthEndpoint:
        violations.append(manifest.name)
  return violations

evidence(manifest):
  return {
    files: [manifest.path + "/src/**/*.ts"],
    note: "No /health, /healthz, or /ready endpoint found"
  }

suggestion(manifest, reference):
  # Find a service that has healthcheck
  ref = find_service_with_healthcheck(manifests)
  if ref:
    return {
      description: f"Add healthcheck endpoint matching {ref.name}",
      reference_file: ref.healthcheck.healthPath
    }
  else:
    return {
      description: "Add GET /health endpoint returning 200 OK"
    }

cost: 'low'
```

### TS-003: Consistent Test Framework

```
check(manifests):
  ts_services = filter(m => m.language == 'typescript', manifests)
  frameworks = unique(m.tests.framework for m in ts_services)
  if len(frameworks) > 1:
    return {
      violated: true,
      details: frameworks,
      services: ts_services
    }

evidence(manifests):
  return {
    files: [m.tests.configFile for m in manifests],
    comparison: {
      jest: [services using jest],
      vitest: [services using vitest]
    }
  }

suggestion(manifests):
  majority = mode(m.tests.framework for m in manifests)
  minority = [m for m in manifests if m.tests.framework != majority]
  return {
    description: f"Migrate {minority} from {their_framework} to {majority}",
    fixPack: generate_test_migration_pack(minority, majority)
  }

cost: 'medium'
```

### TS-010: Framework Version Consistency

```
check(manifests):
  ts_services = filter(m => m.language == 'typescript', manifests)
  framework_versions = {}
  for m in ts_services:
    for dep in m.dependencies.keyDeps:
      if dep.category == 'framework':
        key = dep.name
        if key not in framework_versions:
          framework_versions[key] = {}
        framework_versions[key][dep.version] = framework_versions[key].get(dep.version, []) + [m.name]

  violations = []
  for framework, versions in framework_versions.items():
    if len(versions) > 1:
      violations.append({
        framework: framework,
        versions: versions
      })
  return violations

evidence(violation):
  return {
    files: [m.path + "/package.json" for m in affected_services],
    comparison: violation.versions
  }

suggestion(violation):
  latest = max(violation.versions.keys(), key=semver_sort)
  outdated = [s for v, svcs in violation.versions.items() if v != latest for s in svcs]
  return {
    description: f"Update {violation.framework} to {latest} in: {outdated}",
    fixPack: generate_dependency_update_pack(outdated, violation.framework, latest)
  }

cost: 'low' if minor_version_diff else 'medium'
```

---

## Adding Custom Rules

To add a new rule:

1. Choose appropriate profile or create new one
2. Define rule following the format above
3. Add to this file in the appropriate profile section
4. Include:
   - Unique ID following `PREFIX-NNN` pattern
   - Clear severity rationale
   - Check logic (pseudocode)
   - Evidence gathering approach
   - Minimal fix suggestion
   - Cost estimate

### Custom Profile Example

```markdown
### my-company-standards

Company-specific rules. Inherits: `typescript-api`

| Rule ID | Severity | Description |
|---------|----------|-------------|
| MYCO-001 | critical | All services must use internal auth library |
| MYCO-002 | warning | Logging must include correlation ID |
| MYCO-003 | info | Service names must follow {domain}-{function} pattern |
```

---

## Profile Inheritance

Profiles can inherit from others. When applying rules:

1. Start with base profile rules
2. Add inherited profile rules
3. Add specific profile rules
4. Remove any explicitly disabled rules

Example: `go-grpc` applies:
- `minimal` rules (MIN-*)
- `go-api` rules (GO-*)
- `go-grpc` rules (GOGRPC-*)

## Combining Profiles

Some profiles can be combined:
- `typescript-api` + `event-driven` for event-sourced TS services
- `go-api` + `ddd-strict` for DDD Go services

When combining:
- Take union of all rules
- If rule IDs conflict, specific profile wins
- Ask user to confirm combined profile if auto-detected
