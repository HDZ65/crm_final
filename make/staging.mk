# ============================================================================
# make/staging.mk - Staging Environment Commands (Per-Service Compose)
# ============================================================================
# Structure: compose/staging/infrastructure.yml + compose/staging/service-{name}.yml
# Port base: +100 from dev (50151-50170, 5532, 4322)
# ============================================================================

.PHONY: staging-infra-up staging-infra-down staging-up staging-down staging-logs staging-ps \
	staging-migrate-all staging-health-check staging-clean

# Service list for batch operations
STAGING_SERVICES := service-activites service-calendar service-clients service-commerciaux \
	service-commission service-contrats service-dashboard service-documents \
	service-email service-factures service-logistics service-notifications \
	service-organisations service-payments service-products service-referentiel \
	service-relance service-retry service-users

# Build compose command with all service files (including frontend)
STAGING_COMPOSE_FILES := -f compose/staging/infrastructure.yml $(foreach svc,$(STAGING_SERVICES),-f compose/staging/$(svc).yml) -f compose/staging/frontend.yml

# ============================================================================
# Infrastructure
# ============================================================================

staging-infra-up:
	@echo "=== Starting staging infrastructure ==="
	docker compose -f compose/staging/infrastructure.yml up -d
	@echo "Staging infrastructure started"

staging-infra-down:
	docker compose -f compose/staging/infrastructure.yml down

staging-infra-logs:
	docker compose -f compose/staging/infrastructure.yml logs -f

# ============================================================================
# All Services
# ============================================================================

staging-up: staging-infra-up
	@echo "=== Starting all staging services ==="
	docker compose $(STAGING_COMPOSE_FILES) up -d
	@echo "Staging services started on ports 50151-50170"

staging-down:
	docker compose $(STAGING_COMPOSE_FILES) down

staging-restart:
	docker compose $(STAGING_COMPOSE_FILES) restart

staging-logs:
	docker compose $(STAGING_COMPOSE_FILES) logs -f

staging-ps:
	docker compose $(STAGING_COMPOSE_FILES) ps

staging-clean:
	docker compose $(STAGING_COMPOSE_FILES) down -v --remove-orphans

# ============================================================================
# Single Service Commands
# ============================================================================

# Usage: make staging-service-up SERVICE=service-clients
staging-service-up:
	@if [ -z "$(SERVICE)" ]; then echo "Error: SERVICE not specified"; exit 1; fi
	docker compose -f compose/staging/infrastructure.yml -f compose/staging/$(SERVICE).yml up -d

staging-service-down:
	@if [ -z "$(SERVICE)" ]; then echo "Error: SERVICE not specified"; exit 1; fi
	docker compose -f compose/staging/infrastructure.yml -f compose/staging/$(SERVICE).yml stop

staging-service-logs:
	@if [ -z "$(SERVICE)" ]; then echo "Error: SERVICE not specified"; exit 1; fi
	docker compose -f compose/staging/infrastructure.yml -f compose/staging/$(SERVICE).yml logs -f

staging-service-build:
	@if [ -z "$(SERVICE)" ]; then echo "Error: SERVICE not specified"; exit 1; fi
	docker compose -f compose/staging/infrastructure.yml -f compose/staging/$(SERVICE).yml build

# ============================================================================
# Migrations & Health
# ============================================================================

staging-migrate-all:
	@echo "=== Running staging migrations ==="
	@for service in service-clients service-users service-payments service-contrats service-factures; do \
		echo "Migrating $$service..."; \
		docker compose -f compose/staging/infrastructure.yml -f compose/staging/$$service.yml exec crm-$$service npm run migration:run 2>/dev/null || true; \
	done
	@echo "Migrations complete"

staging-health-check:
	@echo "=== Checking staging services health ==="
	@echo ""
	@echo "Infrastructure:"
	@docker compose -f compose/staging/infrastructure.yml ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null || echo "  Not running"
	@echo ""
	@echo "Services:"
	@docker compose $(STAGING_COMPOSE_FILES) ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null || echo "  Not running"

# ============================================================================
# Frontend with Tailscale Funnel
# ============================================================================

staging-frontend-up:
	@echo "Starting staging frontend on port 3100..."
	cd frontend && PORT=3100 npm run start

funnel-staging-on:
	@echo "Exposing staging via Tailscale funnel on :8100..."
	tailscale funnel --bg 8100

funnel-staging-off:
	@echo "Stopping Tailscale funnel..."
	tailscale funnel --bg off
