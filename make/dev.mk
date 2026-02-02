# ============================================================================
# make/dev.mk - Development Environment Commands
# ============================================================================
# Port base: 50051-50070 (gRPC), 3000 (frontend), 5432 (postgres), 4222 (nats)
# ============================================================================

.PHONY: dev-infra-up dev-infra-down dev-up dev-down dev-restart dev-logs dev-ps \
	dev-migrate-all dev-health-check dev-clean dev-shell

# ============================================================================
# Infrastructure (PostgreSQL, NATS, Redis)
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
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/services.yml up -d
	@echo ""
	@echo "All services started! Access:"
	@echo "  Frontend:      http://localhost:3000"
	@echo "  gRPC Services: localhost:50051-50070"

dev-down:
	@echo "=== Stopping all dev services ==="
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/services.yml down

dev-restart:
	@echo "=== Restarting all dev services ==="
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/services.yml restart

dev-logs:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/services.yml logs -f

dev-ps:
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/services.yml ps

dev-clean:
	@echo "=== Cleaning dev environment ==="
	docker compose -f compose/dev/infrastructure.yml -f compose/dev/services.yml down -v --remove-orphans
	@echo "Dev environment cleaned"

# ============================================================================
# Database Commands
# ============================================================================

dev-db-reset:
	@echo "=== Resetting dev database ==="
	docker compose -f compose/dev/infrastructure.yml stop postgres
	docker compose -f compose/dev/infrastructure.yml rm -f postgres
	docker volume rm dev_postgres_data 2>/dev/null || true
	docker compose -f compose/dev/infrastructure.yml up -d postgres
	@echo "Database reset complete"

dev-migrate-all:
	@echo "=== Running all migrations ==="
	@for service in service-clients service-users service-payments service-contrats service-factures; do \
		echo "Migrating $$service..."; \
		docker compose -f compose/dev/services.yml exec $$service npm run migration:run 2>/dev/null || true; \
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
	@docker compose -f compose/dev/services.yml ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null || echo "  Not running"
	@echo ""
	@echo "NATS Status:"
	@curl -s http://localhost:8222/varz 2>/dev/null | jq -r '.server_name // "Not available"' || echo "  NATS not reachable"

# ============================================================================
# Individual Service Commands
# ============================================================================

# Service: clients
dev-clients-up:
	docker compose -f compose/dev/services.yml up -d service-clients
dev-clients-down:
	docker compose -f compose/dev/services.yml stop service-clients
dev-clients-logs:
	docker compose -f compose/dev/services.yml logs -f service-clients
dev-clients-restart:
	docker compose -f compose/dev/services.yml restart service-clients

# Service: users
dev-users-up:
	docker compose -f compose/dev/services.yml up -d service-users
dev-users-down:
	docker compose -f compose/dev/services.yml stop service-users
dev-users-logs:
	docker compose -f compose/dev/services.yml logs -f service-users

# Service: payments
dev-payments-up:
	docker compose -f compose/dev/services.yml up -d service-payments
dev-payments-down:
	docker compose -f compose/dev/services.yml stop service-payments
dev-payments-logs:
	docker compose -f compose/dev/services.yml logs -f service-payments

# Service: contrats
dev-contrats-up:
	docker compose -f compose/dev/services.yml up -d service-contrats
dev-contrats-down:
	docker compose -f compose/dev/services.yml stop service-contrats
dev-contrats-logs:
	docker compose -f compose/dev/services.yml logs -f service-contrats

# Service: factures
dev-factures-up:
	docker compose -f compose/dev/services.yml up -d service-factures
dev-factures-down:
	docker compose -f compose/dev/services.yml stop service-factures
dev-factures-logs:
	docker compose -f compose/dev/services.yml logs -f service-factures

# Service: frontend
dev-frontend-up:
	cd frontend && npm run dev
dev-frontend-build:
	cd frontend && npm run build

# ============================================================================
# Local Development (without Docker)
# ============================================================================

dev-local-frontend:
	@echo "Starting frontend locally..."
	cd frontend && npm run dev

dev-local-service:
	@echo "Usage: make dev-local-service SERVICE=service-clients"
	@if [ -z "$(SERVICE)" ]; then echo "Error: SERVICE not specified"; exit 1; fi
	cd services/$(SERVICE) && npm run start:dev
