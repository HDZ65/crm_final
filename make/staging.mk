# ============================================================================
# make/staging.mk - Staging Environment Commands
# ============================================================================
# Port base: +100 from dev (50151-50170, 3100, 5532, 4322)
# ============================================================================

.PHONY: staging-infra-up staging-infra-down staging-up staging-down staging-logs staging-ps \
	staging-migrate-all staging-health-check staging-clean

# ============================================================================
# Infrastructure
# ============================================================================

staging-infra-up:
	@echo "=== Starting staging infrastructure ==="
	docker compose -f compose/staging/infrastructure.yml up -d
	@echo "Staging infrastructure started"

staging-infra-down:
	docker compose -f compose/staging/infrastructure.yml down

# ============================================================================
# All Services
# ============================================================================

staging-up: staging-infra-up
	@echo "=== Starting all staging services ==="
	docker compose -f compose/staging/infrastructure.yml -f compose/staging/services.yml up -d
	@echo "Staging services started on port 3100"

staging-down:
	docker compose -f compose/staging/infrastructure.yml -f compose/staging/services.yml down

staging-restart:
	docker compose -f compose/staging/infrastructure.yml -f compose/staging/services.yml restart

staging-logs:
	docker compose -f compose/staging/infrastructure.yml -f compose/staging/services.yml logs -f

staging-ps:
	docker compose -f compose/staging/infrastructure.yml -f compose/staging/services.yml ps

staging-clean:
	docker compose -f compose/staging/infrastructure.yml -f compose/staging/services.yml down -v --remove-orphans

# ============================================================================
# Migrations & Health
# ============================================================================

staging-migrate-all:
	@echo "=== Running staging migrations ==="
	@echo "TODO: Implement staging migrations"

staging-health-check:
	@echo "=== Checking staging services health ==="
	@docker compose -f compose/staging/infrastructure.yml -f compose/staging/services.yml ps

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
