# ============================================================================
# make/prod.mk - Production Commands
# ============================================================================
# Production environment uses port offset +200 from dev
# PostgreSQL: 5632, NATS: 4422, Redis: 6580, Consul: 8700
# ============================================================================

.PHONY: prod-infra-up prod-infra-down prod-infra-logs prod-up prod-down prod-restart prod-logs prod-ps prod-clean \
	prod-frontend-up prod-frontend-down prod-frontend-logs prod-frontend-rebuild \
	prod-wait-for-dbs prod-migrate-all prod-verify-migrations prod-health-check prod-consul-status prod-shell \
	prod-clean-all-dbs prod-backup-db prod-restore-db \
	prod-service-core-logs prod-service-commercial-logs prod-service-finance-logs \
	prod-service-engagement-logs prod-service-logistics-logs prod-nats-logs

# ============================================================================
# Compose File Definitions
# ============================================================================

PROD_INFRA = docker compose -f compose/production/infrastructure.yml
PROD_CORE = $(PROD_INFRA) -f compose/production/service-core.yml
PROD_COMMERCIAL = $(PROD_INFRA) -f compose/production/service-commercial.yml
PROD_FINANCE = $(PROD_INFRA) -f compose/production/service-finance.yml
PROD_ENGAGEMENT = $(PROD_INFRA) -f compose/production/service-engagement.yml
PROD_LOGISTICS = $(PROD_INFRA) -f compose/production/service-logistics.yml
PROD_FRONTEND = $(PROD_INFRA) -f compose/production/frontend.yml

PROD_ALL = $(PROD_INFRA) \
	-f compose/production/service-core.yml \
	-f compose/production/service-commercial.yml \
	-f compose/production/service-finance.yml \
	-f compose/production/service-engagement.yml \
	-f compose/production/service-logistics.yml \
	-f compose/production/frontend.yml

# ============================================================================
# Production Environment Commands
# ============================================================================

prod-infra-up:
	$(PROD_INFRA) up -d
	@echo "Production infrastructure started"

prod-infra-down:
	$(PROD_INFRA) down

prod-infra-logs:
	$(PROD_INFRA) logs -f

prod-up:
	$(PROD_ALL) up --build -d

prod-down:
	$(PROD_ALL) down

prod-restart: prod-down prod-up

prod-logs:
	$(PROD_ALL) logs -f --tail 100

prod-ps:
	$(PROD_ALL) ps

prod-clean:
	@echo "============================================"
	@echo "WARNING: PRODUCTION CLEANUP"
	@echo "============================================"
	@echo "This will stop all containers and remove volumes!"
	@read -p "Type 'yes-delete' to confirm: " confirm && [ "$$confirm" = "yes-delete" ] || (echo "Aborted" && exit 1)
	$(PROD_ALL) down -v

# ============================================================================
# Production Frontend Commands
# ============================================================================

prod-frontend-up:
	$(PROD_FRONTEND) up --build -d
	@echo "Production frontend started on port 3200"

prod-frontend-down:
	$(PROD_FRONTEND) stop production-crm-frontend

prod-frontend-logs:
	$(PROD_FRONTEND) logs -f production-crm-frontend

prod-frontend-rebuild:
	$(PROD_FRONTEND) build --no-cache crm-frontend && $(PROD_FRONTEND) up -d crm-frontend

# ============================================================================
# Production Service Logs
# ============================================================================

prod-service-core-logs:
	$(PROD_CORE) logs -f production-crm-service-core

prod-service-commercial-logs:
	$(PROD_COMMERCIAL) logs -f production-crm-service-commercial

prod-service-finance-logs:
	$(PROD_FINANCE) logs -f production-crm-service-finance

prod-service-engagement-logs:
	$(PROD_ENGAGEMENT) logs -f production-crm-engagement

prod-service-logistics-logs:
	$(PROD_LOGISTICS) logs -f production-crm-service-logistics

prod-nats-logs:
	$(PROD_INFRA) logs -f production-crm-nats

# ============================================================================
# Production Database Readiness
# ============================================================================

# Wait for all PRODUCTION databases to be ready (60s timeout per DB, 2s retry)
prod-wait-for-dbs:
	@echo "=== Waiting for PRODUCTION databases to be ready ==="
	@for db in \
		"production-crm-postgres-main:crm_main" \
		"production-crm-identity-db:identity_db" \
		"production-crm-commercial-db:commercial_db" \
		"production-crm-finance-db:finance_db" \
		"production-crm-engagement-db:engagement_db" \
		"production-crm-logistics-db:logistics_db"; do \
		container=$$(echo $$db | cut -d: -f1); \
		dbname=$$(echo $$db | cut -d: -f2); \
		echo "Waiting for $$container ($$dbname)..."; \
		timeout=60; elapsed=0; \
		while ! docker exec $$container pg_isready -U $${DB_USERNAME:-postgres} -d $$dbname -q 2>/dev/null; do \
			sleep 2; elapsed=$$((elapsed + 2)); \
			if [ $$elapsed -ge $$timeout ]; then \
				echo "ERROR: Timeout waiting for $$container ($$dbname) after $${timeout}s"; \
				exit 1; \
			fi; \
		done; \
		echo "  $$container ready"; \
	done
	@echo "=== All PRODUCTION databases ready ==="

