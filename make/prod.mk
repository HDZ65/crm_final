# ============================================================================
# make/prod.mk - Production Environment Commands
# ============================================================================
# Port base: +200 from dev (50251-50270, 3200, 5632, 4422)
# ============================================================================

.PHONY: prod-infra-up prod-infra-down prod-up prod-down prod-logs prod-ps \
	prod-migrate-all prod-health-check prod-clean

# ============================================================================
# Infrastructure
# ============================================================================

prod-infra-up:
	@echo "=== Starting production infrastructure ==="
	docker compose -f compose/prod/infrastructure.yml up -d
	@echo "Production infrastructure started"

prod-infra-down:
	docker compose -f compose/prod/infrastructure.yml down

# ============================================================================
# All Services
# ============================================================================

prod-up: prod-infra-up
	@echo "=== Starting all production services ==="
	docker compose -f compose/prod/infrastructure.yml -f compose/prod/services.yml up -d
	@echo "Production services started"

prod-down:
	docker compose -f compose/prod/infrastructure.yml -f compose/prod/services.yml down

prod-restart:
	docker compose -f compose/prod/infrastructure.yml -f compose/prod/services.yml restart

prod-logs:
	docker compose -f compose/prod/infrastructure.yml -f compose/prod/services.yml logs -f

prod-ps:
	docker compose -f compose/prod/infrastructure.yml -f compose/prod/services.yml ps

prod-clean:
	@echo "WARNING: This will remove production data!"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	docker compose -f compose/prod/infrastructure.yml -f compose/prod/services.yml down -v --remove-orphans

# ============================================================================
# Migrations & Health
# ============================================================================

prod-migrate-all:
	@echo "=== Running production migrations ==="
	@echo "WARNING: Running migrations on production!"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	@echo "TODO: Implement production migrations"

prod-health-check:
	@echo "=== Checking production services health ==="
	@docker compose -f compose/prod/infrastructure.yml -f compose/prod/services.yml ps

# ============================================================================
# Backup Commands
# ============================================================================

prod-backup-db:
	@echo "=== Backing up production database ==="
	@mkdir -p backups
	docker compose -f compose/prod/infrastructure.yml exec postgres \
		pg_dump -U postgres crm_db > backups/crm_db_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup saved to backups/"

prod-restore-db:
	@echo "Usage: make prod-restore-db BACKUP=backups/crm_db_YYYYMMDD_HHMMSS.sql"
	@if [ -z "$(BACKUP)" ]; then echo "Error: BACKUP not specified"; exit 1; fi
	@echo "WARNING: This will overwrite production data!"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	cat $(BACKUP) | docker compose -f compose/prod/infrastructure.yml exec -T postgres psql -U postgres crm_db
