# Migration npm → bun - Completion Summary

**Completed**: 2026-02-03
**Status**: ✅ ALL TASKS COMPLETE

## Tasks Completed

| Task | Description | Status |
|------|-------------|--------|
| 1 | Root package.json updated | ✅ |
| 2 | bun.lock generated | ✅ |
| 3 | Pilot validation (service-users) | ✅ |
| 4 | service-users Dockerfile | ✅ |
| 5 | 18 service Dockerfiles | ✅ |
| 6 | Frontend Dockerfile | ✅ |
| 7 | 5 Makefiles | ✅ |
| 8 | 4 CI/CD workflows | ✅ |
| 9 | 7 scripts/templates | ✅ |
| 10 | Cleanup (25 package-lock.json deleted) | ✅ |

## Key Changes

### Files Modified: 60+
- 21 Dockerfiles (oven/bun:1-alpine)
- 5 Makefiles (bun commands)
- 4 CI/CD workflows (setup-bun)
- 7 scripts (bun templates)
- Root package.json (packageManager: bun@1.2.0)

### Files Deleted: 25
- All package-lock.json files

## Verification Results

```
✅ bun.lock exists (473KB)
✅ packageManager: bun@1.2.0
✅ 0 npm ci in workflows
✅ 0 npm ci in scripts
✅ 0 npm in Makefiles
✅ 0 package-lock.json remaining
✅ 38 bun references in service Dockerfiles
✅ 5 bun references in frontend Dockerfile
✅ 5 setup-bun actions in CI/CD
```

## Migration Pattern Applied

1. **Dockerfiles**: `node:20-alpine` → `oven/bun:1-alpine`
2. **Install**: `npm ci` → `bun install --frozen-lockfile`
3. **Run**: `npm run` → `bun run`
4. **Execute**: `npx` → `bunx`
5. **Lock**: `package-lock.json` → `bun.lock`
6. **CI/CD**: `actions/setup-node` → `oven-sh/setup-bun@v2`

## Notes

- Next.js requires `--bun` flag: `bun --bun run build`
- Bun automatically handles peer dependencies (no --legacy-peer-deps needed)
- $npm_config_name variable works with bun
- All 19 services + frontend migrated successfully

## Post-migration Fixes

- Docker builds failed with `Workspace not found "frontend"` / frozen lockfile changes.
- Root cause: bun requires all workspace package.json files present in Docker build context.
- Fix: copy `packages/nats-utils/package.json` and all `services/*/package.json` (via `COPY services ./services` + prune) before running `bun install`.
- Also run `bun install --frozen-lockfile --no-save --filter ./services/<service>` in service Dockerfiles.

## Alignment with winaity-clean

- Updated all service Dockerfiles to match winaity-clean pattern:
  - `bun install --frozen-lockfile` (no `--filter`, no `--no-save`)
  - Production stage installs deps via `bun install --production --frozen-lockfile`
  - Runtime and healthcheck use `bun` instead of `node`
  - Workspace package.json files are copied before install to keep lockfile stable
- Verified with a sample build (`services/service-referentiel/Dockerfile`) after alignment.
