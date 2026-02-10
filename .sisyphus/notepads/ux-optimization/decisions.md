# Architectural Decisions — UX Optimization

## [2026-02-08] Navigation Architecture

### Decision 1: 5-Group Sidebar Structure
**Context**: Original sidebar had 26 flat items causing cognitive overload (violates Hick's Law: >7 items = decision paralysis)

**Decision**: Restructure into 5 collapsible groups with ≤6 items per group

**Rationale**:
- Hick's Law: Decision time increases logarithmically with choices
- Miller's Law: Working memory holds 5±2 chunks
- 5 groups = optimal balance between discoverability and cognitive load

**Groups Chosen**:
1. **CRM** (defaultOpen: true) — Most frequently accessed features
2. **Finance & Ventes** — Financial operations grouped together
3. **Catalogue & Opérations** — Product and logistics management
4. **Paiements** — Payment-specific features isolated
5. **Administration** — Settings and configuration

**Dashboard**: Standalone item (not in a group) — always visible, always accessible

### Decision 2: CRM Group Open by Default
**Context**: Users need quick access to core CRM features (Clients, Commerciaux, Tâches)

**Decision**: `NAV_CRM_GROUP.defaultOpen = true`, all other groups collapsed

**Rationale**:
- Jakob's Law: Users expect CRM features to be immediately visible in a CRM app
- Reduces clicks for most common workflows
- Other groups can be expanded on-demand

### Decision 3: Centralized Navigation Config
**Context**: Navigation items were scattered across 3 arrays in `app-sidebar.tsx`

**Decision**: Create `lib/nav-config.ts` as single source of truth

**Benefits**:
- Easier to maintain (one file to update)
- Enables breadcrumb generation from same config
- Supports future role-based filtering (Phase 4)
- Type-safe with TypeScript interfaces

### Decision 4: Active State Uses `startsWith`
**Context**: Sub-pages (e.g., `/abonnements/plans`) didn't highlight parent item ("Abonnements")

**Decision**: `isActive = pathname === item.url || (item.url !== '/' && pathname.startsWith(item.url + '/'))`

**Rationale**:
- Users need visual feedback on current location
- Parent highlighting improves spatial awareness
- Guard `item.url !== '/'` prevents Dashboard from always being active

### Decision 5: Orphaned Pages Integrated into Groups
**Context**: 5 pages existed but weren't in sidebar navigation

**Decision**: Add as sub-items under relevant parent items

**Mapping**:
- `/taches/configuration` → CRM > Tâches > Configuration
- `/depanssur/dossiers` → Catalogue & Opérations > DepanSur > Dossiers
- `/depanssur/reporting` → Catalogue & Opérations > DepanSur > Reporting
- `/integrations/woocommerce` → Administration > Intégrations > WooCommerce
- `/expeditions/lots` → Catalogue & Opérations > Expéditions > Lots

**Rationale**:
- Improves findability (users can discover these pages via sidebar)
- Maintains logical grouping (sub-items under parent features)
- No URL changes required (preserves existing routes)

### Decision 6: NAV_ROUTE_LABELS for Breadcrumbs
**Context**: Breadcrumbs (Task 6) need to map URL segments to French labels

**Decision**: Export `NAV_ROUTE_LABELS: Record<string, string>` from nav-config.ts

**Benefits**:
- Single source of truth for route labels
- Breadcrumbs auto-generated from pathname parsing
- Consistent labeling across sidebar and breadcrumbs

### Decision 7: No Shadcn UI Modifications
**Context**: Shadcn components are primitives, not meant to be modified

**Decision**: NEVER modify files in `components/ui/` — only compose them

**Rationale**:
- Shadcn updates would overwrite custom changes
- Composition pattern is more maintainable
- Follows Shadcn best practices
