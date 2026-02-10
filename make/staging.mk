# ============================================================================
# make/staging.mk - Staging Commands
# ============================================================================
# Staging environment uses port offset +100 from dev
# PostgreSQL: 5532, NATS: 4322, Redis: 6480, Consul: 8600
# ============================================================================

.PHONY: staging-infra-up staging-infra-down staging-infra-logs staging-up staging-down staging-logs staging-ps staging-restart staging-clean \
	staging-wait-for-dbs staging-migrate-all staging-verify-migrations staging-clean-all-dbs \
	staging-health-check staging-consul-status staging-shell \
	staging-frontend-up staging-frontend-down staging-frontend-logs staging-frontend-rebuild \
	funnel-staging-on funnel-staging-off funnel-staging-status \
	staging-service-core-logs staging-service-commercial-logs staging-service-finance-logs \
	staging-service-engagement-logs staging-service-logistics-logs

# ============================================================================
# Compose File Definitions
# ============================================================================

STAGING_INFRA = docker compose -f compose/staging/infrastructure.yml
STAGING_CORE = $(STAGING_INFRA) -f compose/staging/service-core.yml
STAGING_COMMERCIAL = $(STAGING_INFRA) -f compose/staging/service-commercial.yml
STAGING_FINANCE = $(STAGING_INFRA) -f compose/staging/service-finance.yml
STAGING_ENGAGEMENT = $(STAGING_INFRA) -f compose/staging/service-engagement.yml
STAGING_LOGISTICS = $(STAGING_INFRA) -f compose/staging/service-logistics.yml
STAGING_FRONTEND = $(STAGING_INFRA) -f compose/staging/frontend.yml

STAGING_ALL = $(STAGING_INFRA) \
	-f compose/staging/service-core.yml \
	-f compose/staging/service-commercial.yml \
	-f compose/staging/service-finance.yml \
	-f compose/staging/service-engagement.yml \
	-f compose/staging/service-logistics.yml \
	-f compose/staging/frontend.yml

# ============================================================================
# Staging Environment Commands
# ============================================================================

staging-infra-up:
	$(STAGING_INFRA) up -d
	@echo "Staging infrastructure started"

staging-infra-down:
	$(STAGING_INFRA) down

staging-infra-logs:
	$(STAGING_INFRA) logs -f

staging-up:
	$(STAGING_ALL) up -d

staging-down:
	$(STAGING_ALL) down

staging-restart: staging-down staging-up

staging-logs:
	$(STAGING_ALL) logs -f --tail 100

staging-ps:
	$(STAGING_ALL) ps

staging-clean:
	$(STAGING_ALL) down -v

# ============================================================================
# Staging Frontend Commands
# ============================================================================

staging-frontend-up:
	$(STAGING_FRONTEND) up --build -d
	@echo "Staging frontend running on port 3100"
	@echo "Run 'make funnel-staging-on' to expose via Tailscale"

staging-frontend-down:
	$(STAGING_FRONTEND) stop staging-crm-frontend

staging-frontend-logs:
	$(STAGING_FRONTEND) logs -f staging-crm-frontend

staging-frontend-rebuild:
	$(STAGING_FRONTEND) build --no-cache crm-frontend && $(STAGING_FRONTEND) up -d crm-frontend

# ============================================================================
# Tailscale Funnel (Staging)
# ============================================================================

funnel-staging-on:
	tailscale funnel --bg --https=8100 3100
	@echo "Staging exposed via Tailscale funnel on :8100"

funnel-staging-off:
	tailscale funnel --https=8100 off

funnel-staging-status:
	tailscale funnel status

# ============================================================================
# Staging Service Logs
# ============================================================================

staging-service-core-logs:
	$(STAGING_CORE) logs -f staging-crm-service-core

staging-service-commercial-logs:
	$(STAGING_COMMERCIAL) logs -f staging-crm-service-commercial

staging-service-finance-logs:
	$(STAGING_FINANCE) logs -f staging-crm-service-finance

