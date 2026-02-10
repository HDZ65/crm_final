# Consolidate Dev PostgreSQL: 6 Containers → 1

## TL;DR

> **Quick Summary**: Remplacer les 6 conteneurs PostgreSQL du docker-compose dev (postgres-main + 5 bases par service) par une seule instance `postgres-main` hébergeant les 5 bases logiques. Simplifie le setup local et réduit la consommation RAM de ~5 GB.
> 
> **Deliverables**:
> - `compose/dev/infrastructure.yml` allégé (1 Postgres au lieu de 6)
> - 5× `compose/dev/service-*.yml` mis à jour (`depends_on` → `postgres-main`)
> - 5× `.env.development` mis à jour (`DB_HOST` → `postgres-main`)
> - `make/dev.mk` mis à jour (nouveau target `db-init`, `dev-wait-for-dbs` simplifié, `clean-*-db` corrigés)
> - Migrations vérifiées sur l'instance consolidée
> 
> **Estimated Effort**: Short (~1h)
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5

---

## Context

### Original Request
L'utilisateur souhaite simplifier le dev local en passant de 6 conteneurs Postgres séparés à une seule instance avec 5 bases logiques. Le pattern est déjà prouvé en staging (`crm-postgres-main`).

### Interview Summary
**Key Discussions**:
- **Init des bases** : via Makefile target (`make db-init`), pas de SQL init script
- **Réversibilité** : non — remplacement total, pas de profils Docker
- **Config .env** : mise à jour incluse dans le plan
- **postgres-main** : réutiliser le conteneur existant (déjà défini dans infrastructure.yml)
- **Vérification** : migrations doivent passer après consolidation

**Research Findings**:
- Staging utilise déjà `crm-postgres-main` avec 5 bases logiques — pattern prouvé
- `crm_main` est la DB par défaut de postgres-main (auto-créée via `POSTGRES_DB`) — aucun service ne l'utilise
- Les 5 .env.development utilisent des `DB_HOST` différents pointant vers chaque conteneur
- `scripts/docker-create-databases.sh` existe (legacy, 19 bases) — hors scope
- Docker Compose DNS résout par **service name** (`postgres-main`), pas par container_name
- Le legacy script inclut `CREATE EXTENSION "uuid-ossp"` — à reproduire dans `db-init`

### Metis Review
**Identified Gaps** (addressed):
- **DB_HOST naming** : Docker DNS résout par service name → `DB_HOST=postgres-main` (pas `dev-crm-postgres-main`)
- **CREATE DATABASE idempotence** : Postgres ne supporte pas `IF NOT EXISTS` → pattern `SELECT FROM pg_database || CREATE`
- **uuid-ossp extension** : Le legacy script l'installe → inclure dans `db-init` par sécurité
- **db-init ordering** : Doit s'exécuter APRÈS que postgres-main est ready, AVANT les services
- **Orphaned volumes** : 5 volumes Docker deviennent orphelins → documenter `docker volume prune`
- **Memory limit** : 6 conteneurs allouaient 7 GB total → postgres-main consolidé à 3 GB suffit largement
- **staging-wait-for-dbs bug** : Target stale en staging (réfère à conteneurs supprimés) — hors scope

---

## Work Objectives

### Core Objective
Consolider les 6 conteneurs PostgreSQL dev en 1 seul (`postgres-main`) avec 5 bases logiques, sans modifier le code applicatif.

### Concrete Deliverables
- `compose/dev/infrastructure.yml` : 5 services DB + 5 volumes supprimés, memory limit de postgres-main augmenté à 3G
- `compose/dev/service-core.yml` : `depends_on` → `postgres-main`
- `compose/dev/service-commercial.yml` : `depends_on` → `postgres-main`
- `compose/dev/service-engagement.yml` : `depends_on` → `postgres-main`
- `compose/dev/service-finance.yml` : `depends_on` → `postgres-main`
- `compose/dev/service-logistics.yml` : `depends_on` → `postgres-main`
- `services/service-core/.env.development` : `DB_HOST=postgres-main`
- `services/service-commercial/.env.development` : `DB_HOST=postgres-main`
- `services/service-engagement/.env.development` : `DB_HOST=postgres-main`
- `services/service-finance/.env.development` : `DB_HOST=postgres-main`
- `services/service-logistics/.env.development` : `DB_HOST=postgres-main`
- `make/dev.mk` : nouveau target `db-init`, targets DB updatés

