# Docker Template Implementation - Learnings

## Task Completed
Created 4-stage Dockerfile template with dumb-init for proper signal handling in production.

## What Was Done

### 1. Created `docker/Dockerfile.template`
- **4 Stages**: deps, development, builder, production
- **Stage 1 (deps)**: Base dependencies installation (Node 20-alpine, build tools)
- **Stage 2 (development)**: Development environment with source code and dev commands
- **Stage 3 (builder)**: Compilation stage - builds TypeScript and removes source maps
- **Stage 4 (production)**: Final image with dumb-init as entrypoint for signal handling

### 2. Created `scripts/generate-dockerfiles.ts`
- TypeScript script to generate service-specific Dockerfiles from template
- Adapts template for each service with correct port and paths
- Replaces obsolete `scripts/generate-dockerfiles.js`
- Maintains SERVICE_PORTS mapping for all 19 microservices

### 3. Deleted `Dockerfile.base`
- Removed obsolete base Dockerfile
- All services now use generated Dockerfiles from template

## Key Design Decisions

### Why dumb-init?
- **Signal Handling**: Ensures Node.js process receives SIGTERM/SIGINT correctly
- **Zombie Process Prevention**: Reaps orphaned child processes
- **Production Best Practice**: Standard for containerized Node.js applications
- **Minimal Overhead**: Lightweight Alpine package (~50KB)

### 4-Stage Structure Benefits
1. **deps**: Cached dependency layer - only rebuilds when package.json changes
2. **development**: Enables `docker build --target=development` for dev environments
3. **builder**: Isolated build environment - keeps build tools out of production
4. **production**: Minimal final image with only runtime dependencies

### Node.js 20-alpine Choice
- Maintained LTS version (until April 2026)
- Alpine Linux reduces image size (~150MB vs ~900MB with Debian)
- Compatible with existing npm workspaces setup
- Sufficient for NestJS + gRPC microservices

## Technical Notes

### Template Flexibility
- Template uses comments for service-specific sections
- Generator script fills in SERVICE_NAME and PORT variables
- Supports both development and production builds

### Production Optimizations
- Source maps removed in builder stage (`find dist -name "*.map" -delete`)
- Non-hoisted node_modules copied separately for NestJS compatibility
- Shared packages (proto, grpc-utils, shared) included in final image
- Health check uses gRPC port connectivity test

### Acceptance Criteria Met
✓ Template has exactly 4 FROM stages
✓ dumb-init installed and used as ENTRYPOINT
✓ Dockerfile.base successfully removed
✓ All 19 services can be generated from template

## Future Improvements
- Add multi-platform builds (linux/amd64, linux/arm64)
- Implement layer caching optimization for monorepo
- Add security scanning in builder stage
- Consider distroless base image for production (if gRPC compatibility verified)

## Files Modified
- **Created**: `docker/Dockerfile.template` (95 lines)
- **Created**: `scripts/generate-dockerfiles.ts` (200 lines)
- **Deleted**: `Dockerfile.base`
- **Commit**: `f89e0f24` - "build(docker): add 4-stage Dockerfile template with dumb-init"
