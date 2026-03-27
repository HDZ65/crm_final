# ============================================================================
# Makefile - CRM Final Monorepo
# ============================================================================
# Environment-specific makefiles:
#   - make/dev.mk     : Development commands (port base)
#   - make/staging.mk : Staging commands (port +100)
#   - make/prod.mk    : Production commands (port +200)
# ============================================================================

include make/dev.mk
include make/staging.mk
include make/prod.mk

# ============================================================================
# 🚀 COMMANDES PRINCIPALES - SIMPLE ET RAPIDE
# ============================================================================
# Usage:
#   make start   → Lance tout l'environnement dev (infrastructure + services + frontend)
#   make stop    → Arrête tout proprement
# ============================================================================

.PHONY: start stop init update

# Commande d'initialisation (à faire une seule fois ou après un clone)
init:
	@echo "╔════════════════════════════════════════════════════════════╗"
	@echo "║          🔧 INITIALISATION DU PROJET CRM                   ║"
	@echo "╚════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "1️⃣  Génération des fichiers Proto..."
	@cd packages/proto && npm run gen 2>/dev/null || bun run gen
	@echo "   ✅ Fichiers Proto générés"
	@echo ""
	@echo "2️⃣  Démarrage de l'infrastructure..."
	@$(DEV_INFRA) up -d
	@echo "   ✅ Infrastructure prête"
	@echo ""
	@echo "3️⃣  Attente de PostgreSQL (10 secondes)..."
	@sleep 10
	@echo ""
	@echo "4️⃣  Création des bases de données..."
	@docker exec dev-crm-postgres psql -U postgres -c "CREATE DATABASE crm_core;" 2>/dev/null || true
	@docker exec dev-crm-postgres psql -U postgres -c "CREATE DATABASE crm_commercial;" 2>/dev/null || true
	@docker exec dev-crm-postgres psql -U postgres -c "CREATE DATABASE crm_finance;" 2>/dev/null || true
	@docker exec dev-crm-postgres psql -U postgres -c "CREATE DATABASE crm_engagement;" 2>/dev/null || true
	@docker exec dev-crm-postgres psql -U postgres -c "CREATE DATABASE crm_logistics;" 2>/dev/null || true
	@docker exec dev-crm-postgres psql -U postgres -c "CREATE DATABASE crm_telecom;" 2>/dev/null || true
	@docker exec dev-crm-postgres psql -U postgres -c "CREATE DATABASE crm_keycloak;" 2>/dev/null || true
	@echo "   ✅ Bases de données créées"
	@echo ""
	@echo "5️⃣  Lancement des services pour les migrations..."
	@docker compose -f compose/dev/service-core.yml up -d
	@docker compose -f compose/dev/service-commercial.yml up -d
	@sleep 5
	@echo ""
	@echo "6️⃣  Exécution des migrations..."
	@docker exec dev-crm-service-core npm run migration:run 2>/dev/null || echo "   ⚠️  Pas de migrations pour core"
	@docker exec dev-crm-service-commercial npm run migration:run 2>/dev/null || echo "   ⚠️  Pas de migrations pour commercial"
	@echo "   ✅ Migrations exécutées"
	@echo ""
	@echo "╔════════════════════════════════════════════════════════════╗"
	@echo "║              ✅ INITIALISATION TERMINÉE                    ║"
	@echo "║         Vous pouvez maintenant faire: make start           ║"
	@echo "╚════════════════════════════════════════════════════════════╝"

# Commande de mise à jour (après modification des protos ou ajout de migrations)
update:
	@echo "╔════════════════════════════════════════════════════════════╗"
	@echo "║          🔄 MISE À JOUR DES PROTOS ET MIGRATIONS          ║"
	@echo "╚════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "1️⃣  Régénération des fichiers Proto..."
	@cd packages/proto && npm run gen:clean && npm run gen
	@echo "   ✅ Protos mis à jour"
	@echo ""
	@echo "2️⃣  Redémarrage des services avec les nouveaux protos..."
	@docker compose -f compose/dev/service-core.yml restart
	@docker compose -f compose/dev/service-commercial.yml restart
	@docker compose -f compose/dev/service-finance.yml restart
	@docker compose -f compose/dev/service-engagement.yml restart
	@docker compose -f compose/dev/frontend.yml restart
	@echo "   ✅ Services redémarrés"
	@echo ""
	@echo "3️⃣  Exécution des nouvelles migrations..."
	@docker exec dev-crm-service-core npm run migration:run 2>/dev/null || echo "   ℹ️  Pas de nouvelles migrations"
	@docker exec dev-crm-service-commercial npm run migration:run 2>/dev/null || echo "   ℹ️  Pas de nouvelles migrations"
	@echo "   ✅ Migrations à jour"
	@echo ""
	@echo "╔════════════════════════════════════════════════════════════╗"
	@echo "║                  ✅ MISE À JOUR TERMINÉE                   ║"
	@echo "╚════════════════════════════════════════════════════════════╝"

