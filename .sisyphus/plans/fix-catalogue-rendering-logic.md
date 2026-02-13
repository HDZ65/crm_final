# Fix Catalogue Page Rendering Logic — Complete Rewrite

## TL;DR

> **Quick Summary**: Rewrite the entire data fetching/filtering/effects logic of the catalogue page. The current code is a patchwork of contradictory useEffects, stale closures, and redundant fetches that cause flash, empty states, and flickering.
>
> **Deliverables**: 
> - Clean catalogue-page-client.tsx with one data loader, one effect, instant gamme switching
> - Clean page.tsx SSR with per-gamme product fetching
>
> **Estimated Effort**: Short (1 file rewrite, ~200 lines changed)
> **Parallel Execution**: NO — sequential, single file

---

## Context

### Problem
The catalogue page has broken rendering:
1. Switching gammes shows wrong products / flashes all products for 1 sec
2. "Toutes les gammes" sometimes shows nothing
3. Selecting a société then a gamme shows stale data
4. Multiple contradictory useEffects fight each other

### Root Causes
- Backend `produits.list` returns **EMPTY** when called without `gammeId` — must always pass a gammeId
- Multiple useEffects/useCallbacks with stale closures (`selectedGammeId`, `gammes` captured at wrong time)
- `produits` state sometimes contains "all products" and sometimes "one gamme's products" — inconsistent
- No client-side gamme filter when viewing a specific gamme → stale data visible during fetch

### Architecture Decision: ALL products in memory, gamme switch = client-side filter

**Rule**: `produits` state ALWAYS contains products for ALL visible gammes. Switching gamme = instant `useMemo` filter. NO network call on gamme click.

**Data loading happens only when**:
1. Initial page load (SSR in page.tsx)
2. Société changes (useEffect)
3. After a mutation (create/update/delete product or gamme)

---

## TODOs

