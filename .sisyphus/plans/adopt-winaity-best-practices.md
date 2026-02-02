# Adoption des Best Practices winaity-clean

## TL;DR

> **Quick Summary**: Refactorer crm_final pour adopter les patterns de winaity-clean: Docker multi-stage, pipeline proto dual-target, clients gRPC modulaires avec authentification, et compose par environnement.
> 
> **Deliverables**:
> - Dockerfiles optimisés avec 4 stages et dumb-init
> - Pipeline proto avec dual generation (backend NestJS / frontend)
> - Clients gRPC modulaires par domaine avec auth tokens
> - Intercepteur auth sur tous les services NestJS
> - Structure compose par environnement (dev/staging/prod)
> - Upgrade NextAuth v4 → v5
> 
> **Estimated Effort**: Large (5-7 jours)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Docker → Proto → gRPC (security) → Compose → Auth

---

## Context

### Original Request
Comparer crm_final avec winaity-clean et adopter les bonnes pratiques pour:
- Docker, Proto/Types, gRPC clients, Auth, Compose

### Interview Summary
**Key Discussions**:
- Projet en développement actif - peut casser des choses
- Aucune contrainte technique
- Tests après implémentation
- **Découverte critique**: Appels gRPC sans authentification!

**Research Findings**:
- winaity-clean utilise Bun, 4-stage Docker, dual proto gen, Consul
- crm_final utilise Node.js, 2-stage Docker, package @crm/proto
- Frontend gRPC client = 3000+ lignes dans un seul fichier
- gRPC credentials.createInsecure() - pas de token passé

### Metis Review
**Identified Gaps** (addressed):
- Gap sécurité gRPC: Ajouté au scope comme priorité
- Dockerfile.base orphelin: À supprimer
- Loader.ts inutilisé: À supprimer avec refactor gRPC

---

## Work Objectives

### Core Objective
Moderniser l'infrastructure de crm_final en adoptant les patterns éprouvés de winaity-clean, avec un focus sur la sécurité gRPC et l'optimisation des builds.

### Concrete Deliverables
1. Template Dockerfile 4-stage avec dumb-init
2. 19 Dockerfiles de services mis à jour
3. buf.gen.yaml avec dual generation
4. Clients gRPC modulaires (1 fichier par domaine)
5. Auth interceptor NestJS pour validation tokens
6. Structure compose/ avec dev/, staging/, prod/
7. Migration NextAuth v4 → v5

### Definition of Done
- [ ] `docker compose build` réussit sans warning
- [ ] `npm run proto:generate` génère ts/ ET ts-frontend/
- [ ] Appels gRPC incluent Bearer token dans metadata
- [ ] Services rejettent les appels sans token valide
- [ ] Tests E2E passent (`cd tests/e2e && npm run test:mock`)

### Must Have
- Security: Tokens JWT dans gRPC metadata
- Backward compatible: Services continuent à fonctionner pendant migration
- Pas de downtime: Chaque changement peut être déployé indépendamment

### Must NOT Have (Guardrails)
- NE PAS migrer vers Bun (rester sur Node.js 20)
- NE PAS supprimer @crm/proto package (meilleur que copie manuelle)
- NE PAS ajouter Consul/NATS (over-engineering pour ce projet)
- NE PAS changer la structure des .proto files
- NE PAS modifier la logique métier des services

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES (tests/e2e/, *.spec.ts)
- **User wants tests**: YES (Tests after implementation)
- **Framework**: Existing NestJS Jest tests + E2E

### Automated Verification

**For Docker changes:**
```bash
# Build all services
docker compose build --parallel
# Verify containers start
docker compose up -d
# Check health endpoints
docker compose ps --format json | jq '.[].State'
# Assert: All states are "running"
```

**For Proto changes:**
```bash
# Generate types
cd packages/proto && npm run generate
# Verify dual output exists
ls -la gen/ts/clients/clients.ts
ls -la gen/ts-frontend/clients/clients.ts
# Assert: Both files exist
```

