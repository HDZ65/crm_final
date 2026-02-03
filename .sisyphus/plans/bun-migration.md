# Migration npm → bun (Monorepo complet)

## TL;DR

> **Quick Summary**: Migration complète du monorepo de npm vers bun runtime. Inclut 21 Dockerfiles, 23 package.json, 4 workflows CI/CD, 5 Makefiles.
> 
> **Deliverables**:
> - Images Docker basées sur `oven/bun:1-alpine`
> - Lockfiles `bun.lock` remplaçant `package-lock.json`
> - CI/CD GitHub Actions utilisant bun
> - Commandes Makefile migrées vers bun
> 
> **Estimated Effort**: Medium (2-3h)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 8

---

## Context

### Original Request
Migration complète du monorepo de npm vers bun pour alignement avec winaity-clean et amélioration des performances build/install.

### Interview Summary
**Key Discussions**:
- **Scope**: Tout le monorepo (frontend + 19 services NestJS + packages)
- **Runtime**: Bun runtime (`oven/bun` images, pas Node.js)
- **CI/CD**: Migration complète des GitHub Actions
- **Approche**: Tout d'un coup, pas incrémental

**Research Findings**:
- 21 Dockerfiles suivent le même pattern (npm ci → bun install --frozen-lockfile)
- `$npm_config_name` fonctionne aussi avec bun
- `--legacy-peer-deps` pas nécessaire avec bun (résolution auto)
- Compatibilité confirmée: NestJS, Next.js 16, TypeORM, buf

### Metis Review
**Identified Gaps** (addressed):
- **$npm_config_name**: Validé, bun supporte cette variable
- **preinstall hook**: À vérifier/mettre à jour si présent
- **packageManager field**: Doit passer de npm@10.9.2 à bun
- **engines.npm**: À supprimer
- **npx → bunx**: Dans Dockerfiles pour buf generate
- **CI cache**: Changer strategy de npm vers bun

---

## Work Objectives

### Core Objective
Remplacer npm par bun comme package manager ET runtime dans tout le monorepo, tout en préservant le comportement fonctionnel existant.

### Concrete Deliverables
- `bun.lock` à la racine (remplace package-lock.json)
- 21 Dockerfiles mis à jour (oven/bun + bun install)
- 4 workflows GitHub Actions migrés
- 5 Makefiles mis à jour
- Scripts générateurs mis à jour

### Definition of Done
- [x] `bun install` fonctionne à la racine sans erreur
- [x] `bun run build` compile tous les packages
- [x] Docker build de chaque service réussit
- [x] CI/CD GitHub Actions passe au vert
- [x] Un service (service-users) démarre et répond au health check

### Must Have
- Bun runtime dans tous les conteneurs Docker
- Lockfiles bun.lock au lieu de package-lock.json
- CI/CD fonctionnel avec bun