start:
	@echo "╔════════════════════════════════════════════════════════════╗"
	@echo "║          🚀 DÉMARRAGE DE L'ENVIRONNEMENT CRM              ║"
	@echo "╚════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "1️⃣  Infrastructure (PostgreSQL, Redis, NATS, Consul)..."
	@$(DEV_INFRA) up -d
	@echo "   ✅ Infrastructure démarrée"
	@echo ""
	@echo "2️⃣  Keycloak (Authentification)..."
	@docker compose -f compose/dev/keycloak.yml up -d
	@echo "   ✅ Keycloak démarré"
	@echo ""
	@echo "3️⃣  Services Backend..."
	@docker compose -f compose/dev/service-core.yml up -d
	@docker compose -f compose/dev/service-commercial.yml up -d
	@docker compose -f compose/dev/service-finance.yml up -d
	@docker compose -f compose/dev/service-engagement.yml up -d
	@docker compose -f compose/dev/service-gateway.yml up -d
	@docker compose -f compose/dev/service-logistics.yml up -d
	@docker compose -f compose/dev/service-telecom.yml up -d
	@echo "   ✅ Tous les services démarrés"
	@echo ""
	@echo "4️⃣  Frontend..."
	@docker compose -f compose/dev/frontend.yml up -d
	@echo "   ✅ Frontend démarré"
	@echo ""
	@echo "╔════════════════════════════════════════════════════════════╗"
	@echo "║                  ✅ SYSTÈME OPÉRATIONNEL                   ║"
	@echo "╠════════════════════════════════════════════════════════════╣"
	@echo "║  🌐 Frontend    : http://localhost:3400                    ║"
	@echo "║  🔐 Keycloak   : http://localhost:3402 (admin/admin)      ║"
	@echo "║  🗂️  Consul     : http://localhost:3406                    ║"
	@echo "║  📊 PostgreSQL : localhost:3401 (postgres/postgres)        ║"
	@echo "╠════════════════════════════════════════════════════════════╣"
	@echo "║  💡 Première fois? Faites d'abord: make init              ║"
	@echo "║  🔄 Protos modifiés? Faites: make update                  ║"
	@echo "╚════════════════════════════════════════════════════════════╝"

stop:
	@echo "╔════════════════════════════════════════════════════════════╗"
	@echo "║           🛑 ARRÊT DE L'ENVIRONNEMENT CRM                 ║"
	@echo "╚════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "📦 Arrêt du Frontend..."
	@docker compose -f compose/dev/frontend.yml down
	@echo "📦 Arrêt des Services..."
	@docker compose -f compose/dev/service-telecom.yml down
	@docker compose -f compose/dev/service-logistics.yml down
	@docker compose -f compose/dev/service-gateway.yml down
	@docker compose -f compose/dev/service-engagement.yml down
	@docker compose -f compose/dev/service-finance.yml down
	@docker compose -f compose/dev/service-commercial.yml down
	@docker compose -f compose/dev/service-core.yml down
	@echo "📦 Arrêt de Keycloak..."
	@docker compose -f compose/dev/keycloak.yml down
	@echo "📦 Arrêt de l'Infrastructure..."
	@$(DEV_INFRA) down
	@echo ""
	@echo "╔════════════════════════════════════════════════════════════╗"
	@echo "║              ✅ ENVIRONNEMENT ARRÊTÉ                       ║"
	@echo "╚════════════════════════════════════════════════════════════╝"

.PHONY: up down restart logs ps clean \
	proto-generate proto-clean proto-build-all proto-rebuild-all \
	build-all build-packages build-services docker-build-all docker-build-service docker-prune \
	install install-packages install-services install-frontend install-all \
	test test-auth test-events lint typecheck \
	nats-up nats-down nats-logs nats-sub nats-status \
	help

# ============================================================================
# Quick Aliases (Dev by default)
# ============================================================================

up: dev-up
down: dev-down
restart: dev-restart
logs: dev-logs
ps: dev-ps
clean: dev-clean
migrate-all: dev-migrate-all
health-check: dev-health-check
shell: dev-shell

