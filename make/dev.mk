# ============================================================================
# make/dev.mk - Development Commands
# ============================================================================

.PHONY: dev-infra-up dev-infra-down dev-infra-logs dev-up dev-down dev-logs dev-ps dev-restart dev-clean \
	dev-up-sequential dev-build-sequential \
	db-init dev-wait-for-dbs dev-migrate-all dev-verify-migrations dev-health-check dev-shell \
	consul-up consul-down consul-status \
	frontend-up frontend-down frontend-logs frontend-build frontend-build-no-cache frontend-shell frontend-proto-copy frontend-kill \
	service-core-up service-core-down service-core-logs service-core-migrate service-core-build service-core-shell \
	service-commercial-up service-commercial-down service-commercial-logs service-commercial-migrate service-commercial-build service-commercial-shell \
	service-finance-up service-finance-down service-finance-logs service-finance-migrate service-finance-build service-finance-shell \
	service-engagement-up service-engagement-down service-engagement-logs service-engagement-migrate service-engagement-build service-engagement-shell \
	service-logistics-up service-logistics-down service-logistics-logs service-logistics-migrate service-logistics-build service-logistics-shell \
	clean-core-db clean-commercial-db clean-finance-db clean-engagement-db clean-logistics-db clean-all-data clean-all-dbs \
	dev-local-frontend dev-local-service

# ============================================================================
# Compose File Definitions
# ============================================================================

DEV_INFRA = docker compose -p crmdev -f compose/dev/infrastructure.yml
DEV_CORE = $(DEV_INFRA) -f compose/dev/service-core.yml
DEV_COMMERCIAL = $(DEV_INFRA) -f compose/dev/service-commercial.yml
DEV_FINANCE = $(DEV_INFRA) -f compose/dev/service-finance.yml
DEV_ENGAGEMENT = $(DEV_INFRA) -f compose/dev/service-engagement.yml
DEV_LOGISTICS = $(DEV_INFRA) -f compose/dev/service-logistics.yml
DEV_FRONTEND = $(DEV_INFRA) -f compose/dev/frontend.yml

DEV_ALL = $(DEV_INFRA) \
	-f compose/dev/service-core.yml \
	-f compose/dev/service-commercial.yml \
	-f compose/dev/service-finance.yml \
	-f compose/dev/service-engagement.yml \
	-f compose/dev/service-logistics.yml \
	-f compose/dev/frontend.yml

# ============================================================================
# Dev Environment Commands
# ============================================================================

dev-infra-up:
	$(DEV_INFRA) up -d
	@echo "Infrastructure started (Consul, Redis, PostgreSQL databases, NATS)"

dev-infra-down:
	$(DEV_INFRA) down

dev-infra-logs:
	$(DEV_INFRA) logs -f

# Create all databases in postgres-main (idempotent)
db-init:
	@echo "=== Creating databases in postgres-main ==="
	@echo "Waiting for postgres-main to be ready..."
	@timeout=60; elapsed=0; \
	while ! docker exec dev-crm-postgres-main pg_isready -U $${DB_USERNAME:-postgres} -q 2>/dev/null; do \
		sleep 2; elapsed=$$((elapsed + 2)); \
		if [ $$elapsed -ge $$timeout ]; then \
			echo "ERROR: Timeout waiting for postgres-main after $${timeout}s"; \
			exit 1; \
		fi; \
	done
	@for db in identity_db commercial_db finance_db engagement_db logistics_db; do \
		echo "Creating database $$db (if not exists)..."; \
		docker exec -e PGPASSWORD=$${DB_PASSWORD:-postgres} dev-crm-postgres-main psql -U $${DB_USERNAME:-postgres} -tc \
			"SELECT 1 FROM pg_database WHERE datname='$$db'" | grep -q 1 \
			|| docker exec -e PGPASSWORD=$${DB_PASSWORD:-postgres} dev-crm-postgres-main psql -U $${DB_USERNAME:-postgres} -c \
			"CREATE DATABASE $$db"; \
		echo "  Installing uuid-ossp extension..."; \
		docker exec -e PGPASSWORD=$${DB_PASSWORD:-postgres} dev-crm-postgres-main psql -U $${DB_USERNAME:-postgres} -d $$db -c \
			"CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\""; \
	done
	@echo "=== All databases ready ==="