**For gRPC auth:**
```bash
# Call service without token (should fail)
grpcurl -plaintext localhost:60052 clients.ClientBaseService/List
# Assert: Returns UNAUTHENTICATED error

# Call with valid token (should succeed)
grpcurl -H "authorization: Bearer $TOKEN" -plaintext localhost:60052 clients.ClientBaseService/List
# Assert: Returns client list
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Infrastructure - Start Immediately):
├── Task 1: Docker template et scripts
├── Task 2: Proto dual generation config
└── Task 7: Compose structure par environnement

Wave 2 (Depends on Wave 1):
├── Task 3: Appliquer Docker template aux 19 services
├── Task 4: Automatiser proto:copy dans frontend
└── Task 5: Refactorer gRPC client en modules

Wave 3 (Depends on Wave 2):
├── Task 6: Ajouter auth aux appels gRPC frontend
├── Task 8: Auth interceptor backend
└── Task 9: NextAuth v4 → v5

Wave 4 (Final):
└── Task 10: Cleanup et tests E2E
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3 | 2, 7 |
| 2 | None | 4 | 1, 7 |
| 3 | 1 | 10 | 4, 5 |
| 4 | 2 | 6 | 3, 5 |
| 5 | None | 6, 8 | 3, 4 |
| 6 | 4, 5 | 9 | 8 |
| 7 | None | 10 | 1, 2 |
| 8 | 5 | 9 | 6 |
| 9 | 6, 8 | 10 | None |
| 10 | 3, 9 | None | None (final) |

---

## TODOs

### Wave 1: Infrastructure (Parallel)

- [x] 1. Créer template Dockerfile 4-stage avec dumb-init

  **What to do**:
  - Créer `docker/Dockerfile.template` avec 4 stages: deps, development, builder, production
  - Ajouter `dumb-init` dans le stage production
  - Créer script `scripts/generate-dockerfiles.ts` pour générer les Dockerfiles des services
  - Supprimer `Dockerfile.base` obsolète

  **Must NOT do**:
  - Ne pas migrer vers Bun
  - Ne pas changer les ports des services

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`
    - Tâche straightforward de création de fichiers Docker

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 7)
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References**:
  - `Dockerfile.base:17-64` - Structure actuelle à améliorer
  - `services/service-clients/Dockerfile` - Exemple de service Dockerfile actuel
  - winaity-clean: `services/user-service/Dockerfile` - Pattern 4-stage à adopter

  **Acceptance Criteria**:
  ```bash
  # Verify template exists with 4 stages
  grep -c "^FROM" docker/Dockerfile.template
  # Assert: Returns 4
  
  # Verify dumb-init is present
  grep "dumb-init" docker/Dockerfile.template
  # Assert: Found
  
  # Verify Dockerfile.base is removed
  test ! -f Dockerfile.base
  # Assert: Exit code 0
  ```

  **Commit**: YES
  - Message: `build(docker): add 4-stage Dockerfile template with dumb-init`
  - Files: `docker/Dockerfile.template`, `scripts/generate-dockerfiles.ts`

---

- [x] 2. Configurer dual proto generation (backend + frontend)

  **What to do**:
  - Modifier `packages/proto/buf.gen.yaml` pour ajouter output `gen/ts-frontend/`
  - Configurer options: `nestJs=false`, `snakeToCamel=true` pour frontend
  - Mettre à jour `packages/proto/package.json` scripts
  - Vérifier que `proto/gen/ts-frontend/` est généré correctement

  **Must NOT do**:
  - Ne pas changer les fichiers .proto
  - Ne pas modifier la génération backend existante

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 7)
  - **Blocks**: Task 4
  - **Blocked By**: None

  **References**:
  - `packages/proto/buf.gen.yaml:1-20` - Config actuelle single-target
  - winaity-clean: `packages/proto/buf.gen.yaml` - Pattern dual-target à adopter
  - `frontend/package.json:11` - Script proto:copy actuel

  **Acceptance Criteria**:
  ```bash
  # Generate protos
  cd packages/proto && npm run generate
  
  # Verify both outputs exist
  test -f gen/ts/clients/clients.ts && test -f gen/ts-frontend/clients/clients.ts
  # Assert: Exit code 0
  
  # Verify frontend types don't have NestJS imports
  grep -c "@nestjs" gen/ts-frontend/clients/clients.ts || echo "0"
  # Assert: Returns 0
  
  # Verify backend types have NestJS imports
  grep -c "@nestjs" gen/ts/clients/clients.ts
  # Assert: Returns > 0
  ```

  **Commit**: YES
  - Message: `build(proto): add dual generation for backend and frontend`
  - Files: `packages/proto/buf.gen.yaml`, `packages/proto/package.json`

---

