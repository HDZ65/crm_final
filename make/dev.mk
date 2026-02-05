# ============================================================================
# make/dev.mk - Development Environment Commands (Per-Service Compose)
# ============================================================================
# Structure: compose/dev/infrastructure.yml + compose/dev/service-{name}.yml
# Port base: 50051-50070 (gRPC), 3000 (frontend), 5432 (postgres), 4222 (nats)
# ============================================================================

.PHONY: dev-infra-up dev-infra-down dev-up dev-up-sequential dev-down dev-restart dev-logs dev-ps \
	dev-migrate-all dev-health-check dev-clean dev-shell dev-build-sequential

# Service list for batch operations (5 consolidated services)
DEV_SERVICES := service-core service-commercial service-finance service-engagement service-logistics

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
	docker compose $(DEV_COMPOSE_FILES) up -d --remove-orphans
	@echo ""
	@echo "All services started! Access:"
	@echo "  Frontend:      http://localhost:3000"
	@echo "  gRPC Services: localhost:50051-50070"

# Sequential build for low-memory environments (Windows-compatible, no bash loops)
# Builds each service one at a time, then starts all together to avoid orphan issues
dev-up-sequential: dev-infra-up dev-build-sequential
	@echo "=== Starting all services ==="
	docker compose $(DEV_COMPOSE_FILES) up -d
	@echo ""
	@echo "All services started (sequential build mode)!"
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

# Build all images sequentially (Windows-compatible, no bash loops)
dev-build-sequential:
	@echo "=== Building all images sequentially (low-memory mode) ==="
	@echo ">>> Building service-core..."
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-core.yml build
	@echo ">>> Building service-commercial..."
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-commercial.yml build
	@echo ">>> Building service-finance..."
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-finance.yml build
	@echo ">>> Building service-engagement..."
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-engagement.yml build
	@echo ">>> Building service-logistics..."
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-logistics.yml build
	@echo ">>> Building frontend..."
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/frontend.yml build
	@echo ""
	@echo "=== All images built! Now run: make dev-up ==="

# ============================================================================
# Single Service Commands (Per-Service Compose Pattern)
# ============================================================================

# Usage: make dev-service-up SERVICE=service-clients
dev-service-up:
ifndef SERVICE
	@echo "Error: SERVICE not specified. Usage: make dev-service-up SERVICE=service-clients"
	@exit 1
endif
	@echo "=== Starting $(SERVICE) ==="
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/$(SERVICE).yml up -d

dev-service-down:
ifndef SERVICE
	@echo "Error: SERVICE not specified"
	@exit 1
endif
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/$(SERVICE).yml stop crm-$(SERVICE)

dev-service-logs:
ifndef SERVICE
	@echo "Error: SERVICE not specified"
	@exit 1
endif
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/$(SERVICE).yml logs -f

dev-service-restart:
ifndef SERVICE
	@echo "Error: SERVICE not specified"
	@exit 1
endif
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/$(SERVICE).yml restart

dev-service-build:
ifndef SERVICE
	@echo "Error: SERVICE not specified"
	@exit 1
endif
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/$(SERVICE).yml build

# ============================================================================
# Quick Service Shortcuts
# ============================================================================

# Service: core (50052, 50056, 50057 - identity, clients, documents)
dev-core-up:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-core.yml up -d
dev-core-down:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-core.yml stop crm-service-core
dev-core-logs:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-core.yml logs -f
dev-core-restart:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-core.yml restart

# Service: commercial (50053)
dev-commercial-up:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-commercial.yml up -d
dev-commercial-down:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-commercial.yml stop crm-service-commercial
dev-commercial-logs:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-commercial.yml logs -f
dev-commercial-restart:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-commercial.yml restart

# Service: finance (50059, 50063, 50068 - factures, payments, calendar)
dev-finance-up:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-finance.yml up -d
dev-finance-down:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-finance.yml stop crm-service-finance
dev-finance-logs:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-finance.yml logs -f
dev-finance-restart:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-finance.yml restart

# Service: engagement (50061)
dev-engagement-up:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-engagement.yml up -d
dev-engagement-down:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-engagement.yml stop crm-service-engagement
dev-engagement-logs:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-engagement.yml logs -f
dev-engagement-restart:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-engagement.yml restart

# Service: logistics (50060)
dev-logistics-up:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-logistics.yml up -d
dev-logistics-down:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-logistics.yml stop crm-service-logistics
dev-logistics-logs:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-logistics.yml logs -f
dev-logistics-restart:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-logistics.yml restart

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
	-docker volume rm crm_final_postgres_main_data
	docker compose -f compose/dev/infrastructure.yml up -d postgres-main
	@echo "Database reset complete"

dev-migrate-all:
	@echo "=== Running all migrations ==="
	@echo "Migrating service-core..."
	-docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-core.yml exec crm-service-core bun run migration:run
	@echo "Migrating service-commercial..."
	-docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-commercial.yml exec crm-service-commercial bun run migration:run
	@echo "Migrating service-finance..."
	-docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-finance.yml exec crm-service-finance bun run migration:run
	@echo "Migrating service-engagement..."
	-docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-engagement.yml exec crm-service-engagement bun run migration:run
	@echo "Migrating service-logistics..."
	-docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-logistics.yml exec crm-service-logistics bun run migration:run
	@echo "Migrations complete"

# ============================================================================
# Health Check
# ============================================================================

dev-health-check:
	@echo "=== Checking dev services health ==="
	@echo ""
	@echo "Infrastructure:"
	-docker compose -f compose/dev/infrastructure.yml ps --format "table {{.Name}}\t{{.Status}}"
	@echo ""
	@echo "Services:"
	-docker compose $(DEV_COMPOSE_FILES) ps --format "table {{.Name}}\t{{.Status}}"
	@echo ""
	@echo "NATS Status:"
	-curl -s http://localhost:8222/varz

# ============================================================================
# Local Development (without Docker)
# ============================================================================

dev-local-frontend:
	@echo "Starting frontend locally..."
	cd frontend && bun run dev

dev-local-service:
ifndef SERVICE
	@echo "Usage: make dev-local-service SERVICE=service-clients"
	@echo "Error: SERVICE not specified"
	@exit 1
endif
	cd services/$(SERVICE) && bun run start:dev