dev-up:
	$(DEV_ALL) up --build -d
	@echo ""
	@echo "All services started! Access:"
	@echo "  Frontend:      http://localhost:3000"
	@echo "  gRPC Services: localhost:50051-50068"

dev-down:
	$(DEV_ALL) down

dev-restart: dev-down dev-up

dev-logs:
	$(DEV_ALL) logs -f --tail 100

dev-ps:
	$(DEV_ALL) ps

dev-clean:
	$(DEV_ALL) down -v
	docker run --rm -v $(PWD):/workspace alpine sh -c "rm -rf /workspace/services/*/dist/ /workspace/services/*/proto/generated/ /workspace/services/*/src/generated/"

# Sequential build for low-memory environments (Windows-compatible)
dev-up-sequential: dev-build-sequential
	@echo "=== Starting all services ==="
	$(DEV_ALL) up -d
	@echo ""
	@echo "All services started (sequential build mode)!"

dev-build-sequential:
	@echo "=== Building all images sequentially (low-memory mode) ==="
	@echo ">>> Building service-core..."
	$(DEV_CORE) build
	@echo ">>> Building service-commercial..."
	$(DEV_COMMERCIAL) build
	@echo ">>> Building service-finance..."
	$(DEV_FINANCE) build
	@echo ">>> Building service-engagement..."
	$(DEV_ENGAGEMENT) build
	@echo ">>> Building service-logistics..."
	$(DEV_LOGISTICS) build
	@echo ">>> Building frontend..."
	$(DEV_FRONTEND) build
	@echo "=== All images built ==="

# ============================================================================
# Consul Commands
# ============================================================================

consul-up:
	$(DEV_INFRA) up -d consul

consul-down:
	$(DEV_INFRA) stop dev-crm-consul

consul-status:
	@echo "=== Consul Services ==="
	@curl -s http://localhost:8500/v1/catalog/services | jq .
	@echo ""
	@echo "=== Consul Health Checks ==="
	@curl -s http://localhost:8500/v1/agent/checks | jq .

# ============================================================================
# Frontend Commands
# ============================================================================

frontend-up:
	$(DEV_FRONTEND) up -d --build

frontend-down:
	$(DEV_FRONTEND) stop dev-crm-frontend

frontend-logs:
	$(DEV_FRONTEND) logs -f dev-crm-frontend

frontend-build:
	$(DEV_FRONTEND) build crm-frontend

frontend-build-no-cache:
	$(DEV_FRONTEND) build --no-cache crm-frontend

frontend-shell:
	@docker exec -it dev-crm-frontend sh

frontend-proto-copy:
	cd frontend && bun run proto:copy

frontend-kill:
	@echo "=== Killing existing Next.js dev process ==="
	@-fuser -k 3000/tcp 2>/dev/null || true
	@rm -f frontend/.next/dev/lock
	@echo "Done"

# ============================================================================
# Service Core Commands (gRPC 50052, HTTP 3052 - users, clients, documents)
# ============================================================================

service-core-up:
	$(DEV_CORE) up -d --build crm-service-core

service-core-down:
	$(DEV_CORE) stop dev-crm-service-core

service-core-logs:
	$(DEV_CORE) logs -f dev-crm-service-core

service-core-migrate:
	docker exec dev-crm-service-core bun run migration:run

service-core-build:
	cd services/service-core && bun run build

service-core-shell:
	@docker exec -it dev-crm-service-core sh

# ============================================================================
# Service Commercial Commands (gRPC 50053, HTTP 3053 - commerciaux, contrats, products, commission)
# ============================================================================

service-commercial-up:
	$(DEV_COMMERCIAL) up -d --build crm-service-commercial

service-commercial-down:
	$(DEV_COMMERCIAL) stop dev-crm-service-commercial

service-commercial-logs:
	$(DEV_COMMERCIAL) logs -f dev-crm-service-commercial

service-commercial-migrate:
	docker exec dev-crm-service-commercial bun run migration:run

service-commercial-build:
	cd services/service-commercial && bun run build

service-commercial-shell:
	@docker exec -it dev-crm-service-commercial sh

# ============================================================================
# Service Finance Commands (gRPC 50059, HTTP 3059 - factures, payments, calendar)
# ============================================================================

