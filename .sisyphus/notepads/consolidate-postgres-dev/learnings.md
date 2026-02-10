# Learnings - Consolidate PostgreSQL Dev

## 2026-02-07 - PostgreSQL Consolidation Complete

### What Worked Well

1. **Docker Compose DNS Resolution**
   - Service names (not container_names) are used for inter-container communication
   - `DB_HOST=postgres-main` works because Docker Compose creates DNS entries for service names

2. **Idempotent Database Creation Pattern**
   - PostgreSQL doesn't support `CREATE DATABASE IF NOT EXISTS`
   - Solution: `SELECT 1 FROM pg_database WHERE datname='X' | grep -q 1 || CREATE DATABASE X`
   - This pattern allows `make db-init` to be run multiple times without errors

3. **Extension Installation**
   - `uuid-ossp` extension needs to be installed per-database
   - Use `CREATE EXTENSION IF NOT EXISTS` (this one IS supported for extensions)

4. **SCRAM-SHA-256 Authentication**
   - Modern PostgreSQL uses SCRAM-SHA-256 by default
   - Requires proper password handling via environment variables
   - `PGPASSWORD` must be set for non-interactive psql commands

### Challenges Encountered

1. **Container Name Typos**
   - Found typos in existing Makefile: `dev-crm-engagement` instead of `dev-crm-service-engagement`
   - Fixed during Task 4 implementation

2. **Volume Cleanup**
   - Old volumes (`crmdev_*_db_data`) need manual cleanup after migration
   - Not automatically removed to avoid data loss surprises

### Memory Optimization Results

- **Before**: 6 containers × ~1-2GB = ~7GB total
- **After**: 1 container × 3GB = 3GB total
- **Savings**: ~4GB RAM (57% reduction)

### Files Modified

1. `compose/dev/infrastructure.yml` - Removed 5 DB services, increased memory
2. `compose/dev/service-*.yml` (×5) - Updated depends_on
3. `services/*/ .env.development` (×5) - Updated DB_HOST
4. `make/dev.mk` - Added db-init, updated targets

### Verification Strategy

- Always verify with actual Docker commands, not just file checks
- Run full end-to-end test: infra-up → db-init → services-up → migrations
- Test idempotency by running db-init twice

### Commands for Future Reference

```bash
# Quick start consolidated environment
make dev-infra-up && make db-init && make dev-up

# Verify databases exist
docker exec dev-crm-postgres-main psql -U postgres -tc "\l"

# Check extensions
docker exec dev-crm-postgres-main psql -U postgres -d identity_db -c "SELECT * FROM pg_extension;"
```