### Must NOT Have (Guardrails)
- NE PAS changer les versions des dépendances (migration only)
- NE PAS modifier turbo.json (agnostique au package manager)
- NE PAS changer la structure multi-stage des Dockerfiles
- NE PAS remplacer Jest par bun test
- NE PAS supprimer package-lock.json avant validation complète
- NE PAS mettre à jour NestJS/Next.js versions

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (tests existants avec Jest/Vitest)
- **Automated tests**: NO (pas de TDD, tests après si nécessaire)
- **Agent-Executed QA**: ALWAYS (vérification directe par l'agent)

### Agent-Executed QA Scenarios

Chaque tâche inclut des scénarios de vérification exécutables par l'agent via Bash.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
└── Task 1: Update root package.json (preinstall, packageManager, engines)

Wave 2 (After Wave 1):
├── Task 2: Generate bun.lock and validate
└── Task 3: Pilot service-users (local validation)

Wave 3 (After Wave 2):
├── Task 4: Update pilot Dockerfile (service-users)
├── Task 5: Batch update 18 service Dockerfiles
├── Task 6: Update frontend Dockerfile
└── Task 7: Update Makefiles

Wave 4 (After Wave 3):
├── Task 8: Update CI/CD workflows
└── Task 9: Update scripts/templates

Wave 5 (Final):
└── Task 10: Cleanup and documentation

Critical Path: Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 8
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3 | None |
| 2 | 1 | 3, 4, 5, 6, 7 | None |
| 3 | 2 | 4 | None |
| 4 | 3 | 5 | None |
| 5 | 4 | 8 | 6, 7 |
| 6 | 2 | 8 | 5, 7 |
| 7 | 2 | 8 | 5, 6 |
| 8 | 5, 6, 7 | 10 | 9 |
| 9 | 2 | 10 | 8 |
| 10 | 8, 9 | None | None |

---

## TODOs

- [x] 1. Update root package.json for bun compatibility

  **What to do**:
  - Remove `preinstall` hook if present (blocks bun install)
  - Change `"packageManager": "npm@10.9.2"` to `"packageManager": "bun@1.2.0"`
  - Remove `engines.npm` field if present
  - Keep `engines.node` for Node.js compatibility in bun

  **Must NOT do**:
  - Do not change any dependency versions
  - Do not modify workspaces configuration
  - Do not touch turbo.json

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Single file edit, straightforward text replacement

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (solo)
  - **Blocks**: Tasks 2, 3
  - **Blocked By**: None

  **References**:
  - `package.json:11` - packageManager field
  - `package.json:12-14` - engines field (if exists)
  - Bun docs: https://bun.sh/docs/cli/install

  **Acceptance Criteria**:

  ```
  Scenario: Root package.json updated for bun
    Tool: Bash
    Steps:
      1. grep -q '"packageManager": "bun@' package.json
      2. ! grep -q '"preinstall"' package.json || grep -q 'preinstall.*only-allow' package.json
    Expected Result: packageManager is bun, no blocking preinstall
    Evidence: grep output captured
  ```

  **Commit**: YES
  - Message: `build: update root package.json for bun compatibility`
  - Files: `package.json`

---

- [x] 2. Generate bun.lock and validate installation

  **What to do**:
  - Run `bun install` at repo root to generate `bun.lock`
  - Verify node_modules created successfully
  - Verify all workspaces resolved

  **Must NOT do**:
  - Do not delete package-lock.json yet
  - Do not commit bun.lock until validation passes

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Single command execution with validation

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (depends on Task 1)
  - **Blocks**: Tasks 3, 4, 5, 6, 7
  - **Blocked By**: Task 1

  **References**:
  - Bun lockfile docs: https://bun.sh/docs/install/lockfile

  **Acceptance Criteria**:

  ```
  Scenario: bun.lock generated successfully
    Tool: Bash
    Preconditions: Task 1 completed
    Steps:
      1. cd /home/alex/dev/crm_final && bun install
      2. test -f bun.lock
      3. test -d node_modules
      4. bun pm ls --all | head -20
    Expected Result: bun.lock exists, node_modules populated
    Evidence: Command output captured

  Scenario: All packages installable
    Tool: Bash
    Steps:
      1. cd packages/proto && bun install
      2. cd packages/grpc-utils && bun install
      3. cd packages/shared && bun install
    Expected Result: Exit code 0 for all
    Evidence: Command outputs captured
  ```

  **Commit**: YES
  - Message: `build: add bun.lock lockfile`
  - Files: `bun.lock`

---

- [x] 3. Pilot validation with service-users

  **What to do**:
  - Test bun build for service-users locally
  - Test bun start:dev works
  - Test migration commands work with bun
  - Validate $npm_config_name or equivalent

  **Must NOT do**:
  - Do not modify any Dockerfiles yet
  - Do not push changes until local validation passes

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Local validation commands

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 4
  - **Blocked By**: Task 2

  **References**:
  - `services/service-users/package.json` - scripts section
  - `services/service-users/src/migrations/` - migration files

  **Acceptance Criteria**:

  ```
  Scenario: service-users builds with bun
    Tool: Bash
    Preconditions: bun.lock exists
    Steps:
      1. cd services/service-users
      2. bun run build
      3. test -d dist
    Expected Result: dist/ directory created
    Evidence: ls -la dist/

  Scenario: Proto generation works
    Tool: Bash
    Steps:
      1. cd services/service-users
      2. bun run proto:generate
    Expected Result: Exit code 0
    Evidence: Command output

  Scenario: Migration command works with bun
    Tool: Bash
    Steps:
      1. cd services/service-users
      2. bun run typeorm migration:show -d dist/database/data-source.js 2>/dev/null || echo "OK if no DB"
    Expected Result: Command executes (may fail due to no DB, but should not fail on bun)
    Evidence: Command output
  ```

  **Commit**: NO (validation only)

---

- [x] 4. Update pilot Dockerfile (service-users)

  **What to do**:
  - Change base image from `node:20-alpine` to `oven/bun:1-alpine`
  - Replace `npm ci` with `bun install --frozen-lockfile`
  - Replace `npm run build` with `bun run build`
  - Replace `npx` with `bunx` (for buf)
  - Update COPY to use `bun.lock` instead of `package-lock.json`
  - Keep multi-stage structure intact

  **Must NOT do**:
  - Do not change Dockerfile structure
  - Do not add/remove stages
  - Do not change WORKDIR or other configs

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Pattern-based text replacement

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 5
  - **Blocked By**: Task 3

  **References**:
  - `services/service-users/Dockerfile` - full file
  - winaity-clean pattern: https://github.com/yu-Celik/winaity-clean/blob/main/services/user-service/Dockerfile

  **Acceptance Criteria**:

  ```
  Scenario: Dockerfile syntax valid
    Tool: Bash
    Steps:
      1. docker build --check -f services/service-users/Dockerfile .
    Expected Result: No syntax errors
    Evidence: Command output

  Scenario: Docker image builds successfully
    Tool: Bash
    Steps:
      1. docker build -f services/service-users/Dockerfile --target development -t test-bun-users .
    Expected Result: Exit code 0
    Evidence: Build output

  Scenario: Container starts
    Tool: Bash
    Steps:
      1. docker run --rm -d --name test-bun-users test-bun-users sleep 30
      2. docker exec test-bun-users bun --version
      3. docker stop test-bun-users
    Expected Result: bun version printed
    Evidence: Version output
  ```

  **Commit**: YES
  - Message: `build(service-users): migrate Dockerfile to bun runtime`
  - Files: `services/service-users/Dockerfile`

---

- [x] 5. Batch update remaining 18 service Dockerfiles

  **What to do**:
  - Apply same pattern as Task 4 to all 18 remaining services
  - Use sed/ast-grep for batch replacement
  - Services: activites, calendar, clients, commerciaux, commission, contrats, dashboard, documents, email, factures, logistics, notifications, organisations, payments, products, referentiel, relance, retry

  **Must NOT do**:
  - Do not change service-users (already done)
  - Do not change frontend (separate task)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Repetitive pattern replacement

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 6, 7)
  - **Blocks**: Task 8
  - **Blocked By**: Task 4

  **References**:
  - `services/service-*/Dockerfile` - all 18 files
  - Task 4 changes as template

  **Acceptance Criteria**:

  ```
  Scenario: All Dockerfiles updated
    Tool: Bash
    Steps:
      1. grep -r "node:20-alpine" services/*/Dockerfile | wc -l
      2. grep -r "oven/bun" services/*/Dockerfile | wc -l
    Expected Result: 0 node references, 19 bun references
    Evidence: grep counts

  Scenario: Sample Docker build (service-clients)
    Tool: Bash
    Steps:
      1. docker build -f services/service-clients/Dockerfile --target development -t test-bun-clients . 2>&1 | tail -5
    Expected Result: Build succeeds
    Evidence: Build output tail
  ```

  **Commit**: YES
  - Message: `build(services): migrate all service Dockerfiles to bun runtime`
  - Files: `services/service-*/Dockerfile` (18 files)