service-finance-up:
	$(DEV_FINANCE) up -d --build crm-service-finance

service-finance-down:
	$(DEV_FINANCE) stop dev-crm-service-finance

service-finance-logs:
	$(DEV_FINANCE) logs -f dev-crm-service-finance

service-finance-migrate:
	docker exec dev-crm-service-finance bun run migration:run

service-finance-build:
	cd services/service-finance && bun run build

service-finance-shell:
	@docker exec -it dev-crm-service-finance sh

# ============================================================================
# Service Engagement Commands (gRPC 50051, HTTP 3061 - activites, notifications, email)
# ============================================================================

service-engagement-up:
	$(DEV_ENGAGEMENT) up -d --build crm-service-engagement

service-engagement-down:
	$(DEV_ENGAGEMENT) stop dev-crm-service-engagement

service-engagement-logs:
	$(DEV_ENGAGEMENT) logs -f dev-crm-service-engagement

service-engagement-migrate:
	docker exec dev-crm-service-engagement bun run migration:run

service-engagement-build:
	cd services/service-engagement && bun run build

service-engagement-shell:
	@docker exec -it dev-crm-service-engagement sh

# ============================================================================
# Service Logistics Commands (50060 - expeditions, colis, tracking)
# ============================================================================

service-logistics-up:
	$(DEV_LOGISTICS) up -d --build crm-service-logistics

service-logistics-down:
	$(DEV_LOGISTICS) stop dev-crm-service-logistics

service-logistics-logs:
	$(DEV_LOGISTICS) logs -f dev-crm-service-logistics

service-logistics-migrate:
	docker exec dev-crm-service-logistics bun run migration:run

service-logistics-build:
	cd services/service-logistics && bun run build

service-logistics-shell:
	@docker exec -it dev-crm-service-logistics sh

# ============================================================================
# Dev Database Readiness
# ============================================================================

# Wait for all DEV databases to be ready (60s timeout per DB, 2s retry)
dev-wait-for-dbs:
	@echo "=== Waiting for DEV databases to be ready ==="
	@for db in crm_main identity_db commercial_db finance_db engagement_db logistics_db; do \
		echo "Waiting for postgres-main ($$db)..."; \
		timeout=60; elapsed=0; \
		while ! docker exec dev-crm-postgres-main pg_isready -U $${DB_USERNAME:-postgres} -d $$db -q 2>/dev/null; do \
			sleep 2; elapsed=$$((elapsed + 2)); \
			if [ $$elapsed -ge $$timeout ]; then \
				echo "ERROR: Timeout waiting for $$db after $${timeout}s"; \
				exit 1; \
			fi; \
		done; \
		echo "  $$db ready"; \
	done
	@echo "=== All DEV databases ready ==="

# ============================================================================
# Dev Migrations
# ============================================================================

dev-migrate-all:
	@echo "=== Running all DEV migrations ==="
	@set -e; \
	echo "service-core..."; \
	docker exec dev-crm-service-core bun run migration:run; \
	echo "service-commercial..."; \
	docker exec dev-crm-service-commercial bun run migration:run; \
	echo "service-finance..."; \
	docker exec dev-crm-service-finance bun run migration:run; \
	echo "service-engagement..."; \
	docker exec dev-crm-service-engagement bun run migration:run; \
	echo "service-logistics..."; \
	docker exec dev-crm-service-logistics bun run migration:run
	@echo "=== Done ==="

# Verify all migrations are applied (no pending migrations)
dev-verify-migrations:
	@echo "=== Verifying DEV migrations ==="
	@status=0; \
	for svc in \
		"dev-crm-service-core:service-core" \
		"dev-crm-service-commercial:service-commercial" \
		"dev-crm-service-finance:service-finance" \
		"dev-crm-service-engagement:service-engagement" \
		"dev-crm-service-logistics:service-logistics"; do \
		container=$$(echo $$svc | cut -d: -f1); \
		name=$$(echo $$svc | cut -d: -f2); \
		echo "Checking $$name..."; \
		output=$$(docker exec $$container bun run migration:show 2>&1) || true; \
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
	@echo "=== All DEV migrations verified ==="

# ============================================================================
# Dev Health Check
# ============================================================================

