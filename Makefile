# ============================================================================
# Makefile - CRM Final Monorepo
# ============================================================================
# Environment-specific makefiles:
#   - make/dev.mk     : Development commands (default)
#   - make/staging.mk : Staging commands
#   - make/prod.mk    : Production commands
# ============================================================================

include make/dev.mk
include make/staging.mk
include make/prod.mk

.PHONY: up down restart logs ps clean \
	proto-generate proto-clean proto-build \
	build-all build-packages build-services \
	install install-packages install-services \
	test lint typecheck \
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

# ============================================================================
# Proto Generation Commands
# ============================================================================

proto-generate:
	@echo "=== Generating proto files with buf ==="
	cd packages/proto && bun run generate
	@echo "Proto files generated:"
	@echo "  Backend (NestJS): packages/proto/gen/ts/"
	@echo "  Frontend:         packages/proto/gen/ts-frontend/"

proto-clean:
	@echo "=== Cleaning generated proto files ==="
	rm -rf packages/proto/gen/ts packages/proto/gen/ts-frontend
	@echo "Proto files cleaned"

proto-build: proto-clean proto-generate
	@echo "=== Proto rebuild complete ==="

proto-install:
	@echo "=== Installing proto dependencies ==="
	cd packages/proto && bun install
	@echo "Proto dependencies installed"

# ============================================================================
# Build Commands
# ============================================================================

build-all: proto-generate build-packages build-services
	@echo "=== All builds completed ==="

build-packages:
	@echo "=== Building shared packages ==="
	cd packages/grpc-utils && bun run build
	cd packages/shared && bun run build
	cd packages/nats-utils && bun run build
	@echo "Packages built"

build-services:
	@echo "=== Building all 19 services ==="
	@for service in services/service-*; do \
		echo "Building $$service..."; \
		cd $$service && bun run build && cd ../..; \
	done
	@echo "All services built"

# ============================================================================
# Install Commands
# ============================================================================

install: install-packages install-services
	@echo "=== All dependencies installed ==="

install-packages:
	@echo "=== Installing package dependencies ==="
	cd packages/proto && bun install
	cd packages/grpc-utils && bun install
	cd packages/shared && bun install
	cd packages/nats-utils && bun install

install-services:
	@echo "=== Installing service dependencies ==="
	@for service in services/service-*; do \
		echo "Installing $$service..."; \
		cd $$service && bun install && cd ../..; \
	done

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
	docker compose -f compose/dev/infrastructure.yml up -d nats
	@echo "NATS started on localhost:4222"

nats-down:
	docker compose -f compose/dev/infrastructure.yml stop nats

nats-logs:
	docker compose -f compose/dev/infrastructure.yml logs -f nats

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
	@for service in services/service-*; do \
		name=$$(basename $$service); \
		echo "Building $$name..."; \
		docker compose -f compose/dev/infrastructure.yml -f compose/dev/$$name.yml build; \
	done

docker-build-service:
	@echo "Usage: make docker-build-service SERVICE=service-clients"
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
	@echo "  make dev-infra-up        Start infrastructure (PostgreSQL, NATS)"
	@echo "  make dev-up              Start all dev services (parallel)"
	@echo "  make dev-up-sequential   Start all services one by one (WSL/low RAM)"
	@echo "  make dev-build-sequential Build images one by one (WSL/low RAM)"
	@echo "  make dev-down            Stop all dev services"
	@echo "  make dev-logs            View dev logs"
	@echo "  make dev-ps              List dev containers"
	@echo "  make dev-health-check    Check services health"
	@echo "  make dev-clean           Remove containers and volumes"
	@echo ""
	@echo "  Service commands:"
	@echo "    make dev-frontend-up|down|logs|build"
	@echo "    make dev-clients-up|down|logs|restart"
	@echo "    make dev-users-up|down|logs"
	@echo "    make dev-payments-up|down|logs"
	@echo "    make dev-contrats-up|down|logs"
	@echo "    make dev-factures-up|down|logs"
	@echo ""
	@echo "PROTO COMMANDS"
	@echo "--------------"
	@echo "  make proto-generate    Generate proto files with buf"
	@echo "  make proto-clean       Clean generated proto files"
	@echo ""
	@echo "BUILD COMMANDS"
	@echo "--------------"
	@echo "  make build-all         Build packages + services"
	@echo "  make build-packages    Build shared packages only"
	@echo "  make build-services    Build all 19 services"
	@echo ""
	@echo "INSTALL COMMANDS"
	@echo "----------------"
	@echo "  make install           Install all dependencies"
	@echo "  make install-frontend  Install frontend dependencies"
	@echo ""
	@echo "NATS COMMANDS"
	@echo "-------------"
	@echo "  make nats-up           Start NATS server"
	@echo "  make nats-down         Stop NATS server"
	@echo "  make nats-status       Check NATS status"
	@echo "  make nats-sub          Subscribe to all events"
	@echo ""
	@echo "TEST COMMANDS"
	@echo "-------------"
	@echo "  make test              Run all E2E tests"
	@echo "  make test-auth         Run auth tests"
	@echo "  make test-events       Run event tests"
	@echo "  make lint              Run linters"
	@echo "  make typecheck         Run TypeScript checks"
	@echo ""
	@echo "DOCKER COMMANDS"
	@echo "---------------"
	@echo "  make docker-build-all  Build all Docker images"
	@echo "  make docker-prune      Clean Docker resources"
	@echo ""
	@echo "SERVICE PORTS"
	@echo "-------------"
	@echo "  Service            | Port"
	@echo "  -------------------|------"
	@echo "  service-activites  | 50051"
	@echo "  service-clients    | 50052"
	@echo "  service-commerciaux| 50053"
	@echo "  service-commission | 50054"
	@echo "  service-contrats   | 50055"
	@echo "  service-dashboard  | 50056"
	@echo "  service-documents  | 50057"
	@echo "  service-email      | 50058"
	@echo "  service-factures   | 50059"
	@echo "  service-logistics  | 50060"
	@echo "  service-notifications| 50061"
	@echo "  service-organisations| 50062"
	@echo "  service-payments   | 50063"
	@echo "  service-products   | 50064"
	@echo "  service-referentiel| 50065"
	@echo "  service-relance    | 50066"
	@echo "  service-users      | 50067"
	@echo "  service-calendar   | 50068"
	@echo "  service-retry      | 50070"
	@echo ""
	@echo "  Frontend           | 3000"
	@echo "  PostgreSQL         | 5432"
	@echo "  NATS               | 4222"
	@echo "  NATS Monitoring    | 8222"
	@echo ""