### Definition of Done
- [x] `make dev-infra-up && make db-init` crée 5 bases dans postgres-main
- [x] `make dev-up` démarre tous les services sans erreur
- [x] `make dev-migrate-all` passe sans erreur
- [x] `make dev-verify-migrations` confirme 0 migration pending
- [x] `make clean-all-data` fonctionne (truncate via postgres-main)
- [x] Aucun ancien conteneur DB (`dev-crm-identity-db`, etc.) n'est créé

### Must Have
- Idempotence de `make db-init` (peut être exécuté plusieurs fois sans erreur)
- Extension `uuid-ossp` créée dans chaque base
- Memory limit de postgres-main augmenté (actuellement 2G, passer à 3G)
- Suppression des 5 volumes orphelins de infrastructure.yml

### Must NOT Have (Guardrails)
- **NE PAS** toucher à `compose/staging/`, `compose/prod/`, `make/staging.mk`, `make/prod.mk`
- **NE PAS** toucher au code TypeScript (aucun `.ts`, `.js`)
- **NE PAS** modifier les `.env.staging` ou `.env.production`
- **NE PAS** utiliser `docker-entrypoint-initdb.d` (choix explicite : Makefile)
- **NE PAS** ajouter de profils Docker ou mécanisme de réversibilité
- **NE PAS** renommer les bases de données (garder `identity_db`, `commercial_db`, etc.)
- **NE PAS** modifier `scripts/docker-create-databases.sh` (legacy, hors scope)
- **NE PAS** supprimer la base `crm_main` (auto-créée par `POSTGRES_DB`, inoffensive)
- **NE PAS** ajouter de port mapping sur postgres-main (rester internal-only)
- **NE PAS** créer de documentation supplémentaire (README, etc.)

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: NO (pas de tests unitaires pour infra Docker)
- **Automated tests**: None (infra-only changes)
- **Agent-Executed QA**: ALWAYS — vérification via Bash commands

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Remove 5 DB containers from infrastructure.yml
├── Task 2: Update 5 service-*.yml depends_on
└── Task 3: Update 5 .env.development files

Wave 2 (After Wave 1):
├── Task 4: Update make/dev.mk targets
└── (Task 4 needs to know final infrastructure.yml state)

Wave 3 (After Wave 2):
└── Task 5: End-to-end verification

Critical Path: Task 1 → Task 4 → Task 5
Parallel Speedup: ~30% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 4, 5 | 2, 3 |
| 2 | None | 5 | 1, 3 |
| 3 | None | 5 | 1, 2 |
| 4 | 1 | 5 | None |
| 5 | 1, 2, 3, 4 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2, 3 | delegate_task(category="quick") — parallel |
| 2 | 4 | delegate_task(category="quick") |
| 3 | 5 | delegate_task(category="quick") |

---

## TODOs

