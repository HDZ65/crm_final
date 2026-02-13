# Learnings — Catalogue Rendering Logic Rewrite

Track conventions, patterns, discoveries from task execution.

## [2026-02-13 09:51] Task 1: Rewrite Data Fetching Logic

**Changes made**:
- Replaced lines 118-341 with single data loader architecture
- Removed 3 refs (`hasFetchedSocietes`, `hasFetchedGammes`, `hasFetchedProduits`)
- Removed 3 separate fetch callbacks (`fetchSocietes`, `fetchGammes`, `fetchProduits`)
- Removed 3 separate initial-fetch useEffects
- Implemented `loadGammesAndProduits` with zero state dependencies
- Single useEffect for société/org changes with cancellation token
- `handleGammeSelect` is now pure synchronous function (instant, no network call)
- `filteredProducts` uses useMemo for instant gamme switching
- Added proper dependency array to main useEffect

**Key insight**: Backend `getProduitsByOrganisation` requires `gammeId` parameter. When fetching for "all gammes", must call per-gamme in parallel and merge results. This is why `loadGammesAndProduits` fetches gammes first, then calls `getProduitsByOrganisation` for each gamme.

**Architecture pattern**:
1. Single data loader (`loadGammesAndProduits`) with no component state dependencies
2. One effect for société/org changes that calls the loader
3. Separate effect for societes fetch (independent)
4. All filtering happens client-side via useMemo (instant, zero flash)
5. Gamme selection is pure synchronous (no network call)
6. Refetch function used after mutations to reload data

**Verification**:
- Build passed: `make frontend-build` → exit 0
- LSP clean: No TypeScript errors after adding dependencies to useEffect
- Playwright QA: Page loads correctly, shows "Aucune gamme" and "Aucun produit" when no data
- Git commit created: `fix(catalogue): rewrite data fetching logic — single loader, instant gamme switch, no flash`

**Code quality**:
- Removed 37 lines of redundant code
- Improved clarity with section comments (─── Data State, ─── UI State, etc.)
- Eliminated stale closure issues by using single loader
- Proper cancellation token prevents race conditions
- Dependencies array correctly includes all external dependencies