- [x] 7. Créer structure compose par environnement

  **What to do**:
  - Créer `compose/dev/`, `compose/staging/`, `compose/prod/`
  - Migrer `docker-compose.yml` vers `compose/dev/services.yml`
  - Créer `compose/dev/infrastructure.yml` pour postgres
  - Créer fichiers de base pour staging/prod (squelettes)
  - Garder `docker-compose.yml` à la racine comme symlink ou wrapper

  **Must NOT do**:
  - Ne pas supprimer docker-compose.yml immédiatement (backward compat)
  - Ne pas ajouter Consul, NATS, Redis (pas nécessaire)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 10
  - **Blocked By**: None

  **References**:
  - `docker-compose.yml:1-376` - Config actuelle monolithique
  - winaity-clean: `compose/dev/infrastructure.yml` - Pattern par environnement

  **Acceptance Criteria**:
  ```bash
  # Verify structure exists
  test -d compose/dev && test -d compose/staging && test -d compose/prod
  # Assert: Exit code 0
  
  # Verify dev compose works
  docker compose -f compose/dev/services.yml config --quiet
  # Assert: Exit code 0
  
  # Verify backward compat
  docker compose config --quiet
  # Assert: Exit code 0
  ```

  **Commit**: YES
  - Message: `build(compose): restructure into per-environment directories`
  - Files: `compose/`, `docker-compose.yml`

---

### Wave 2: Application des Templates (Parallel)

- [x] 3. Appliquer template Docker aux 19 services

  **What to do**:
  - Exécuter script de génération pour tous les services
  - Vérifier que chaque Dockerfile généré est valide
  - Tester build d'un service sample

  **Must NOT do**:
  - Ne pas modifier les ports ou configs
  - Ne pas changer les entry points

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: `[]`
    - Tâche répétitive d'application de template

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Task 10
  - **Blocked By**: Task 1

  **References**:
  - `docker/Dockerfile.template` - Template créé en Task 1
  - `services/*/Dockerfile` - 19 Dockerfiles à mettre à jour

  **Acceptance Criteria**:
  ```bash
  # Run generation script
  npx ts-node scripts/generate-dockerfiles.ts
  
  # Count Dockerfiles with 4 stages
  for svc in services/service-*; do
    grep -c "^FROM" $svc/Dockerfile
  done | sort | uniq -c
  # Assert: All show "4"
  
  # Test build one service
  docker build -f services/service-clients/Dockerfile -t test-clients .
  # Assert: Exit code 0
  ```

  **Commit**: YES
  - Message: `build(docker): apply 4-stage template to all 19 services`
  - Files: `services/*/Dockerfile`

---

- [x] 4. Automatiser proto:copy dans frontend Docker build

  **What to do**:
  - Modifier `frontend/Dockerfile` pour copier depuis `packages/proto/gen/ts-frontend/`
  - Supprimer dépendance au script `proto:copy` manuel
  - Mettre à jour path alias `@proto` si nécessaire

  **Must NOT do**:
  - Ne pas changer les imports existants dans le frontend
  - Ne pas supprimer le script proto:copy (utile pour dev local)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5)
  - **Blocks**: Task 6
  - **Blocked By**: Task 2

  **References**:
  - `frontend/Dockerfile:1-50` - Dockerfile actuel
  - `frontend/package.json:11` - Script proto:copy
  - winaity-clean: `frontend/Dockerfile:74-76` - Pattern de copie au build

  **Acceptance Criteria**:
  ```bash
  # Build frontend
  docker build -f frontend/Dockerfile -t test-frontend .
  # Assert: Exit code 0
  
  # Verify proto files in image
  docker run --rm test-frontend ls -la src/proto/clients/
  # Assert: Shows clients.ts
  ```

  **Commit**: YES
  - Message: `build(frontend): automate proto copy in Docker build`
  - Files: `frontend/Dockerfile`

---

