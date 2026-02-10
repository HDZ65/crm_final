# Unresolved Problems - Tâches UX Coherence

## Active Problems

*No active blockers at this time.*

## Resolved Problems

### Problem 1: ErrorState Component Missing ✅
**Reported**: 2026-02-08 (Metis review)
**Description**: ErrorState component doesn't exist in frontend/src/components/ui/
**Resolution**: Copied from clone/winaity-clean in Task 0
**Resolved**: 2026-02-08 (Wave 1)

### Problem 2: SiteHeader Missing Titles ✅
**Reported**: 2026-02-08 (Metis review)
**Description**: /taches routes don't have configured titles in site-header.tsx
**Resolution**: Added route mappings in Task 6
**Resolved**: 2026-02-08 (Wave 1)

### Problem 3: Native confirm() on Config Page ✅
**Reported**: 2026-02-08 (Plan creation)
**Description**: Configuration page uses native confirm() instead of AlertDialog
**Resolution**: Replaced with AlertDialog in Task 4
**Resolved**: 2026-02-08 (Wave 1)

## Deferred Issues (Out of Scope)

### Deferred 1: Client Name Resolution
**Description**: Task table shows truncated UUID instead of client name
**Reason**: Would require new backend API endpoint
**Scope**: Frontend-only changes (per user request)
**Alternative**: User can click link to see full client details

### Deferred 2: Backend Filter Fix
**Description**: "Mes tâches" filter might not work correctly on backend
**Reason**: Backend bug, out of scope for UX coherence fix
**Scope**: Critical + Major frontend issues only

### Deferred 3: Column Sorting
**Description**: Task table columns not sortable
**Reason**: Minor UX improvement, not critical for MVP
**Scope**: Out of scope (U5 in original analysis)

### Deferred 4: Filter by Type
**Description**: No filter dropdown for task type
**Reason**: Minor UX improvement, not critical for MVP
**Scope**: Out of scope (U6 in original analysis)

### Deferred 5: Console.log Cleanup
**Description**: Some console.log statements might remain in code
**Reason**: Code quality issue, not UX/UI coherence
**Scope**: Out of scope for this plan
