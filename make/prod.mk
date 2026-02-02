# ============================================================================
# make/prod.mk - Production Environment Commands (Per-Service Compose)
# ============================================================================
# Structure: compose/prod/infrastructure.yml + compose/prod/service-{name}.yml
# Port base: +200 from dev (50251-50270, 5632, 4422)
# ============================================================================

.PHONY: prod-infra-up prod-infra-down prod-up prod-down prod-logs prod-ps \
	prod-migrate-all prod-health-check prod-clean

# Service list for batch operations
PROD_SERVICES := service-activites service-calendar service-clients service-commerciaux \
	service-commission service-contrats service-dashboard service-documents \
	service-email service-factures service-logistics service-notifications \
	service-organisations service-payments service-products service-referentiel \
	service-relance service-retry service-users

# Build compose command with all service files (including frontend)
PROD_COMPOSE_FILES := -f compose/prod/infrastructure.yml $(foreach svc,$(PROD_SERVICES),-f compose/prod/$(svc).yml) -f compose/prod/frontend.yml

# ============================================================================
# Infrastructure
# ============================================================================

prod-infra-up:
	@echo "=== Starting production infrastructure ==="
	docker compose -f compose/prod/infrastructure.yml up -d
	@echo "Production infrastructure started"

prod-infra-down:
	docker compose -f compose/prod/infrastructure.yml down

prod-infra-logs:
	docker compose -f compose/prod/infrastructure.yml logs -f

# ============================================================================
# All Services
# ============================================================================

prod-up: prod-infra-up
	@echo "=== Starting all production services ==="
	docker compose $(PROD_COMPOSE_FILES) up -d
	@echo "Production services started on ports 50251-50270"

prod-down:
	docker compose $(PROD_COMPOSE_FILES) down

prod-restart:
	docker compose $(PROD_COMPOSE_FILES) restart

prod-logs:
	docker compose $(PROD_COMPOSE_FILES) logs -f

prod-ps:
	docker compose $(PROD_COMPOSE_FILES) ps

prod-clean:
	@echo "WARNING: This will remove production data!"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	docker compose $(PROD_COMPOSE_FILES) down -v --remove-orphans

# ============================================================================
# Single Service Commands
# ============================================================================

# Usage: make prod-service-up SERVICE=service-clients
prod-service-up:
	@if [ -z "$(SERVICE)" ]; then echo "Error: SERVICE not specified"; exit 1; fi
	docker compose -f compose/prod/infrastructure.yml -f compose/prod/$(SERVICE).yml up -d

prod-service-down:
	@if [ -z "$(SERVICE)" ]; then echo "Error: SERVICE not specified"; exit 1; fi
	docker compose -f compose/prod/infrastructure.yml -f compose/prod/$(SERVICE).yml stop

prod-service-logs:
	@if [ -z "$(SERVICE)" ]; then echo "Error: SERVICE not specified"; exit 1; fi
	docker compose -f compose/prod/infrastructure.yml -f compose/prod/$(SERVICE).yml logs -f

prod-service-build:
	@if [ -z "$(SERVICE)" ]; then echo "Error: SERVICE not specified"; exit 1; fi
	docker compose -f compose/prod/infrastructure.yml -f compose/prod/$(SERVICE).yml build

# ============================================================================
# Migrations & Health
# ============================================================================

prod-migrate-all:
	@echo "=== Running production migrations ==="
	@echo "WARNING: Running migrations on production!"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	@for service in service-clients service-users service-payments service-contrats service-factures; do \
		echo "Migrating $$service..."; \
		docker compose -f compose/prod/infrastructure.yml -f compose/prod/$$service.yml exec crm-$$service npm run migration:run 2>/dev/null || true; \
	done
	@echo "Migrations complete"

prod-health-check:
	@echo "=== Checking production services health ==="
	@echo ""
	@echo "Infrastructure:"
	@docker compose -f compose/prod/infrastructure.yml ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null || echo "  Not running"
	@echo ""
	@echo "Services:"
	@docker compose $(PROD_COMPOSE_FILES) ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null || echo "  Not running"

# ============================================================================
# Backup Commands
# ============================================================================

prod-backup-db:
	@echo "=== Backing up production database ==="
	@mkdir -p backups
	docker compose -f compose/prod/infrastructure.yml exec postgres-main \
		pg_dump -U postgres crm_main > backups/crm_main_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup saved to backups/"

prod-restore-db:
	@echo "Usage: make prod-restore-db BACKUP=backups/crm_main_YYYYMMDD_HHMMSS.sql"
	@if [ -z "$(BACKUP)" ]; then echo "Error: BACKUP not specified"; exit 1; fi
	@echo "WARNING: This will overwrite production data!"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	cat $(BACKUP) | docker compose -f compose/prod/infrastructure.yml exec -T postgres-main psql -U postgres crm_main
