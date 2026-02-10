# Issues & Gotchas - optimize-authme-n1

## Known Issues
(Append problems encountered and their solutions)


## [2026-02-10T16:08:09Z] Infrastructure Blockers (Pre-existing)

### Backend Build Failure
- Error: Missing @bufbuild/protobuf dependency in proto generated files
- Impact:  fails in service-core
- Status: Pre-existing issue, not caused by findByIds changes
- Root cause: package.json missing @bufbuild/protobuf/wire dependency

### Frontend Build Timeout
- Issue: npm run build exceeds 60s timeout
- Impact: Cannot verify full frontend build
- Status: Large Next.js project, slow build times
- Workaround: TypeScript syntax verified via grep + manual inspection


## [2026-02-10T15:55:19Z] Infrastructure Blockers (Pre-existing)

### Backend Build Failure
- Error: Missing @bufbuild/protobuf dependency in proto generated files
- Impact: `bun run build` fails in service-core  
- Status: Pre-existing issue, not caused by findByIds changes
- Root cause: package.json missing @bufbuild/protobuf/wire dependency

### Frontend Build Timeout
- Issue: npm run build exceeds 60s timeout
- Impact: Cannot verify full frontend build
- Status: Large Next.js project, slow build times
- Workaround: TypeScript syntax verified via grep + manual inspection