staging-service-engagement-logs:
	$(STAGING_ENGAGEMENT) logs -f staging-crm-engagement

staging-service-logistics-logs:
	$(STAGING_LOGISTICS) logs -f staging-crm-service-logistics

# ============================================================================
# Staging Database Readiness
# ============================================================================

# Wait for all STAGING databases to be ready (60s timeout per DB, 2s retry)
staging-wait-for-dbs:
	@echo "=== Waiting for STAGING databases to be ready ==="
	@for db in \
		"staging-crm-postgres-main:crm_main" \
		"staging-crm-identity-db:identity_db" \
		"staging-crm-commercial-db:commercial_db" \
		"staging-crm-finance-db:finance_db" \
		"staging-crm-engagement-db:engagement_db" \
		"staging-crm-logistics-db:logistics_db"; do \
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
	@echo "=== All STAGING databases ready ==="

# ============================================================================
# Staging Migrations
# ============================================================================

staging-migrate-all:
	@echo "=== Running all STAGING migrations ==="
	@set -e; \
	echo "service-core..."; \
	docker exec staging-crm-service-core bun run migration:run; \
	echo "service-commercial..."; \
	docker exec staging-crm-service-commercial bun run migration:run; \
	echo "service-finance..."; \
	docker exec staging-crm-service-finance bun run migration:run; \
	echo "service-engagement..."; \
	docker exec staging-crm-engagement bun run migration:run; \
	echo "service-logistics..."; \
	docker exec staging-crm-service-logistics bun run migration:run
	@echo "=== Done ==="

# Verify all migrations are applied (no pending migrations)
staging-verify-migrations:
	@echo "=== Verifying STAGING migrations ==="
	@status=0; \
	for svc in \
		"staging-crm-service-core:service-core" \
		"staging-crm-service-commercial:service-commercial" \
		"staging-crm-service-finance:service-finance" \
		"staging-crm-engagement:service-engagement" \
		"staging-crm-service-logistics:service-logistics"; do \
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
	@echo "=== All STAGING migrations verified ==="

# Clean all staging databases and re-run migrations
staging-clean-all-dbs:
	@echo "=== Stopping STAGING services and removing all volumes ==="
	$(STAGING_ALL) down -v
	@echo "=== Rebuilding and starting STAGING ==="
	$(STAGING_ALL) up -d --build
	$(MAKE) staging-wait-for-dbs
	$(MAKE) staging-migrate-all
	$(MAKE) staging-verify-migrations
	@echo "=== Done ==="

# ============================================================================
# Staging Health Check
# ============================================================================

staging-health-check:
	@echo "=== STAGING Health Checks (ports +100) ==="
	@echo ""
	@echo "Service Core (HTTP 3152):"
	@curl -s http://localhost:3152/health 2>/dev/null || echo "  Not available"
	@echo ""
	@echo "Service Commercial (HTTP 3153):"
	@curl -s http://localhost:3153/health 2>/dev/null || echo "  Not available"
	@echo ""
	@echo "Service Finance (HTTP 3159):"
	@curl -s http://localhost:3159/health 2>/dev/null || echo "  Not available"
	@echo ""
	@echo "Service Engagement (gRPC 50161):"
	@grpcurl -plaintext localhost:50161 grpc.health.v1.Health/Check 2>/dev/null || echo "  Not available"
	@echo ""
	@echo "Service Logistics (gRPC 50160):"
	@grpcurl -plaintext localhost:50160 grpc.health.v1.Health/Check 2>/dev/null || echo "  Not available"
	@echo ""
	@echo "Frontend (3100):"
	@curl -s http://localhost:3100/api/health || echo "  Not available"

staging-consul-status:
	@echo "=== STAGING Consul Services (port 8600) ==="
	@curl -s http://localhost:8600/v1/catalog/services | jq . || echo "Consul not available"

staging-shell:
	@docker exec -it staging-crm-$(SERVICE) sh