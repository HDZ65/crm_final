# Learnings - Catalogue Product Filter Fix

## [2026-02-12T16:50:00Z] Task: Filter products by visible gammes when société is active

### Bug Fixed
**Problem**: When a société is selected with no gammes, the gammes sidebar correctly shows empty, but ALL products from the entire organisation were still displayed in the product list.

**Root Cause**: The `filteredProducts` useMemo only filtered by `selectedGammeId` when a specific gamme was selected. When `selectedGammeId === "all"`, no société-based filtering was applied.

**Solution**: Added société-scoped filtering that leverages the fact that `gammes` array is already filtered by société.

### Pattern: Client-Side Filtering with Pre-Filtered Data

**Context**: Backend filters gammes by société, frontend receives société-specific gammes, but products come from organisation-wide fetch.

**Pattern Applied**:
```typescript
// Backend already filters gammes by société
const gammes = await getGammesByOrganisation({ organisationId, societeId })

// Products fetched organisation-wide
const produits = await getProduitsByOrganisation({ organisationId })

// Client-side filtering using pre-filtered gammes as scope
if (activeSocieteId && selectedGammeId === "all" && gammes.length > 0) {
  const visibleGammeIds = new Set(gammes.map((g) => g.id))
  result = result.filter((p) => visibleGammeIds.has(p.gammeId))
}
```

**Why this works**:
- `gammes` is already filtered by backend when société is active
- Creating a Set from gamme IDs gives O(1) lookup performance
- Products are filtered to only those whose `gammeId` exists in visible gammes
- No additional backend call needed

**Edge Cases Handled**:
1. ✅ Société active + gammes exist → filter products by visible gammes
2. ✅ Société active + no gammes → return empty array
3. ✅ No société active → show all products (original behavior)

### Pattern: Set-Based Filtering for Performance

**Instead of:**
```typescript
// O(n*m) - for each product, search through gammes array
result = result.filter((p) => gammes.some((g) => g.id === p.gammeId))
```

**Use:**
```typescript
// O(n+m) - create Set once, then O(1) lookup per product
const visibleGammeIds = new Set(gammes.map((g) => g.id))
result = result.filter((p) => visibleGammeIds.has(p.gammeId))
```

**Performance Benefit**:
- With 100 gammes and 1000 products:
  - Array.some approach: 100,000 comparisons
  - Set approach: 100 Set insertions + 1000 lookups = ~1100 operations
- ~90x performance improvement

### Pattern: Early Returns in useMemo

**Observation**: When a condition requires returning early (empty array), use explicit early return instead of complex nested logic.

```typescript
// Clear and readable
if (activeSocieteId && selectedGammeId === "all" && gammes.length === 0) {
  return []
}
```

**Benefit**: Makes the "no products to show" case explicit and easy to understand.

### useMemo Dependencies: Include ALL Used Values

**Mistake to Avoid**:
```typescript
// WRONG - missing activeSocieteId and gammes
}, [produits, selectedGammeId, productSearchQuery])
```

**Correct**:
```typescript
// RIGHT - includes ALL values used in the memo
}, [produits, selectedGammeId, productSearchQuery, activeSocieteId, gammes])
```

**Why This Matters**:
- Missing dependencies cause stale closures
- React won't re-run the memo when société or gammes change
- Results in displaying incorrect products after société switch

### Files Modified
- `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx` (+12, -2)
  - Lines 250-276: `filteredProducts` useMemo

### Commit
- `8f7a7a7b` - fix(catalogue): filter products by visible gammes when société is active

### Related Work
- Previous: `84d30ccb` - Edit Gamme dialog + produit refetch fixes
- Feature: Gamme-société association (société filtering throughout catalogue)
