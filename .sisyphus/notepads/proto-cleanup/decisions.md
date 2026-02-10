# Decisions - Proto Cleanup

## [2026-02-05T16:19:42] Plan Decisions
Session: ses_3d17c51e0ffe7Mz36rOQk10CvK

### Scope Decisions
- Clean 4 services: service-core, service-finance, service-commercial, service-engagement
- Exclude service-logistics (already clean)
- Do NOT touch @crm/proto or packages/proto/
- Do NOT modify imports in source files

### Commit Strategy
- Single commit after all 4 services cleaned
- Message: `chore(services): remove dead proto/generated code and obsolete scripts`

## Task 4: service-engagement Cleanup

**Date**: 2026-02-05

### Decision: Complete removal of proto infrastructure
- Deleted `services/service-engagement/proto/generated/` directory (6 files)
- Removed 4 proto-related scripts from package.json:
  - `proto:generate` (complex node script copying proto files)
  - `proto:clean` (rimraf + mkdir)
  - `prebuild` (was calling proto:clean && proto:generate)
  - `prestart:dev` (was calling proto:generate)

### Rationale
- No code imports from proto/generated (verified in Task 0)
- Dead code removal is safe
- Simplifies build pipeline
- Reduces package.json complexity

### Verification
✓ Directory deleted: `ls proto/generated` returns "No such file or directory"
✓ Scripts removed: `grep "proto:generate"` returns exit code 1
✓ All 4 scripts successfully removed from package.json

### Impact
- Build process simplified (no proto generation step)
- Development startup faster (no prestart:dev proto generation)
- Cleaner package.json (5 fewer lines)
