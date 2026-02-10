# Architectural Decisions - Tâches UX Coherence

## [2026-02-08] Wave 1 Decisions

### Decision 1: ErrorState Component Source
**Context**: Need ErrorState component for error handling on tasks page

**Options Considered**:
1. Create new ErrorState component from scratch
2. Copy from clone/winaity-clean reference implementation

**Decision**: Copy from clone/winaity-clean

**Rationale**:
- Saves development time
- Ensures consistency with reference implementation
- Component already tested and proven
- Uses existing Empty component infrastructure

### Decision 2: Client Link Display Format
**Context**: Need to show client link in task table, but client name resolution requires backend changes

**Options Considered**:
1. Show full client UUID
2. Show truncated UUID (clientId.slice(0,8)...)
3. Add new API endpoint to resolve client names (out of scope)

**Decision**: Show truncated UUID with "..." suffix

**Rationale**:
- Frontend-only solution (no backend changes)
- Keeps scope manageable
- Still provides clickable navigation to client detail
- User can see full client info after clicking

### Decision 3: Client Tasks Tab Position
**Context**: Where to add Tasks tab in client detail page

**Options Considered**:
1. Embed in "Activités" tab
2. Add as separate 6th tab after "Activités"

**Decision**: Separate 6th tab after "Activités"

**Rationale**:
- Maintains logical separation of concerns
- Follows existing pattern (each entity type gets its own tab)
- Easier to maintain and extend
- Better UX - clear navigation

### Decision 4: Navigation Pattern for Configuration
**Context**: How to navigate between tasks page and configuration page

**Options Considered**:
1. Add submenu in sidebar
2. Add icon button on tasks page + back button on config page
3. Use breadcrumbs only

**Decision**: Icon button (Settings2) + back button

**Rationale**:
- Minimal UI changes
- Consistent with existing navigation patterns
- Clear visual affordance (gear icon = settings)
- Bidirectional navigation (both directions covered)

### Decision 5: Delete Confirmation Pattern
**Context**: Replace native confirm() with modern UI

**Options Considered**:
1. Keep native confirm()
2. Use AlertDialog (Shadcn)
3. Use custom modal

**Decision**: Use AlertDialog (Shadcn)

**Rationale**:
- Consistent with existing task deletion pattern
- Better UX (shows item name, clear actions)
- Accessible (ARIA roles)
- Matches design system

## Wave 2 Decisions (Pending)

### Decision 6: Empty State Message Contextualization
**Context**: Empty state should adapt to active filter

**Decision**: Show contextual messages based on filter:
- "Aucune tâche à faire" (filter: à faire)
- "Aucune tâche en cours" (filter: en cours)
- "Aucune tâche terminée" (filter: terminée)
- "Aucune tâche en retard" (filter: en retard)
- "Aucune tâche trouvée" (when search active)

**Rationale**:
- Better UX - user understands why list is empty
- Follows best practices for empty states
- Minimal code complexity

### Decision 7: Skeleton Loading Count
**Context**: How many skeleton rows to show during loading

**Decision**: 3-5 skeleton rows

**Rationale**:
- Enough to indicate content is loading
- Not overwhelming
- Matches typical viewport height
- Follows pattern in client-activites.tsx