- [x] 1. Remove 5 individual Postgres containers and volumes from infrastructure.yml

  **What to do**:
  - In `compose/dev/infrastructure.yml`, remove the 5 service definitions: `engagement_db` (lines 63-87), `identity_db` (lines 89-113), `commercial_db` (lines 115-139), `finance_db` (lines 141-165), `logistics_db` (lines 167-191)
  - In the `volumes:` section at end of file, remove the 5 volume declarations: `engagement_db_data`, `identity_db_data`, `commercial_db_data`, `finance_db_data`, `logistics_db_data`
  - Increase `postgres-main` memory limit from `2G` to `3G` (line 59) to handle 5 databases
  - Keep `postgres-main` exactly as-is otherwise (same image, env, healthcheck, network)

  **Must NOT do**:
  - Do NOT remove `postgres-main`, `consul`, `redis`, `nats` services
  - Do NOT remove `postgres_main_data`, `crm_consul_data`, `crm_redis_data` volumes
  - Do NOT add port mappings to `postgres-main`
  - Do NOT change `POSTGRES_DB: crm_main`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple YAML file editing — remove blocks, change one value
  - **Skills**: []
    - No special skills needed for YAML editing

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: [4, 5]
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `compose/dev/infrastructure.yml:37-61` — `postgres-main` service definition (KEEP this exactly, only change memory limit)
  - `compose/dev/infrastructure.yml:63-191` — 5 DB service definitions to REMOVE entirely
  - `compose/dev/infrastructure.yml:213-221` — Volume declarations (remove 5, keep 3)

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: infrastructure.yml has exactly 1 Postgres service
    Tool: Bash (grep)
    Steps:
      1. grep -c "image: postgres:16-alpine" compose/dev/infrastructure.yml
      2. Assert: output is exactly "1"
    Expected Result: Only postgres-main uses postgres image
    Evidence: grep output

  Scenario: No individual DB containers defined
    Tool: Bash (grep)
    Steps:
      1. grep -E "container_name: dev-crm-(identity|commercial|finance|engagement|logistics)-db" compose/dev/infrastructure.yml
      2. Assert: exit code 1 (no matches)
    Expected Result: Zero matches for old container names
    Evidence: grep output

  Scenario: Only 3 volumes remain
    Tool: Bash (grep)
    Steps:
      1. grep -c "^\s\s\w.*:" compose/dev/infrastructure.yml | tail section after "volumes:"
      2. Verify only: crm_consul_data, crm_redis_data, postgres_main_data exist in volumes section
    Expected Result: Exactly 3 named volumes
    Evidence: grep output

  Scenario: postgres-main memory increased to 3G
    Tool: Bash (grep)
    Steps:
      1. grep "memory: 3G" compose/dev/infrastructure.yml
      2. Assert: at least 1 match in limits section
    Expected Result: Memory limit is 3G
    Evidence: grep output
  ```

  **Commit**: YES (group with 2, 3)
  - Message: `refactor(docker): consolidate 6 Postgres containers into 1 for dev`
  - Files: `compose/dev/infrastructure.yml`, `compose/dev/service-*.yml`, `services/*/. env.development`
  - Pre-commit: `docker compose -p crmdev -f compose/dev/infrastructure.yml config --quiet`

---

- [x] 2. Update all 5 service compose files to depend on postgres-main

  **What to do**:
  - In `compose/dev/service-core.yml` (line 15-17): change `depends_on` from `identity_db` to `postgres-main`
  - In `compose/dev/service-commercial.yml` (line 15-17): change `depends_on` from `commercial_db` to `postgres-main`
  - In `compose/dev/service-engagement.yml` (line 15-17): change `depends_on` from `engagement_db` to `postgres-main`
  - In `compose/dev/service-finance.yml` (line 15-17): change `depends_on` from `finance_db` to `postgres-main`
  - In `compose/dev/service-logistics.yml` (line 14-16): change `depends_on` from `logistics_db` to `postgres-main`
  - Keep `condition: service_healthy` for all

  **Exact changes per file**:
  ```yaml
  # BEFORE (example: service-core.yml)
      depends_on:
        identity_db:
          condition: service_healthy
  
  # AFTER
      depends_on:
        postgres-main:
          condition: service_healthy
  ```

  Same pattern for all 5 files, replacing `identity_db`, `commercial_db`, `engagement_db`, `finance_db`, `logistics_db` with `postgres-main`.

  **Must NOT do**:
  - Do NOT change anything else in these files (ports, volumes, env_file, healthcheck, etc.)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 5 identical single-line replacements in YAML files
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: [5]
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `compose/dev/service-core.yml:15-17` — Current: `identity_db` → Change to: `postgres-main`
  - `compose/dev/service-commercial.yml:15-17` — Current: `commercial_db` → Change to: `postgres-main`
  - `compose/dev/service-engagement.yml:15-17` — Current: `engagement_db` → Change to: `postgres-main`
  - `compose/dev/service-finance.yml:15-17` — Current: `finance_db` → Change to: `postgres-main`
  - `compose/dev/service-logistics.yml:14-16` — Current: `logistics_db` → Change to: `postgres-main`

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: All 5 service files depend on postgres-main
    Tool: Bash (grep)
    Steps:
      1. For each file in compose/dev/service-{core,commercial,engagement,finance,logistics}.yml:
         grep "postgres-main" $file
      2. Assert: each returns 1 match
      3. grep -rE "(identity_db|commercial_db|engagement_db|finance_db|logistics_db)" compose/dev/service-*.yml
      4. Assert: exit code 1 (no matches — old DB names gone)
    Expected Result: All services depend on postgres-main, zero references to old containers
    Evidence: grep output

  Scenario: YAML syntax is valid
    Tool: Bash
    Steps:
      1. docker compose -p crmdev -f compose/dev/infrastructure.yml -f compose/dev/service-core.yml config --quiet
      2. Assert: exit code 0 for all 5 service files
    Expected Result: Docker Compose parses all files without error
    Evidence: exit codes
  ```

  **Commit**: YES (group with 1, 3 — same commit)
  - Message: (grouped with Task 1)
  - Files: `compose/dev/service-core.yml`, `compose/dev/service-commercial.yml`, `compose/dev/service-engagement.yml`, `compose/dev/service-finance.yml`, `compose/dev/service-logistics.yml`

---

- [x] 3. Update all 5 .env.development files to point DB_HOST to postgres-main

  **What to do**:
  - In `services/service-core/.env.development` (line 5): change `DB_HOST=identity_db` to `DB_HOST=postgres-main`
  - In `services/service-core/.env.development` (line 4): update comment to `# Database (postgres-main, identity_db database)`
  - In `services/service-commercial/.env.development` (line 5): change `DB_HOST=commercial_db` to `DB_HOST=postgres-main`
  - In `services/service-commercial/.env.development` (line 4): update comment to `# Database (postgres-main, commercial_db database)`
  - In `services/service-engagement/.env.development` (line 5): change `DB_HOST=engagement_db` to `DB_HOST=postgres-main`
  - In `services/service-engagement/.env.development` (line 4): update comment to `# Database (postgres-main, engagement_db database)`
  - In `services/service-finance/.env.development` (line 5): change `DB_HOST=finance_db` to `DB_HOST=postgres-main`
  - In `services/service-finance/.env.development` (line 4): update comment to `# Database (postgres-main, finance_db database)`
  - In `services/service-logistics/.env.development` (line 5): change `DB_HOST=logistics_db` to `DB_HOST=postgres-main`
  - In `services/service-logistics/.env.development` (line 4): update comment to `# Database (postgres-main, logistics_db database)`

  **CRITICAL**: Keep `DB_DATABASE` unchanged in each file! Only `DB_HOST` changes.

  **Must NOT do**:
  - Do NOT change `DB_DATABASE`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`
  - Do NOT change any other env variables (GRPC_PORT, NATS_URL, etc.)
  - Do NOT touch `.env.staging` or `.env.production` files

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 5 identical single-line replacements in env files
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: [5]
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-core/.env.development:4-5` — `DB_HOST=identity_db` → `DB_HOST=postgres-main`
  - `services/service-commercial/.env.development:4-5` — `DB_HOST=commercial_db` → `DB_HOST=postgres-main`
  - `services/service-engagement/.env.development:4-5` — `DB_HOST=engagement_db` → `DB_HOST=postgres-main`
  - `services/service-finance/.env.development:4-5` — `DB_HOST=finance_db` → `DB_HOST=postgres-main`
  - `services/service-logistics/.env.development:4-5` — `DB_HOST=logistics_db` → `DB_HOST=postgres-main`

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: All 5 .env.development files use postgres-main as DB_HOST
    Tool: Bash (grep)
    Steps:
      1. grep "DB_HOST=postgres-main" services/service-core/.env.development
      2. grep "DB_HOST=postgres-main" services/service-commercial/.env.development
      3. grep "DB_HOST=postgres-main" services/service-engagement/.env.development
      4. grep "DB_HOST=postgres-main" services/service-finance/.env.development
      5. grep "DB_HOST=postgres-main" services/service-logistics/.env.development
      6. Assert: all 5 return exactly 1 match
    Expected Result: DB_HOST=postgres-main in all files
    Evidence: grep output

  Scenario: DB_DATABASE values are preserved (not changed)
    Tool: Bash (grep)
    Steps:
      1. grep "DB_DATABASE=identity_db" services/service-core/.env.development
      2. grep "DB_DATABASE=commercial_db" services/service-commercial/.env.development
      3. grep "DB_DATABASE=engagement_db" services/service-engagement/.env.development
      4. grep "DB_DATABASE=finance_db" services/service-finance/.env.development
      5. grep "DB_DATABASE=logistics_db" services/service-logistics/.env.development
      6. Assert: all 5 return exactly 1 match
    Expected Result: Database names unchanged
    Evidence: grep output

  Scenario: No old DB_HOST values remain
    Tool: Bash (grep)
    Steps:
      1. grep -rn "DB_HOST=" services/*/. env.development | grep -v "postgres-main"
      2. Assert: exit code 1 (no matches)
    Expected Result: Zero references to old hostnames
    Evidence: grep output
  ```

  **Commit**: YES (group with 1, 2 — same commit)
  - Message: (grouped with Task 1)
  - Files: `services/service-*/.env.development`

---

- [x] 4. Update make/dev.mk: add db-init target, update dev-wait-for-dbs, update clean-*-db targets

  **What to do**:

  **4a. Add `db-init` target** (insert after `dev-infra-logs:` target, around line 50):
  ```makefile
  # Create all databases in postgres-main (idempotent)
  db-init:
  	@echo "=== Creating databases in postgres-main ==="
  	@echo "Waiting for postgres-main to be ready..."
  	@timeout=60; elapsed=0; \
  	while ! docker exec dev-crm-postgres-main pg_isready -U $${DB_USERNAME:-postgres} -q 2>/dev/null; do \
  		sleep 2; elapsed=$$((elapsed + 2)); \
  		if [ $$elapsed -ge $$timeout ]; then \
  			echo "ERROR: Timeout waiting for postgres-main after $${timeout}s"; \
  			exit 1; \
  		fi; \
  	done
  	@for db in identity_db commercial_db finance_db engagement_db logistics_db; do \
  		echo "Creating database $$db (if not exists)..."; \
  		docker exec dev-crm-postgres-main psql -U $${DB_USERNAME:-postgres} -tc \
  			"SELECT 1 FROM pg_database WHERE datname='$$db'" | grep -q 1 \
  			|| docker exec dev-crm-postgres-main psql -U $${DB_USERNAME:-postgres} -c \
  			"CREATE DATABASE $$db"; \
  		echo "  Installing uuid-ossp extension..."; \
  		docker exec dev-crm-postgres-main psql -U $${DB_USERNAME:-postgres} -d $$db -c \
  			"CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\""; \
  	done
  	@echo "=== All databases ready ==="
  ```

  **4b. Update `dev-wait-for-dbs`** (replace lines 260-282):
  Replace the current target that loops over 6 `"container:dbname"` pairs with a version that checks only `dev-crm-postgres-main` for each database:
  ```makefile
  dev-wait-for-dbs:
  	@echo "=== Waiting for DEV databases to be ready ==="
  	@for db in crm_main identity_db commercial_db finance_db engagement_db logistics_db; do \
  		echo "Waiting for postgres-main ($$db)..."; \
  		timeout=60; elapsed=0; \
  		while ! docker exec dev-crm-postgres-main pg_isready -U $${DB_USERNAME:-postgres} -d $$db -q 2>/dev/null; do \
  			sleep 2; elapsed=$$((elapsed + 2)); \
  			if [ $$elapsed -ge $$timeout ]; then \
  				echo "ERROR: Timeout waiting for $$db after $${timeout}s"; \
  				exit 1; \
  			fi; \
  		done; \
  		echo "  $$db ready"; \
  	done
  	@echo "=== All DEV databases ready ==="
  ```

  **4c. Update all 5 `clean-*-db` targets** (lines 375-408):
  Change `docker exec dev-crm-identity-db` → `docker exec dev-crm-postgres-main` (same for all 5 targets). Only the container name changes; the `-d <dbname>` stays the same.

  Exact replacements:
  - `clean-core-db`: `docker exec dev-crm-identity-db` → `docker exec dev-crm-postgres-main`
  - `clean-commercial-db`: `docker exec dev-crm-commercial-db` → `docker exec dev-crm-postgres-main`
  - `clean-finance-db`: `docker exec dev-crm-finance-db` → `docker exec dev-crm-postgres-main`
  - `clean-engagement-db`: `docker exec dev-crm-engagement-db` → `docker exec dev-crm-postgres-main`
  - `clean-logistics-db`: `docker exec dev-crm-logistics-db` → `docker exec dev-crm-postgres-main`

  **4d. Update `clean-all-dbs` target** (lines 413-421):
  Add `$(MAKE) db-init` after `$(DEV_ALL) up -d --build` and before `dev-wait-for-dbs`:
  ```makefile
  clean-all-dbs:
  	@echo "=== Stopping services and removing all volumes ==="
  	$(DEV_ALL) down -v
  	@echo "=== Rebuilding and starting ==="
  	$(DEV_ALL) up -d --build
  	$(MAKE) db-init
  	$(MAKE) dev-wait-for-dbs
  	$(MAKE) dev-migrate-all
  	$(MAKE) dev-verify-migrations
  	@echo "=== Done ==="
  ```

  **4e. Add `db-init` to `.PHONY`** (line 5-16):
  Add `db-init` to the `.PHONY` declaration list.

  **Must NOT do**:
  - Do NOT modify `dev-migrate-all`, `dev-verify-migrations`, or `dev-health-check` targets (they use service container names, not DB container names)
  - Do NOT modify service-specific targets (`service-core-migrate`, etc.)
  - Do NOT modify `dev-db-reset` (it already targets `postgres-main`)
  - Do NOT touch `make/staging.mk` or `make/prod.mk`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Makefile editing — text replacement + new target insertion. No complex logic.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential after Wave 1)
  - **Blocks**: [5]
  - **Blocked By**: [1] (needs to know final infrastructure.yml state)

  **References**:

  **Pattern References**:
  - `make/dev.mk:260-282` — Current `dev-wait-for-dbs` target to REPLACE (loops over 6 container:db pairs)
  - `make/dev.mk:375-408` — Current 5 `clean-*-db` targets to UPDATE (change container name only)
  - `make/dev.mk:413-421` — Current `clean-all-dbs` target to UPDATE (add db-init step)
  - `make/dev.mk:363-373` — `dev-db-reset` target (KEEP AS-IS — already uses postgres-main)
  - `scripts/docker-create-databases.sh` — Legacy script showing idempotent CREATE DATABASE pattern and uuid-ossp extension install (use as reference for `db-init` logic, do NOT modify this file)

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: db-init target exists and is in .PHONY
    Tool: Bash (grep)
    Steps:
      1. grep "db-init" make/dev.mk | head -5
      2. Assert: at least 2 matches (one in .PHONY, one as target definition)
    Expected Result: db-init is declared and defined
    Evidence: grep output

  Scenario: dev-wait-for-dbs references only dev-crm-postgres-main
    Tool: Bash (grep)
    Steps:
      1. Extract dev-wait-for-dbs target body from make/dev.mk
      2. grep "dev-crm-postgres-main" → assert at least 1 match
      3. grep -E "dev-crm-(identity|commercial|finance|engagement|logistics)-db" → assert 0 matches in that section
    Expected Result: Only postgres-main container referenced
    Evidence: grep output

  Scenario: All 5 clean-*-db targets use dev-crm-postgres-main
    Tool: Bash (grep)
    Steps:
      1. grep "docker exec dev-crm-postgres-main" make/dev.mk | grep -c "clean"
      2. Assert: output is "5"
      3. grep -E "docker exec dev-crm-(identity|commercial|finance|engagement|logistics)-db" make/dev.mk
      4. Assert: exit code 1 (no matches anywhere in file)
    Expected Result: Zero references to old per-service DB containers
    Evidence: grep output

  Scenario: clean-all-dbs includes db-init step
    Tool: Bash (grep)
    Steps:
      1. grep -A 10 "^clean-all-dbs:" make/dev.mk | grep "db-init"
      2. Assert: 1 match
    Expected Result: db-init is called in clean-all-dbs workflow
    Evidence: grep output

  Scenario: No references to old DB container names remain in make/dev.mk
    Tool: Bash (grep)
    Steps:
      1. grep -nE "dev-crm-(identity|commercial|finance|engagement|logistics)-db" make/dev.mk
      2. Assert: exit code 1 (zero matches)
    Expected Result: Complete elimination of old container references
    Evidence: grep output
  ```

  **Commit**: YES
  - Message: `refactor(make): update dev.mk targets for consolidated Postgres`
  - Files: `make/dev.mk`
  - Pre-commit: `make -n db-init` (dry-run to validate syntax)