- [x] 5. Refactorer gRPC client en modules par domaine

  **What to do**:
  - Créer `frontend/src/lib/grpc/clients/` directory
  - Extraire chaque service dans son propre fichier (clients.ts, factures.ts, etc.)
  - Créer `frontend/src/lib/grpc/index.ts` qui réexporte tout
  - Supprimer `frontend/src/lib/grpc/loader.ts` si inutilisé

  **Must NOT do**:
  - Ne pas changer les signatures des fonctions
  - Ne pas casser les imports existants (réexporter)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`
    - Refactoring complexe avec 3000+ lignes à réorganiser

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4)
  - **Blocks**: Tasks 6, 8
  - **Blocked By**: None

  **References**:
  - `frontend/src/lib/grpc/index.ts:1-3000+` - Fichier monolithique à splitter
  - winaity-clean: `frontend/src/features/contacts/grpc/client.ts` - Pattern modulaire

  **Acceptance Criteria**:
  ```bash
  # Verify modules created
  ls frontend/src/lib/grpc/clients/*.ts | wc -l
  # Assert: >= 10 files
  
  # Verify index reexports
  grep "export \* from" frontend/src/lib/grpc/index.ts | wc -l
  # Assert: >= 10
  
  # Verify TypeScript compiles
  cd frontend && npm run type-check
  # Assert: Exit code 0
  
  # Verify no duplicate exports
  grep "export const clients" frontend/src/lib/grpc/index.ts | wc -l
  # Assert: Returns 1
  ```

  **Commit**: YES
  - Message: `refactor(frontend): split gRPC client into domain modules`
  - Files: `frontend/src/lib/grpc/`

---

### Wave 3: Sécurité et Auth (Parallel partiel)

- [x] 6. Ajouter auth tokens aux appels gRPC frontend

  **What to do**:
  - Créer `frontend/src/lib/grpc/auth.ts` avec helper pour metadata
  - Modifier chaque client pour utiliser `credentials.createFromMetadataGenerator()`
  - Injecter le token depuis la session NextAuth
  - Gérer le cas où pas de token (appels publics)

  **Must NOT do**:
  - Ne pas bloquer les appels publics (health checks)
  - Ne pas stocker le token en clair

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`
    - Tâche sécurité critique nécessitant réflexion approfondie

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 8)
  - **Blocks**: Task 9
  - **Blocked By**: Tasks 4, 5

  **References**:
  - `frontend/src/lib/auth/keycloak.ts:25-31` - Gestion des tokens
  - `frontend/src/hooks/auth/useAuth.ts` - Hook auth frontend
  - winaity-clean: `frontend/src/lib/grpc/helpers.ts:24-85` - Pattern auth gRPC

  **Acceptance Criteria**:
  ```bash
  # Verify auth helper exists
  test -f frontend/src/lib/grpc/auth.ts
  # Assert: Exit code 0
  
  # Verify createFromMetadataGenerator usage
  grep -r "createFromMetadataGenerator" frontend/src/lib/grpc/
  # Assert: Found in multiple files
  
  # TypeScript check
  cd frontend && npm run type-check
  # Assert: Exit code 0
  ```

  **Commit**: YES
  - Message: `feat(frontend): add JWT tokens to gRPC calls`
  - Files: `frontend/src/lib/grpc/auth.ts`, `frontend/src/lib/grpc/clients/*.ts`

---

- [x] 8. Créer auth interceptor NestJS pour valider tokens

  **What to do**:
  - Créer `packages/grpc-utils/src/interceptors/auth.interceptor.ts`
  - Valider JWT token depuis gRPC metadata `authorization`
  - Extraire userId et ajouter au contexte de requête
  - Permettre bypass pour endpoints publics (health, etc.)

  **Must NOT do**:
  - Ne pas valider le token contre Keycloak à chaque requête (trop lent)
  - Ne pas bloquer les health checks

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`
    - Sécurité backend critique

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 6)
  - **Blocks**: Task 9
  - **Blocked By**: Task 5

  **References**:
  - `packages/grpc-utils/src/` - Package utilitaires gRPC existant
  - `services/service-users/src/modules/auth-sync/` - Logique auth existante
  - `packages/proto/src/security/auth.proto:351-495` - Définitions auth proto

  **Acceptance Criteria**:
  ```bash
  # Verify interceptor exists
  test -f packages/grpc-utils/src/interceptors/auth.interceptor.ts
  # Assert: Exit code 0
  
  # Verify interceptor is exported
  grep "AuthInterceptor" packages/grpc-utils/src/index.ts
  # Assert: Found
  
  # Build grpc-utils
  npm run build --workspace=@crm/grpc-utils
  # Assert: Exit code 0
  ```

  **Commit**: YES
  - Message: `feat(grpc-utils): add JWT auth interceptor for gRPC services`
  - Files: `packages/grpc-utils/src/interceptors/`

---

- [x] 9. Migrer NextAuth v4 vers v5 (auth.js)

  **What to do**:
  - Mettre à jour `next-auth` vers `^5.0.0` (auth.js)
  - Migrer `frontend/src/lib/auth/` vers nouvelle API
  - Adapter les callbacks JWT et session
  - Tester login/logout flow complet

  **Must NOT do**:
  - Ne pas changer la logique Keycloak
  - Ne pas modifier les routes protégées

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`
    - Migration avec breaking changes potentiels

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Tasks 6, 8)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 6, 8

  **References**:
  - `frontend/src/lib/auth/` - Implémentation actuelle NextAuth v4
  - `frontend/src/middleware.ts` - Middleware auth
  - https://authjs.dev/getting-started/migrating-to-v5 - Guide migration officiel

  **Acceptance Criteria**:
  ```bash
  # Check NextAuth version
  cd frontend && npm list next-auth | grep "next-auth@5"
  # Assert: Found
  
  # Build frontend
  cd frontend && npm run build
  # Assert: Exit code 0
  
  # Playwright test: Login flow
  # 1. Navigate to /login
  # 2. Fill email/password
  # 3. Submit
  # 4. Assert: Redirected to /dashboard
  # 5. Assert: Session cookie exists
  ```

  **Commit**: YES
  - Message: `feat(auth): migrate from NextAuth v4 to v5 (auth.js)`
  - Files: `frontend/src/lib/auth/`, `frontend/package.json`

---

### Wave 4: Finalisation

- [x] 10. Cleanup et tests E2E complets

  **What to do**:
  - Supprimer fichiers obsolètes (Dockerfile.base, loader.ts, etc.)
  - Exécuter tous les tests E2E
  - Vérifier que tous les services démarrent correctement
  - Documenter les changements dans README

  **Must NOT do**:
  - Ne pas merger si tests échouent

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Final (after all)
  - **Blocks**: None
  - **Blocked By**: Tasks 3, 9

  **References**:
  - `tests/e2e/` - Tests E2E existants
  - `README.md` - Documentation à mettre à jour

  **Acceptance Criteria**:
  ```bash
  # Run E2E tests
  cd tests/e2e && npm run test:mock
  # Assert: All tests pass
  
  # Verify all services start
  docker compose up -d
  sleep 30
  docker compose ps --format json | jq -r '.[].State' | sort | uniq -c
  # Assert: Shows only "running"
  
  # Verify obsolete files removed
  test ! -f Dockerfile.base && test ! -f frontend/src/lib/grpc/loader.ts
  # Assert: Exit code 0
  ```

  **Commit**: YES
  - Message: `chore: cleanup obsolete files and run final E2E tests`
  - Files: `README.md`, deleted files

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `build(docker): add 4-stage template` | docker/, scripts/ | Template exists |
| 2 | `build(proto): dual generation` | packages/proto/ | Both outputs exist |
| 3 | `build(docker): apply to all services` | services/*/Dockerfile | All 4-stage |
| 4 | `build(frontend): automate proto copy` | frontend/Dockerfile | Docker build works |
| 5 | `refactor(frontend): split gRPC client` | frontend/src/lib/grpc/ | TypeCheck passes |
| 6 | `feat(frontend): gRPC auth tokens` | frontend/src/lib/grpc/ | Metadata present |
| 7 | `build(compose): per-environment` | compose/ | Config valid |
| 8 | `feat(grpc-utils): auth interceptor` | packages/grpc-utils/ | Build passes |
| 9 | `feat(auth): NextAuth v5` | frontend/src/lib/auth/ | Login works |
| 10 | `chore: cleanup and E2E` | README.md | All tests pass |