# ============================================================================
# Proto Generation Commands (Centralized with buf)
# ============================================================================

proto-generate:
	@echo "=== Generating proto files with buf ==="
	cd packages/proto && npm run gen

proto-clean:
	@echo "=== Cleaning generated proto files ==="
	cd packages/proto && npm run gen:clean

proto-build-all: proto-generate
	@echo "=== Proto files generated ==="

proto-rebuild-all: proto-generate
	@echo "=== Rebuilding all services with new protos (no cache) ==="
	$(DEV_ALL) build --no-cache
	$(DEV_ALL) up -d
	@echo "Done"

# ============================================================================
# Build Commands
# ============================================================================

build-all: proto-generate build-packages build-services
	@echo "=== All builds completed ==="

build-packages:
	@echo "=== Building shared packages ==="
	cd packages/shared-kernel && bun run build
	@echo "Packages built"

build-services:
	@echo "=== Building all NestJS services ==="
	cd services/service-core && bun run build
	cd services/service-commercial && bun run build
	cd services/service-finance && bun run build
	cd services/service-engagement && bun run build
	cd services/service-logistics && bun run build
	@echo "All services built"

# ============================================================================
# Install Commands
# ============================================================================

install: install-packages install-services
	@echo "=== All dependencies installed ==="

install-packages:
	@echo "=== Installing package dependencies ==="
	cd packages/proto && bun install
	cd packages/shared-kernel && bun install

install-services:
	@echo "=== Installing service dependencies ==="
	cd services/service-core && bun install
	cd services/service-commercial && bun install
	cd services/service-finance && bun install
	cd services/service-engagement && bun install
	cd services/service-logistics && bun install

install-frontend:
	@echo "=== Installing frontend dependencies ==="
	cd frontend && bun install

install-all: install install-frontend
	@echo "=== All dependencies installed ==="

# ============================================================================
# Test & Quality Commands
# ============================================================================

test:
	@echo "=== Running tests ==="
	cd tests/e2e && bun run test:all

test-auth:
	cd tests/e2e && bun run test:auth

test-events:
	cd tests/e2e && bun run test:events

lint:
	@echo "=== Running linters ==="
	cd frontend && bun run lint
	@echo "Linting complete"

typecheck:
	@echo "=== Running TypeScript checks ==="
	cd frontend && bun run typecheck 2>/dev/null || bunx tsc --noEmit
	@echo "Typecheck complete"

# ============================================================================
# NATS Commands
# ============================================================================

nats-up:
	$(DEV_INFRA) up -d nats
	@echo "NATS started on localhost:4222"

nats-down:
	$(DEV_INFRA) stop nats

nats-logs:
	$(DEV_INFRA) logs -f nats

nats-sub:
	@echo "Subscribing to all CRM events..."
	@echo "Usage: nats sub 'crm.events.>'"
	nats sub "crm.events.>" 2>/dev/null || echo "Install nats CLI: go install github.com/nats-io/natscli/nats@latest"

nats-status:
	@curl -s http://localhost:8222/varz | jq '{server_name, version, connections, subscriptions}' 2>/dev/null || echo "NATS not running"

# ============================================================================
# Docker Commands
# ============================================================================

docker-build-all:
	@echo "=== Building all Docker images ==="
	$(DEV_CORE) build
	$(DEV_COMMERCIAL) build
	$(DEV_FINANCE) build
	$(DEV_ENGAGEMENT) build
	$(DEV_LOGISTICS) build
	$(DEV_FRONTEND) build

docker-build-service:
	@echo "Usage: make docker-build-service SERVICE=service-core"
	@if [ -z "$(SERVICE)" ]; then echo "Error: SERVICE not specified"; exit 1; fi
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/$(SERVICE).yml build

docker-prune:
	@echo "=== Pruning Docker resources ==="
	docker system prune -f
	docker volume prune -f

# ============================================================================
# Help
# ============================================================================

