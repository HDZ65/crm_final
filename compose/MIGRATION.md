# Shared Dockerfile Migration Guide

## Overview

This guide explains how to migrate from 19 duplicate Dockerfiles to a single shared template (`compose/Dockerfile.service`).

## Benefits

- **Single Source of Truth**: One Dockerfile template for all services
- **Reduced Maintenance**: Updates apply to all services automatically
- **Consistency**: Guaranteed identical build process across all services
- **Easier Onboarding**: New services use the same proven pattern
- **Reduced Duplication**: 19 Dockerfiles → 1 template (95% reduction)

## Current State

- **19 identical Dockerfiles** in `services/service-*/Dockerfile`
- Only difference: service name and port number
- All follow same multi-stage build pattern (deps → development → builder → production)
- All use Node 20 Alpine with identical dependencies

## Migration Path

### Phase 1: Validation (No Breaking Changes)

1. **Create shared template** ✅ (Done)
   - `compose/Dockerfile.service` - parameterized template
   - `compose/docker-compose.template.yml` - example usage

2. **Test template with one service**
   ```bash
   docker build \
     --build-arg SERVICE_NAME=service-activites \
     -f compose/Dockerfile.service \
     -t crm/service-activites:latest \
     .
   ```

3. **Verify image works identically**
   - Compare with existing `services/service-activites/Dockerfile` build
   - Run container and verify health checks pass
   - Verify gRPC port is accessible

### Phase 2: Gradual Migration (Optional)

4. **Update docker-compose files** (one at a time)
   - Replace individual Dockerfile references with shared template
   - Update build args to specify SERVICE_NAME
   - Test each service independently

5. **Update CI/CD pipelines**
   - Modify build scripts to use shared template
   - Update image naming conventions if needed
   - Test in staging environment

### Phase 3: Cleanup (After Validation)

6. **Archive old Dockerfiles** (optional)
   ```bash
   mkdir -p services/.archived-dockerfiles
   for dir in services/service-*/; do
     mv "$dir/Dockerfile" services/.archived-dockerfiles/Dockerfile.$(basename $dir)
   done
   ```

7. **Update documentation**
   - Point to `compose/Dockerfile.service` as canonical reference
   - Update build instructions in README
   - Document the new build process

## Rollback Procedure

If issues arise, rollback is simple:

1. **Restore old Dockerfiles** (if archived)
   ```bash
   for file in services/.archived-dockerfiles/Dockerfile.*; do
     service=$(basename $file | sed 's/Dockerfile\.//')
     cp "$file" "services/$service/Dockerfile"
   done
   ```

2. **Revert docker-compose changes**
   - Use git to restore previous versions
   - No data loss or state changes

3. **Rebuild with old Dockerfiles**
   ```bash
   docker-compose build
   ```

## Testing Checklist

Before committing to full migration:

- [ ] Build shared template with SERVICE_NAME=service-activites
- [ ] Verify image size is identical to original
- [ ] Run container and verify health check passes
- [ ] Verify gRPC port (50051) is accessible
- [ ] Test with docker-compose using shared template
- [ ] Verify all environment variables work
- [ ] Check logs for any warnings or errors
- [ ] Test with development target (hot-reload)
- [ ] Verify multi-stage build caching works
- [ ] Compare build time with original Dockerfile

## Build Examples

### Using Shared Template Directly

```bash
# Build for production
docker build \
  --build-arg SERVICE_NAME=service-activites \
  -f compose/Dockerfile.service \
  -t crm/service-activites:latest \
  .

# Build for development
docker build \
  --build-arg SERVICE_NAME=service-activites \
  -f compose/Dockerfile.service \
  --target development \
  -t crm/service-activites:dev \
  .
```

### Using docker-compose

```bash
# Build all services using template
docker-compose -f compose/docker-compose.template.yml build

# Build specific service
docker-compose -f compose/docker-compose.template.yml build service-activites

# Run services
docker-compose -f compose/docker-compose.template.yml up
```

## Service Port Mapping

Services use gRPC ports 50051-50069:

| Service | Port |
|---------|------|
| service-activites | 50051 |
| service-clients | 50052 |
| service-commerciaux | 50053 |
| service-commission | 50054 |
| service-contrats | 50055 |
| service-dashboard | 50056 |
| service-documents | 50057 |
| service-email | 50058 |
| service-factures | 50059 |
| service-fournisseurs | 50060 |
| service-gestion-stock | 50061 |
| service-notifications | 50062 |
| service-payments | 50063 |
| service-produits | 50064 |
| service-rapports | 50065 |
| service-ressources | 50066 |
| service-taches | 50067 |
| service-calendar | 50068 |
| service-users | 50069 |

## Important Notes

### ARG vs ENV

- `ARG SERVICE_NAME` is a **build-time argument** (required)
- Must be passed during `docker build` or in docker-compose `build.args`
- Not available at runtime (use ENV for runtime variables)

### Multi-Stage Build Targets

- `deps` - Base stage with dependencies installed
- `development` - Full source for dev mode with hot-reload
- `builder` - Compiles TypeScript and builds packages
- `production` - Minimal runtime image (default target)

### Health Check

The health check uses a simple TCP connection test:
```bash
node -e "require('net').connect(50051, 'localhost').on('connect', () => process.exit(0)).on('error', () => process.exit(1))"
```

This works for gRPC services and is lightweight.

## FAQ

**Q: Will this break existing deployments?**
A: No. The shared template produces identical images. Existing deployments can continue using old Dockerfiles.

**Q: Can I use this with Kubernetes?**
A: Yes. Build images using the shared template, then use them in K8s manifests as usual.

**Q: What if I need service-specific customizations?**
A: The template supports all current services. For unique needs, create a service-specific Dockerfile that extends the template.

**Q: How do I update the template?**
A: Edit `compose/Dockerfile.service` once, and all services benefit from the update.

**Q: Can I use this with CI/CD?**
A: Yes. Update your build scripts to use:
```bash
docker build --build-arg SERVICE_NAME=$SERVICE_NAME -f compose/Dockerfile.service ...
```

## Next Steps

1. Review `compose/Dockerfile.service` and `compose/docker-compose.template.yml`
2. Test with one service following the Testing Checklist
3. Update docker-compose files to use shared template
4. Update CI/CD pipelines
5. Archive old Dockerfiles (optional)
6. Update project documentation