dev-health-check:
	@echo "=== DEV Health Checks ==="
	@echo ""
	@echo "Service Core (HTTP 3052):"
	@curl -s http://localhost:3052/health 2>/dev/null || echo "  Not available"
	@echo ""
	@echo "Service Commercial (HTTP 3053):"
	@curl -s http://localhost:3053/health 2>/dev/null || echo "  Not available"
	@echo ""
	@echo "Service Finance (HTTP 3059):"
	@curl -s http://localhost:3059/health 2>/dev/null || echo "  Not available"
	@echo ""
	@echo "Service Engagement (HTTP 3061):"
	@curl -s http://localhost:3061/health 2>/dev/null || echo "  Not available"
	@echo ""
	@echo "Service Logistics (gRPC 50060):"
	@grpcurl -plaintext localhost:50060 grpc.health.v1.Health/Check 2>/dev/null || echo "  Not available"
	@echo ""
	@echo "Frontend (3000):"
	@curl -s http://localhost:3000/api/health || echo "  Not available"

dev-shell:
	@docker exec -it dev-crm-$(SERVICE) sh

# ============================================================================
# Dev Data Management Commands
# ============================================================================

dev-db-reset:
	@echo "==================================="
	@echo "WARNING: DESTRUCTIVE OPERATION"
	@echo "==================================="
	@echo "This will delete ALL main database data"
	@read -p "Type 'yes' to confirm: " confirm && [ "$$confirm" = "yes" ] || (echo "Aborted" && exit 1)
	$(DEV_INFRA) stop postgres-main
	$(DEV_INFRA) rm -f postgres-main
	-docker volume rm crm_final_postgres_main_data
	$(DEV_INFRA) up -d postgres-main
	@echo "Database reset complete"

clean-core-db:
	@echo "=== Cleaning identity_db ==="
	@docker exec dev-crm-postgres-main psql -U $${DB_USERNAME:-postgres} -d identity_db -c \
		"DO \$$\$$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != 'migrations') LOOP EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE'; END LOOP; END \$$\$$;" \
		2>/dev/null || echo "  Failed"
	@echo "Done!"

clean-commercial-db:
	@echo "=== Cleaning commercial_db ==="
	@docker exec dev-crm-postgres-main psql -U $${DB_USERNAME:-postgres} -d commercial_db -c \
		"DO \$$\$$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != 'migrations') LOOP EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE'; END LOOP; END \$$\$$;" \
		2>/dev/null || echo "  Failed"
	@echo "Done!"

clean-finance-db:
	@echo "=== Cleaning finance_db ==="
	@docker exec dev-crm-postgres-main psql -U $${DB_USERNAME:-postgres} -d finance_db -c \
		"DO \$$\$$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != 'migrations') LOOP EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE'; END LOOP; END \$$\$$;" \
		2>/dev/null || echo "  Failed"
	@echo "Done!"

clean-engagement-db:
	@echo "=== Cleaning engagement_db ==="
	@docker exec dev-crm-postgres-main psql -U $${DB_USERNAME:-postgres} -d engagement_db -c \
		"DO \$$\$$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != 'migrations') LOOP EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE'; END LOOP; END \$$\$$;" \
		2>/dev/null || echo "  Failed"
	@echo "Done!"

clean-logistics-db:
	@echo "=== Cleaning logistics_db ==="
	@docker exec dev-crm-postgres-main psql -U $${DB_USERNAME:-postgres} -d logistics_db -c \
		"DO \$$\$$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != 'migrations') LOOP EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE'; END LOOP; END \$$\$$;" \
		2>/dev/null || echo "  Failed"
	@echo "Done!"

clean-all-data: clean-core-db clean-commercial-db clean-finance-db clean-engagement-db clean-logistics-db
	@echo "=== All databases cleaned ==="

clean-all-dbs:
	@echo "=== Stopping services and removing all volumes ==="
	$(DEV_ALL) down -v
	@echo "=== Rebuilding and starting ==="
	$(DEV_ALL) up -d --build
	$(MAKE) db-init
	$(MAKE) dev-wait-for-dbs
	$(MAKE) dev-migrate-all
	$(MAKE) dev-verify-migrations
	@echo "=== Done ==="
