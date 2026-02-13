# Fix: Produits affichés pour toutes les sociétés quand vue "Toutes les gammes"

## TL;DR

> **Quick Summary**: Quand une société est sélectionnée et que l'utilisateur est en vue "Toutes les gammes", les produits de TOUTES les gammes s'affichent au lieu de ne montrer que ceux des gammes de la société active. Fix : filtrer côté client les produits par les gammes visibles.
>
> **Deliverables**:
> - Fix du `filteredProducts` useMemo dans `catalogue-page-client.tsx`
>
> **Estimated Effort**: Quick (1 bloc de code à modifier)
> **Parallel Execution**: NO
> **Critical Path**: Edit → TypeScript verify → Commit

---

## Context

### Bug Report
Quand l'utilisateur sélectionne une société qui n'a pas de gammes, le sidebar gammes est correctement vide, mais la liste des produits affiche TOUS les produits de toutes les gammes de l'organisation.

### Root Cause
Dans `filteredProducts` useMemo, quand `selectedGammeId === "all"`, aucun filtrage n'est appliqué. Les produits des gammes d'AUTRES sociétés sont affichés.

### Variables disponibles dans le composant
- `activeSocieteId` (ligne 121) : société active depuis le store
- `gammes` (ligne 131) : tableau de gammes DÉJÀ filtré par société via `fetchGammes`
- `Produit.gammeId` : chaque produit a un `gammeId: string`

---

## TODOs

- [x] 1. Modifier le filteredProducts useMemo pour filtrer par gammes visibles

  **What to do**:

  Dans `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx`, trouver et remplacer ce bloc EXACT :

  **FIND** (le bloc actuel) :
  ```typescript
  // Filter products by search
  const filteredProducts = React.useMemo(() => {
    if (!selectedGammeId) return []
    let result = produits

    if (productSearchQuery) {
      const query = productSearchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.nom.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      )
    }

    return result
  }, [produits, selectedGammeId, productSearchQuery])
  ```

  **REPLACE WITH** :
  ```typescript
  // Filter products by search + société scope
  const filteredProducts = React.useMemo(() => {
    if (!selectedGammeId) return []
    let result = produits

    // When a société is active and viewing "all" gammes,
    // only show products belonging to gammes of that société
    if (activeSocieteId && selectedGammeId === "all" && gammes.length > 0) {
      const visibleGammeIds = new Set(gammes.map((g) => g.id))
      result = result.filter((p) => visibleGammeIds.has(p.gammeId))
    } else if (activeSocieteId && selectedGammeId === "all" && gammes.length === 0) {
      // Société selected but no gammes → no products to show
      return []
    }

    if (productSearchQuery) {
      const query = productSearchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.nom.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      )
    }

    return result
  }, [produits, selectedGammeId, productSearchQuery, activeSocieteId, gammes])
  ```

  **Logique du fix** :
  - Si `activeSocieteId` est défini ET vue "all" ET des gammes existent → ne garder que les produits dont le `gammeId` est dans les gammes visibles
  - Si `activeSocieteId` est défini ET vue "all" ET aucune gamme → retourner tableau vide
  - Si pas de société active → comportement actuel inchangé (tout afficher)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`]

  **References**:
  - `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx:251-266` — Bloc à modifier
  - `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx:121` — `activeSocieteId` disponible
  - `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx:131` — `gammes` state array
  - `frontend/src/proto/products/products.ts:623` — `Produit.gammeId: string`

  **Acceptance Criteria**:
  - [x] Bloc `filteredProducts` modifié avec filtrage par gammes visibles
  - [x] Dependency array inclut `activeSocieteId` et `gammes`
  - [x] `npx tsc --noEmit` passe sans erreur

  **Must NOT do**:
  - Ne PAS modifier `fetchProduits`
  - Ne PAS modifier `fetchGammes`
  - Ne PAS modifier d'autres fichiers
  - Ne PAS ajouter de nouvelles dépendances

  **Commit**: YES
  - Message: `fix(catalogue): filter products by visible gammes when société is active`
  - Files: `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx`

---

## Success Criteria

### Verification Commands
```bash
cd frontend && npx tsc --noEmit  # Expected: no errors
```

### Final Checklist
- [x] Société avec gammes → vue "all" ne montre que les produits de ces gammes
- [x] Société sans gammes → vue "all" ne montre aucun produit
- [x] Pas de société → vue "all" montre tous les produits
- [x] TypeScript compilation passe