- [x] 1. Rewrite data logic in catalogue-page-client.tsx

  **What to do**:
  
  Replace the entire section from line 118 (`const { activeOrganisation }`) to the end of the société-change useEffect (~line 340) with the following clean architecture:

  ```typescript
  const { activeOrganisation } = useOrganisation()
  const activeSocieteId = useSocieteStore((state) => state.activeSocieteId)

  // ─── Data State (initialised from SSR) ─────────────────────
  const [societes, setSocietes] = React.useState<Societe[]>(initialSocietes ?? [])
  const [gammes, setGammes] = React.useState<Gamme[]>(initialGammes ?? [])
  const [produits, setProduits] = React.useState<Produit[]>(initialProduits ?? [])

  // ─── UI State ──────────────────────────────────────────────
  const [selectedGammeId, setSelectedGammeId] = React.useState<string | null>("all")
  const [gammeSearchQuery, setGammeSearchQuery] = React.useState("")
  const [productSearchQuery, setProductSearchQuery] = React.useState("")
  const [selectedProduct, setSelectedProduct] = React.useState<Produit | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [productToEdit, setProductToEdit] = React.useState<Produit | null>(null)
  const [isCreateGammeDialogOpen, setIsCreateGammeDialogOpen] = React.useState(false)
  const [newGammeForm, setNewGammeForm] = React.useState({
    societeId: "",
    nom: "",
    description: "",
  })
  const [isEditGammeDialogOpen, setIsEditGammeDialogOpen] = React.useState(false)
  const [gammeToEdit, setGammeToEdit] = React.useState<Gamme | null>(null)
  const [editGammeForm, setEditGammeForm] = React.useState({
    societeId: "",
    nom: "",
    description: "",
  })

  // ─── Mutation Loading State (only for buttons) ─────────────
  const [createLoading, setCreateLoading] = React.useState(false)
  const [updateLoading, setUpdateLoading] = React.useState(false)
  const [createGammeLoading, setCreateGammeLoading] = React.useState(false)
  const [updateGammeLoading, setUpdateGammeLoading] = React.useState(false)
  const [isSyncing, setIsSyncing] = React.useState(false)

  // ─── Core Data Loader ──────────────────────────────────────
  // Fetches gammes, then ALL products for those gammes in parallel.
  // Returns data directly — zero dependency on component state.
  const loadGammesAndProduits = React.useCallback(async (
    orgId: string,
    societeId?: string,
  ) => {
    const gammesResult = await getGammesByOrganisation({
      organisationId: orgId,
      societeId,
    })
    const newGammes = gammesResult.data?.gammes ?? []

    let newProduits: Produit[] = []
    if (newGammes.length > 0) {
      const results = await Promise.all(
        newGammes.map(g =>
          getProduitsByOrganisation({ organisationId: orgId, gammeId: g.id })
        )
      )
      newProduits = results.flatMap(r => r.data?.produits ?? [])
    }

    return { gammes: newGammes, produits: newProduits }
  }, [])

  // ─── Single Effect: reload on société / org change ─────────
  const isFirstRender = React.useRef(true)

  React.useEffect(() => {
    const orgId = activeOrganisation?.organisationId
    if (!orgId) return

    // First render: SSR already provided data, skip fetch
    if (isFirstRender.current) {
      isFirstRender.current = false
      if (initialGammes && initialProduits) return
    }

    let cancelled = false
    setSelectedGammeId("all")
    setGammeSearchQuery("")
    setProductSearchQuery("")

    loadGammesAndProduits(orgId, activeSocieteId || undefined).then(data => {
      if (cancelled) return
      setGammes(data.gammes)
      setProduits(data.produits)
    })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSocieteId, activeOrganisation?.organisationId])

  // Fetch societes on org change
  React.useEffect(() => {
    if (!activeOrganisation?.organisationId) return
    getSocietesByOrganisation(activeOrganisation.organisationId).then(result => {
      if (result.data?.societes) setSocietes(result.data.societes)
    })
  }, [activeOrganisation?.organisationId])

  // ─── Refetch (after mutations) ─────────────────────────────
  const refetch = React.useCallback(async () => {
    const orgId = activeOrganisation?.organisationId
    if (!orgId) return
    const data = await loadGammesAndProduits(orgId, activeSocieteId || undefined)
    setGammes(data.gammes)
    setProduits(data.produits)
  }, [activeOrganisation?.organisationId, activeSocieteId, loadGammesAndProduits])

  const refetchGammes = refetch

  // ─── Gamme Selection (instant, pure client-side) ───────────
  const handleGammeSelect = React.useCallback((gammeId: string) => {
    setSelectedGammeId(gammeId)
    setProductSearchQuery("")
  }, [])

  // ─── Derived Data (useMemo — synchronous, zero flash) ──────
  const selectedGamme = React.useMemo(
    () => gammes.find((g) => g.id === selectedGammeId) ?? null,
    [gammes, selectedGammeId],
  )

  const filteredGammes = React.useMemo(() => {
    if (!gammeSearchQuery) return gammes
    const q = gammeSearchQuery.toLowerCase()
    return gammes.filter((g) =>
      g.nom.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q)
    )
  }, [gammes, gammeSearchQuery])

  const filteredProducts = React.useMemo(() => {
    if (!selectedGammeId) return []
    let result = produits

    if (selectedGammeId === "all") {
      if (activeSocieteId && gammes.length > 0) {
        const ids = new Set(gammes.map((g) => g.id))
        result = result.filter((p) => ids.has(p.gammeId))
      }
    } else {
      result = result.filter((p) => p.gammeId === selectedGammeId)
    }

    if (productSearchQuery) {
      const q = productSearchQuery.toLowerCase()
      result = result.filter((p) =>
        p.nom.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      )
    }
    return result
  }, [produits, selectedGammeId, productSearchQuery, activeSocieteId, gammes])

  const canCreateGamme = true
  const canCreateProduct = selectedGammeId && selectedGammeId !== "all"
  ```

  **CRITICAL things to REMOVE** (these cause the bugs):
  - `hasFetchedSocietes`, `hasFetchedGammes`, `hasFetchedProduits` refs
  - Separate `fetchGammes` and `fetchProduits` useCallbacks  
  - The 3 separate initial-fetch useEffects
  - The société-change useEffect
  - `gammesLoading`, `produitsLoading` states (already removed but verify)
  - The `loading` derived variable
  
  **CRITICAL things to KEEP unchanged**:
  - All handler functions BELOW this section (`handleCreateProduct`, `handleUpdateProduct`, `handleOpenEditDialog`, `handleCreateGamme`, `handleOpenEditGamme`, `handleUpdateGamme`, etc.)
  - All JSX render code
  - All dialog states and forms
  - The `ProductCard`, `ProductDetail`, `DetailRow` sub-components at the bottom

  **Verify handlers still reference correct functions**:
  - `refetch()` — used in `handleCreateProduct`, `handleUpdateProduct`, sync button
  - `refetchGammes()` — used in `handleCreateGamme`, `handleUpdateGamme` (now alias of refetch)
  - `handleGammeSelect()` — used in "Toutes les gammes" button and gamme list onClick/onKeyDown

  **Must NOT do**:
  - Do not add any loading spinner or loading state to the product list render
  - Do not add `setProduits([])` anywhere — never clear products
  - Do not create separate fetch functions for gammes and products

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`]

  **References**:
  - `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx` — THE file to modify
  - `frontend/src/app/(main)/catalogue/page.tsx` — SSR page, already fixed
  - `frontend/src/actions/catalogue.ts:157-182` — `getProduitsByOrganisation` action (backend NEEDS gammeId, returns empty without it)

  **Acceptance Criteria**:
  - [x] No `hasFetchedSocietes` / `hasFetchedGammes` / `hasFetchedProduits` refs in the file
  - [x] No separate `fetchGammes` / `fetchProduits` useCallbacks
  - [x] No more than 2 useEffects total (1 for société/org change, 1 for societes fetch)
  - [x] `handleGammeSelect` is synchronous (no async, no fetch)
  - [x] `filteredProducts` useMemo filters by `selectedGammeId` for BOTH "all" and specific gamme
  - [x] `loadGammesAndProduits` has zero dependencies on component state (only takes params)
  - [x] `refetch` and `refetchGammes` both call `loadGammesAndProduits`
  - [x] File compiles without errors
  - [x] `make frontend-build && make frontend-up` succeeds
  - [x] Product list render does NOT check any loading state (no spinner, no "Chargement")

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Products visible on page load
    Tool: Playwright
    Steps:
      1. Navigate to http://alex.local/catalogue
      2. Wait for .space-y-2 (product list container) visible (timeout: 10s)
      3. Assert: at least 1 ProductCard visible
      4. Screenshot: .sisyphus/evidence/task-1-page-load.png
    Expected: Products rendered from SSR data

  Scenario: Switch gamme — instant, no flash
    Tool: Playwright
    Steps:
      1. Navigate to http://alex.local/catalogue
      2. Click on a specific gamme in the sidebar (e.g. "conciergerie")
      3. Assert: product list updates immediately (no empty state flash)
      4. Assert: all visible products belong to selected gamme
      5. Click "Toutes les gammes"
      6. Assert: product list shows products from all gammes
      7. Screenshot: .sisyphus/evidence/task-1-gamme-switch.png
    Expected: Instant switch, no network waterfall visible

  Scenario: Switch société then gamme — no stale data
    Tool: Playwright  
    Steps:
      1. Navigate to http://alex.local/catalogue
      2. Select a société from header selector
      3. Wait 2s for data to load
      4. Click on a specific gamme
      5. Assert: products shown belong to that gamme (not all products)
      6. No flash of unrelated products at any point
      7. Screenshot: .sisyphus/evidence/task-1-societe-gamme.png
    Expected: Clean transition, products correctly scoped
  ```

  **Commit**: YES
  - Message: `fix(catalogue): rewrite data fetching logic — single loader, instant gamme switch, no flash`
  - Files: `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx`

---

## Success Criteria

### Final Checklist
- [x] Gamme switching is instant (no network call, pure useMemo)
- [x] "Toutes les gammes" shows all products for the société's gammes
- [x] Switching société reloads gammes + products sequentially, no race condition
- [x] No flash/flicker at any point during navigation
- [x] No loading spinner visible in product list
- [x] Backend is ALWAYS called with a specific gammeId (never undefined)
- [x] `make frontend-build` succeeds