---

## Success Criteria

### Verification Commands
```bash
# 1. Docker builds work
docker compose build --parallel  # Expected: All succeed

# 2. Proto dual generation
cd packages/proto && npm run generate && ls gen/*/clients/  # Expected: ts/ and ts-frontend/

# 3. gRPC auth working
grpcurl -plaintext localhost:60052 clients.ClientBaseService/List  # Expected: UNAUTHENTICATED
grpcurl -H "authorization: Bearer $TOKEN" localhost:60052 clients.ClientBaseService/List  # Expected: Success

# 4. E2E tests pass
cd tests/e2e && npm run test:mock  # Expected: All green

# 5. Frontend builds
cd frontend && npm run build  # Expected: Success
```

### Final Checklist
- [ ] All 19 services use 4-stage Dockerfile with dumb-init
- [ ] Proto generates ts/ (NestJS) and ts-frontend/ (plain) outputs
- [ ] gRPC clients split into ~15 domain modules
- [ ] All gRPC calls include JWT token in metadata
- [ ] Backend rejects unauthenticated gRPC calls (except health)
- [ ] Compose structure: compose/dev/, compose/staging/, compose/prod/
- [ ] NextAuth v5 (auth.js) installed and working
- [ ] All E2E tests passing
- [ ] No obsolete files (Dockerfile.base, loader.ts)
