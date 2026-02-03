# ============================================================================
# make/dev.mk - Development Environment Commands (Per-Service Compose)
# ============================================================================
# Structure: compose/dev/infrastructure.yml + compose/dev/service-{name}.yml
# Port base: 50051-50070 (gRPC), 3000 (frontend), 5432 (postgres), 4222 (nats)
# ============================================================================

.PHONY: dev-infra-up dev-infra-down dev-up dev-down dev-restart dev-logs dev-ps \
	dev-migrate-all dev-health-check dev-clean dev-shell

# Service list for batch operations
DEV_SERVICES := service-activites service-calendar service-clients service-commerciaux \
	service-commission service-contrats service-dashboard service-documents \
	service-email service-factures service-logistics service-notifications \
	service-organisations service-payments service-products service-referentiel \
	service-relance service-retry service-users

# Build compose command with all service files (including frontend)
DEV_COMPOSE_FILES := -f compose/dev/infrastructure.yml $(foreach svc,$(DEV_SERVICES),-f compose/dev/$(svc).yml) -f compose/dev/frontend.yml

# ============================================================================
# Infrastructure (PostgreSQL, NATS)
# ============================================================================

dev-infra-up:
	@echo "=== Starting dev infrastructure ==="
	docker compose -f compose/dev/infrastructure.yml up -d
	@echo "Infrastructure started:"
	@echo "  PostgreSQL: localhost:5432"
	@echo "  NATS:       localhost:4222 (monitoring: localhost:8222)"

dev-infra-down:
	@echo "=== Stopping dev infrastructure ==="
	docker compose -f compose/dev/infrastructure.yml down

dev-infra-logs:
	docker compose -f compose/dev/infrastructure.yml logs -f

# ============================================================================
# All Services
# ============================================================================

dev-up: dev-infra-up
	@echo "=== Starting all dev services ==="
	docker compose $(DEV_COMPOSE_FILES) up -d
	@echo ""
	@echo "All services started! Access:"
	@echo "  Frontend:      http://localhost:3000"
	@echo "  gRPC Services: localhost:50051-50070"

dev-down:
	@echo "=== Stopping all dev services ==="
	docker compose $(DEV_COMPOSE_FILES) down

dev-restart:
	@echo "=== Restarting all dev services ==="
	docker compose $(DEV_COMPOSE_FILES) restart

dev-logs:
	docker compose $(DEV_COMPOSE_FILES) logs -f

dev-ps:
	docker compose $(DEV_COMPOSE_FILES) ps

dev-clean:
	@echo "=== Cleaning dev environment ==="
	docker compose $(DEV_COMPOSE_FILES) down -v --remove-orphans
	@echo "Dev environment cleaned"

# ============================================================================
# Single Service Commands (Per-Service Compose Pattern)
# ============================================================================

# Usage: make dev-service-up SERVICE=service-clients
dev-service-up:
	@if [ -z "$(SERVICE)" ]; then echo "Error: SERVICE not specified. Usage: make dev-service-up SERVICE=service-clients"; exit 1; fi
	@echo "=== Starting $(SERVICE) ==="
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/$(SERVICE).yml up -d

dev-service-down:
	@if [ -z "$(SERVICE)" ]; then echo "Error: SERVICE not specified"; exit 1; fi
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/$(SERVICE).yml stop $(subst service-,crm-service-,$(SERVICE))

dev-service-logs:
	@if [ -z "$(SERVICE)" ]; then echo "Error: SERVICE not specified"; exit 1; fi
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/$(SERVICE).yml logs -f

dev-service-restart:
	@if [ -z "$(SERVICE)" ]; then echo "Error: SERVICE not specified"; exit 1; fi
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/$(SERVICE).yml restart

dev-service-build:
	@if [ -z "$(SERVICE)" ]; then echo "Error: SERVICE not specified"; exit 1; fi
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/$(SERVICE).yml build

# ============================================================================
# Quick Service Shortcuts
# ============================================================================

# Service: clients (50052)
dev-clients-up:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-clients.yml up -d
dev-clients-down:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-clients.yml stop crm-service-clients
dev-clients-logs:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-clients.yml logs -f
dev-clients-restart:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-clients.yml restart

# Service: users (50067)
dev-users-up:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-users.yml up -d
dev-users-down:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-users.yml stop crm-service-users
dev-users-logs:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-users.yml logs -f

# Service: payments (50063)
dev-payments-up:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-payments.yml up -d
dev-payments-down:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-payments.yml stop crm-service-payments
dev-payments-logs:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-payments.yml logs -f

# Service: contrats (50055)
dev-contrats-up:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-contrats.yml up -d
dev-contrats-down:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-contrats.yml stop crm-service-contrats
dev-contrats-logs:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-contrats.yml logs -f

# Service: factures (50059)
dev-factures-up:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-factures.yml up -d
dev-factures-down:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-factures.yml stop crm-service-factures
dev-factures-logs:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-factures.yml logs -f

# Frontend (3000)
dev-frontend-up:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/frontend.yml up -d
dev-frontend-down:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/frontend.yml stop crm-frontend
dev-frontend-logs:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/frontend.yml logs -f
dev-frontend-build:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/frontend.yml build

# ============================================================================
# Database Commands
# ============================================================================

dev-db-reset:
	@echo "=== Resetting dev database ==="
	docker compose -f compose/dev/infrastructure.yml stop postgres-main
	docker compose -f compose/dev/infrastructure.yml rm -f postgres-main
	docker volume rm crm_final_postgres_main_data 2>/dev/null || true
	docker compose -f compose/dev/infrastructure.yml up -d postgres-main
	@echo "Database reset complete"

dev-migrate-all:
	@echo "=== Running all migrations ==="
	@for service in service-clients service-users service-payments service-contrats service-factures; do \
		echo "Migrating $$service..."; \
		docker compose -f compose/dev/infrastructure.yml -f compose/dev/$$service.yml exec crm-$$service bun run migration:run 2>/dev/null || true; \
	done
	@echo "Migrations complete"

# ============================================================================
# Health Check
# ============================================================================

dev-health-check:
	@echo "=== Checking dev services health ==="
	@echo ""
	@echo "Infrastructure:"
	@docker compose -f compose/dev/infrastructure.yml ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null || echo "  Not running"
	@echo ""
	@echo "Services:"
	@docker compose $(DEV_COMPOSE_FILES) ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null || echo "  Not running"
	@echo ""
	@echo "NATS Status:"
	@curl -s http://localhost:8222/varz 2>/dev/null | jq -r '.server_name // "Not available"' || echo "  NATS not reachable"

# ============================================================================
# Local Development (without Docker)
# ============================================================================

dev-local-frontend:
	@echo "Starting frontend locally..."
	cd frontend && bun run dev

dev-local-service:
	@echo "Usage: make dev-local-service SERVICE=service-clients"
	@if [ -z "$(SERVICE)" ]; then echo "Error: SERVICE not specified"; exit 1; fi
	cd services/$(SERVICE) && bun run start:dev