help:
	@echo ""
	@echo "CRM FINAL MAKEFILE"
	@echo "=================="
	@echo ""
	@echo "ENVIRONMENTS"
	@echo "------------"
	@echo "  Dev (default):  make up / make dev-up"
	@echo "  Staging:        make staging-up"
	@echo "  Production:     make prod-up"
	@echo ""
	@echo "DEV COMMANDS (make/dev.mk)"
	@echo "--------------------------"
	@echo "  make dev-infra-up         Start infrastructure (Consul, Redis, PostgreSQL, NATS)"
	@echo "  make dev-up               Start all dev services"
	@echo "  make dev-up-sequential    Start all services one by one (low RAM)"
	@echo "  make dev-build-sequential Build images one by one (low RAM)"
	@echo "  make dev-down             Stop all dev services"
	@echo "  make dev-logs             View dev logs"
	@echo "  make dev-ps               List dev containers"
	@echo "  make dev-migrate-all      Run all dev migrations"
	@echo "  make dev-verify-migrations Verify all migrations applied"
	@echo "  make dev-wait-for-dbs     Wait for all databases to be ready"
	@echo "  make dev-health-check     Check dev services health"
	@echo ""
	@echo "  Service commands: make <service>-up|down|logs|migrate|build|shell"
	@echo "  Services: service-core, service-commercial, service-finance,"
	@echo "            service-engagement, service-logistics, frontend"
	@echo ""
	@echo "  Data: make clean-core-db|commercial-db|finance-db|engagement-db|logistics-db|all-dbs"
	@echo ""
	@echo "STAGING COMMANDS (make/staging.mk)"
	@echo "----------------------------------"
	@echo "  make staging-infra-up     Start staging infrastructure"
	@echo "  make staging-up           Start all staging services"
	@echo "  make staging-down         Stop all staging services"
	@echo "  make staging-logs         View staging logs"
	@echo "  make staging-migrate-all  Run all staging migrations"
	@echo "  make staging-health-check Check staging services health"
	@echo ""
	@echo "  Frontend:"
	@echo "  make staging-frontend-up      Start frontend on port 3100"
	@echo "  make funnel-staging-on        Expose via Tailscale :8100"
	@echo "  make funnel-staging-off       Stop Tailscale funnel"
	@echo ""
	@echo "PRODUCTION COMMANDS (make/prod.mk)"
	@echo "----------------------------------"
	@echo "  make prod-infra-up        Start production infrastructure"
	@echo "  make prod-up              Start all production services"
	@echo "  make prod-down            Stop all production services"
	@echo "  make prod-logs            View production logs"
	@echo "  make prod-migrate-all     Run all production migrations"
	@echo "  make prod-health-check    Check production services health"
	@echo ""
	@echo "  Backup & Restore:"
	@echo "  make prod-backup-db       Backup production database"
	@echo "  make prod-restore-db BACKUP=<path>  Restore from backup"
	@echo ""
	@echo "GLOBAL COMMANDS"
	@echo "---------------"
	@echo "  make proto-generate       Generate proto files with buf"
	@echo "  make proto-clean          Clean generated proto files"
	@echo "  make build-all            Build proto + packages + services"
	@echo "  make build-packages       Build shared packages only"
	@echo "  make build-services       Build all NestJS services"
	@echo "  make install              Install all dependencies"
	@echo "  make install-frontend     Install frontend dependencies"
	@echo "  make docker-build-all     Build all Docker images"
	@echo "  make docker-prune         Clean Docker resources"
	@echo ""
	@echo "TEST COMMANDS"
	@echo "-------------"
	@echo "  make test                 Run all E2E tests"
	@echo "  make test-auth            Run auth tests"
	@echo "  make test-events          Run event tests"
	@echo "  make lint                 Run linters"
	@echo "  make typecheck            Run TypeScript checks"
	@echo ""
	@echo "NATS COMMANDS"
	@echo "-------------"
	@echo "  make nats-up              Start NATS server"
	@echo "  make nats-down            Stop NATS server"
	@echo "  make nats-status          Check NATS status"
	@echo "  make nats-sub             Subscribe to all events"
	@echo ""
	@echo "PORT MAPPING"
	@echo "------------"
	@echo "  Service          | Dev        | Staging (+100) | Prod (+200)"
	@echo "  -----------------|------------|----------------|------------"
	@echo "  Consul           | 8500       | 8600           | 8700"
	@echo "  Redis            | 6380       | 6480           | 6580"
	@echo "  NATS             | 4222       | 4322           | 4422"
	@echo "  NATS Monitoring  | 8222       | 8322           | 8422"
	@echo "  PostgreSQL       | 5432       | 5532           | 5632"
	@echo "  Frontend         | 3000       | 3100           | 3200"
	@echo ""
	@echo "  Service          | gRPC Port | HTTP"
	@echo "  -----------------|-----------|------"
	@echo "  service-core     | 50051     | 3052"
	@echo "  service-commercial| 50052    | 3053"
	@echo "  service-finance  | 50053     | 3059"
	@echo "  service-engagement| 50054    | -"
	@echo "  service-logistics| 50055     | -"
	@echo ""