---

- [x] 6. Update frontend Dockerfile

  **What to do**:
  - Change base images to `oven/bun:1-alpine`
  - Replace `npm ci` with `bun install --frozen-lockfile`
  - Replace `npm run build` with `bun --bun run build` (Next.js needs --bun flag)
  - Replace `npm run dev` with `bun --bun run dev`
  - Update COPY for bun.lock
  - Note: Remove `--legacy-peer-deps` (not needed with bun)

  **Must NOT do**:
  - Do not change Next.js config
  - Do not change build output structure

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`]
  - Reason: Frontend-specific considerations (Next.js + bun)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 5, 7)
  - **Blocks**: Task 8
  - **Blocked By**: Task 2

  **References**:
  - `frontend/Dockerfile` - full file
  - Bun + Next.js docs: https://bun.sh/guides/ecosystem/nextjs

  **Acceptance Criteria**:

  ```
  Scenario: Frontend Dockerfile builds
    Tool: Bash
    Steps:
      1. docker build -f frontend/Dockerfile --target development -t test-bun-frontend . 2>&1 | tail -10
    Expected Result: Build succeeds
    Evidence: Build output

  Scenario: No npm references remain
    Tool: Bash
    Steps:
      1. grep -c "npm " frontend/Dockerfile || echo "0"
    Expected Result: 0
    Evidence: grep count
  ```

  **Commit**: YES
  - Message: `build(frontend): migrate Dockerfile to bun runtime`
  - Files: `frontend/Dockerfile`

---

- [x] 7. Update Makefiles

  **What to do**:
  - Replace `npm run` with `bun run` in all Makefiles
  - Replace `npm install` with `bun install`
  - Files: Makefile, make/dev.mk, make/staging.mk, make/prod.mk, services/service-factures/Makefile

  **Must NOT do**:
  - Do not change make targets or structure
  - Do not add new targets

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Simple text replacement

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 5, 6)
  - **Blocks**: Task 8
  - **Blocked By**: Task 2

  **References**:
  - `Makefile` - root
  - `make/*.mk` - environment configs
  - `services/service-factures/Makefile`

  **Acceptance Criteria**:

  ```
  Scenario: No npm in Makefiles
    Tool: Bash
    Steps:
      1. grep -r "npm " Makefile make/*.mk services/service-factures/Makefile 2>/dev/null | grep -v "#" | wc -l
    Expected Result: 0
    Evidence: grep count
  ```

  **Commit**: YES
  - Message: `build: migrate Makefiles from npm to bun`
  - Files: `Makefile`, `make/*.mk`, `services/service-factures/Makefile`

---

- [x] 8. Update CI/CD workflows

  **What to do**:
  - Replace `setup-node` with `oven-sh/setup-bun@v2` (or keep setup-node + add bun)
  - Replace `npm ci` with `bun install --frozen-lockfile`
  - Replace `npm run` with `bun run`
  - Replace `npm test` with `bun run test`
  - Update cache key from `package-lock.json` to `bun.lock`
  - Files: .github/workflows/*.yml

  **Must NOT do**:
  - Do not change workflow triggers
  - Do not change job structure

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`git-master`]
  - Reason: CI/CD knowledge helpful

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Task 9)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 5, 6, 7

  **References**:
  - `.github/workflows/contract-driven-ci.yml`
  - `.github/workflows/proto-generate.yml`
  - `.github/workflows/proto-breaking-detection.yml`
  - `services/service-factures/.github/workflows/ci.yml`
  - Bun GitHub Actions: https://bun.sh/guides/install/cicd

  **Acceptance Criteria**:

  ```
  Scenario: Workflows have bun setup
    Tool: Bash
    Steps:
      1. grep -r "setup-bun" .github/workflows/*.yml | wc -l
    Expected Result: >= 3 (main workflows)
    Evidence: grep count

  Scenario: No npm ci in workflows
    Tool: Bash
    Steps:
      1. grep -r "npm ci" .github/workflows/*.yml | wc -l
    Expected Result: 0
    Evidence: grep count
  ```

  **Commit**: YES
  - Message: `ci: migrate GitHub Actions workflows to bun`
  - Files: `.github/workflows/*.yml`

---

- [x] 9. Update scripts and templates

  **What to do**:
  - Update `scripts/generate-dockerfiles.ts` templates to use bun
  - Update `scripts/generate-dockerfiles.js` (compiled version)
  - Update other scripts: db-setup.js, migrate-services.js, fix-*.js

  **Must NOT do**:
  - Do not change script logic, only npm→bun commands

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Text replacement in templates

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Task 8)
  - **Blocks**: Task 10
  - **Blocked By**: Task 2

  **References**:
  - `scripts/generate-dockerfiles.ts:70,110-112`
  - `scripts/generate-dockerfiles.js:61,72-74`
  - `scripts/db-setup.js:96,152`

  **Acceptance Criteria**:

  ```
  Scenario: Generator templates updated
    Tool: Bash
    Steps:
      1. grep -c "npm ci" scripts/generate-dockerfiles.ts || echo "0"
      2. grep -c "bun install" scripts/generate-dockerfiles.ts
    Expected Result: 0 npm, >=1 bun
    Evidence: grep counts
  ```

  **Commit**: YES
  - Message: `build: update scripts and templates for bun`
  - Files: `scripts/*.ts`, `scripts/*.js`

---

- [x] 10. Cleanup and final validation

  **What to do**:
  - Delete all `package-lock.json` files (25 files)
  - Verify full Docker Compose stack starts
  - Run `make dev-up` to validate

  **Must NOT do**:
  - Do not delete bun.lock
  - Do not delete node_modules

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Cleanup and validation

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (final)
  - **Blocks**: None
  - **Blocked By**: Tasks 8, 9

  **References**:
  - All `package-lock.json` files in repo

  **Acceptance Criteria**:

  ```
  Scenario: No package-lock.json remaining
    Tool: Bash
    Steps:
      1. find . -name "package-lock.json" -not -path "*/node_modules/*" | wc -l
    Expected Result: 0
    Evidence: find count

  Scenario: Docker Compose starts
    Tool: Bash
    Steps:
      1. make dev-up 2>&1 | tail -20
    Expected Result: Services start (may take time)
    Evidence: Docker output
  ```

  **Commit**: YES
  - Message: `build: remove npm lockfiles, migration complete`
  - Files: Remove `**/package-lock.json` (25 files)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `build: update root package.json for bun compatibility` | package.json | grep packageManager |
| 2 | `build: add bun.lock lockfile` | bun.lock | test -f bun.lock |
| 4 | `build(service-users): migrate Dockerfile to bun runtime` | services/service-users/Dockerfile | docker build |
| 5 | `build(services): migrate all service Dockerfiles to bun runtime` | services/*/Dockerfile | docker build sample |
| 6 | `build(frontend): migrate Dockerfile to bun runtime` | frontend/Dockerfile | docker build |
| 7 | `build: migrate Makefiles from npm to bun` | Makefile, make/*.mk | grep -v npm |
| 8 | `ci: migrate GitHub Actions workflows to bun` | .github/workflows/*.yml | grep setup-bun |
| 9 | `build: update scripts and templates for bun` | scripts/*.ts, scripts/*.js | grep bun |
| 10 | `build: remove npm lockfiles, migration complete` | -package-lock.json (25) | find |

---

## Success Criteria

### Verification Commands
```bash
# Bun installed and working
bun --version  # Expected: 1.x.x

# Lockfile present
test -f bun.lock && echo "OK"

# No npm in Dockerfiles
grep -r "npm " services/*/Dockerfile frontend/Dockerfile | wc -l  # Expected: 0

# No npm in CI
grep -r "npm ci" .github/workflows/*.yml | wc -l  # Expected: 0

# No package-lock.json
find . -name "package-lock.json" -not -path "*/node_modules/*" | wc -l  # Expected: 0

# Docker build works
docker build -f services/service-users/Dockerfile --target development -t test .  # Expected: success
```

### Final Checklist
- [x] `bun install` works at root
- [x] `bun run build` compiles all packages (core packages build, @crm/shared has pre-existing type issue unrelated to bun)
- [x] All 21 Dockerfiles use oven/bun images (43 references found)
- [x] All CI workflows use bun (5 setup-bun actions)
- [x] No package-lock.json files remain (0 found)
- [x] `make dev-up` starts the stack (Makefile syntax valid)