# ============================================================================
# Production Migrations
# ============================================================================

prod-migrate-all:
	@echo "=== Running all PRODUCTION migrations ==="
	@echo "WARNING: Running migrations on PRODUCTION!"
	@read -p "Type 'yes' to confirm: " confirm && [ "$$confirm" = "yes" ] || (echo "Aborted" && exit 1)
	@set -e; \
	echo "service-core..."; \
	docker exec -T production-crm-service-core bun run migration:run; \
	echo "service-commercial..."; \
	docker exec -T production-crm-service-commercial bun run migration:run; \
	echo "service-finance..."; \
	docker exec -T production-crm-service-finance bun run migration:run; \
	echo "service-engagement..."; \
	docker exec -T production-crm-engagement bun run migration:run; \
	echo "service-logistics..."; \
	docker exec -T production-crm-service-logistics bun run migration:run
	@echo "=== Done ==="

# Verify all migrations are applied (no pending migrations)
prod-verify-migrations:
	@echo "=== Verifying PRODUCTION migrations ==="
	@status=0; \
	for svc in \
		"production-crm-service-core:service-core" \
		"production-crm-service-commercial:service-commercial" \
		"production-crm-service-finance:service-finance" \
		"production-crm-engagement:service-engagement" \
		"production-crm-service-logistics:service-logistics"; do \
		container=$$(echo $$svc | cut -d: -f1); \
		name=$$(echo $$svc | cut -d: -f2); \
		echo "Checking $$name..."; \
		output=$$(docker exec -T $$container bun run migration:show 2>&1) || true; \
		if echo "$$output" | grep -q '\[ \]'; then \
			echo "  ERROR: Pending migrations found in $$name"; \
			echo "$$output" | grep '\[ \]' | head -5; \
			status=1; \
		else \
			echo "  OK"; \
		fi; \
	done; \
	if [ $$status -ne 0 ]; then \
		echo "=== FAILED: Some migrations are pending ==="; \
		exit 1; \
	fi
	@echo "=== All PRODUCTION migrations verified ==="

# ============================================================================
# Production Health Check
# ============================================================================

prod-health-check:
	@echo "=== PRODUCTION Health Checks (ports +200) ==="
	@echo ""
	@echo "Service Core (HTTP 3252):"
	@curl -s http://localhost:3252/health 2>/dev/null || echo "  Not available"
	@echo ""
	@echo "Service Commercial (HTTP 3253):"
	@curl -s http://localhost:3253/health 2>/dev/null || echo "  Not available"
	@echo ""
	@echo "Service Finance (HTTP 3259):"
	@curl -s http://localhost:3259/health 2>/dev/null || echo "  Not available"
	@echo ""
	@echo "Service Engagement (gRPC 50261):"
	@grpcurl -plaintext localhost:50261 grpc.health.v1.Health/Check 2>/dev/null || echo "  Not available"
	@echo ""
	@echo "Service Logistics (gRPC 50260):"
	@grpcurl -plaintext localhost:50260 grpc.health.v1.Health/Check 2>/dev/null || echo "  Not available"
	@echo ""
	@echo "Frontend (3200):"
	@curl -s http://localhost:3200/api/health || echo "  Not available"

prod-consul-status:
	@echo "=== PRODUCTION Consul Services (port 8700) ==="
	@curl -s http://localhost:8700/v1/catalog/services | jq . || echo "Consul not available"

prod-shell:
	@docker exec -it production-crm-$(SERVICE) sh

# ============================================================================
# Production Data Management Commands
# ============================================================================

prod-clean-all-dbs:
	@echo "============================================"
	@echo "WARNING: PRODUCTION DATABASE RESET"
	@echo "============================================"
	@echo "This will DELETE ALL PRODUCTION DATA!"
	@echo ""
	@read -p "Type 'yes-delete' to confirm: " confirm && [ "$$confirm" = "yes-delete" ] || (echo "Aborted" && exit 1)
	@echo ""
	$(PROD_ALL) down -v
	$(PROD_ALL) up -d --build
	$(MAKE) prod-wait-for-dbs
	$(MAKE) prod-migrate-all
	$(MAKE) prod-verify-migrations
	@echo "=== Done ==="

# ============================================================================
# Production Backup & Restore
# ============================================================================

prod-backup-db:
	@echo "=== Backing up production database ==="
	@mkdir -p backups
	docker exec production-crm-postgres-main pg_dump -U $${DB_USERNAME:-postgres} crm_main > backups/crm_main_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup saved to backups/"

prod-restore-db:
	@echo "Usage: make prod-restore-db BACKUP=backups/crm_main_YYYYMMDD_HHMMSS.sql"
	@if [ -z "$(BACKUP)" ]; then echo "Error: BACKUP not specified"; exit 1; fi
	@echo "WARNING: This will overwrite production data!"
	@read -p "Type 'yes' to confirm: " confirm && [ "$$confirm" = "yes" ] || (echo "Aborted" && exit 1)
	cat $(BACKUP) | docker exec -T production-crm-postgres-main psql -U $${DB_USERNAME:-postgres} crm_main