---

- [x] 5. End-to-end verification: spin up, init, migrate, verify

  **What to do**:
  - Stop and clean any existing dev containers: `make dev-down` (ignore errors if nothing running)
  - Remove orphaned volumes from old containers: `docker volume rm crmdev_engagement_db_data crmdev_identity_db_data crmdev_commercial_db_data crmdev_finance_db_data crmdev_logistics_db_data 2>/dev/null || true`
  - Start infrastructure: `make dev-infra-up`
  - Initialize databases: `make db-init`
  - Verify databases exist: `docker exec dev-crm-postgres-main psql -U postgres -tc "SELECT datname FROM pg_database WHERE datname IN ('identity_db','commercial_db','finance_db','engagement_db','logistics_db') ORDER BY datname"`
  - Start all services: `make dev-up`
  - Wait for readiness: `make dev-wait-for-dbs`
  - Run migrations: `make dev-migrate-all`
  - Verify migrations: `make dev-verify-migrations`
  - Health check: `make dev-health-check`
  - Verify old containers don't exist: `docker ps -a --filter "name=dev-crm-identity-db" --format "{{.Names}}"` (repeat for all 5)

  **Must NOT do**:
  - Do NOT run `docker volume prune` (too aggressive — may remove unrelated volumes)
  - Do NOT modify any files in this task — pure verification only

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Sequential command execution and assertion checking
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (final, sequential)
  - **Blocks**: None (final task)
  - **Blocked By**: [1, 2, 3, 4]

  **References**:

  **Pattern References**:
  - `make/dev.mk:413-421` — `clean-all-dbs` target shows the full workflow: down -v → up → wait → migrate → verify

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Complete dev environment starts with consolidated Postgres
    Tool: Bash
    Preconditions: All files from Tasks 1-4 are modified
    Steps:
      1. make dev-down 2>/dev/null || true
      2. docker volume rm crmdev_engagement_db_data crmdev_identity_db_data crmdev_commercial_db_data crmdev_finance_db_data crmdev_logistics_db_data 2>/dev/null || true
      3. make dev-infra-up
      4. Assert: exit code 0
      5. make db-init
      6. Assert: exit code 0 and output contains "All databases ready"
    Expected Result: Infrastructure starts and all 5 databases created
    Evidence: Command output

  Scenario: All 5 databases exist in postgres-main
    Tool: Bash
    Preconditions: db-init has completed
    Steps:
      1. docker exec dev-crm-postgres-main psql -U postgres -tc "SELECT count(*) FROM pg_database WHERE datname IN ('identity_db','commercial_db','finance_db','engagement_db','logistics_db')"
      2. Assert: output trim is "5"
    Expected Result: Exactly 5 databases present
    Evidence: psql output

  Scenario: uuid-ossp extension installed in all databases
    Tool: Bash
    Steps:
      1. For each db in identity_db commercial_db finance_db engagement_db logistics_db:
         docker exec dev-crm-postgres-main psql -U postgres -d $db -tc "SELECT 1 FROM pg_extension WHERE extname='uuid-ossp'"
      2. Assert: each returns "1"
    Expected Result: Extension present in all 5 databases
    Evidence: psql output

  Scenario: All services start and migrations pass
    Tool: Bash
    Steps:
      1. make dev-up
      2. Assert: exit code 0
      3. make dev-wait-for-dbs
      4. Assert: exit code 0
      5. make dev-migrate-all
      6. Assert: exit code 0
      7. make dev-verify-migrations
      8. Assert: exit code 0
    Expected Result: Full stack starts, all migrations applied
    Evidence: Command outputs

  Scenario: Old DB containers do not exist
    Tool: Bash
    Steps:
      1. docker ps -a --filter "name=dev-crm-identity-db" --format "{{.Names}}"
      2. docker ps -a --filter "name=dev-crm-commercial-db" --format "{{.Names}}"
      3. docker ps -a --filter "name=dev-crm-finance-db" --format "{{.Names}}"
      4. docker ps -a --filter "name=dev-crm-engagement-db" --format "{{.Names}}"
      5. docker ps -a --filter "name=dev-crm-logistics-db" --format "{{.Names}}"
      6. Assert: all 5 return empty output
    Expected Result: Zero old containers running or stopped
    Evidence: docker output

  Scenario: Health checks pass for all services
    Tool: Bash
    Steps:
      1. make dev-health-check
      2. Assert: output does NOT contain "Not available" for core, commercial, finance, engagement services
    Expected Result: All services respond to health checks
    Evidence: Health check output

  Scenario: db-init is idempotent (run twice without error)
    Tool: Bash
    Steps:
      1. make db-init
      2. Assert: exit code 0
      3. make db-init (again)
      4. Assert: exit code 0
    Expected Result: Second run succeeds without "already exists" errors
    Evidence: Command output
  ```

  **Commit**: NO (verification only, no file changes)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1+2+3 | `refactor(docker): consolidate 6 Postgres containers into 1 for dev` | infrastructure.yml, 5× service-*.yml, 5× .env.development | `docker compose config --quiet` |
| 4 | `refactor(make): update dev.mk targets for consolidated Postgres` | make/dev.mk | `make -n db-init` |
| 5 | (no commit — verification only) | — | `make dev-migrate-all && make dev-verify-migrations` |

---

## Success Criteria

### Verification Commands
```bash
# Full verification sequence
make dev-down 2>/dev/null || true
make dev-infra-up                    # Expected: 1 Postgres container starts
make db-init                         # Expected: 5 databases created, exit 0
make dev-up                          # Expected: all services start, exit 0
make dev-wait-for-dbs                # Expected: "All DEV databases ready"
make dev-migrate-all                 # Expected: all migrations pass, exit 0
make dev-verify-migrations           # Expected: "All DEV migrations verified"
make dev-health-check                # Expected: all services respond
docker ps --format "table {{.Names}}" | grep postgres  # Expected: only dev-crm-postgres-main
```

### Final Checklist
- [x] Only 1 Postgres container running (`dev-crm-postgres-main`)
- [x] 5 logical databases created (`identity_db`, `commercial_db`, `finance_db`, `engagement_db`, `logistics_db`)
- [x] `uuid-ossp` extension in all 5 databases
- [x] All 5 services connect and migrations pass
- [x] `make db-init` is idempotent (run twice = no error)
- [x] `make clean-all-data` works against consolidated container
- [x] Zero references to old DB container names in `compose/dev/` and `make/dev.mk`
- [x] No TypeScript code modified
- [x] No staging/prod files modified
