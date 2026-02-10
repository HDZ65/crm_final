# Architectural Decisions

## [2026-02-09T16:04:20Z] Pre-Planning Decisions

### Scope Boundaries
- **IN**: Header, Accordion, 5 tabs (Overview, Commissions, Contrats, Activités & Tâches, Documents), SSR expansion, new server actions
- **OUT**: Email integration, inline editing, shared abstractions, proto/backend changes, unit tests

### Key Design Decisions
1. **Commissions tab**: Reuse BordereauxList, ReprisesList as-is → minimal new code
2. **Commission sub-sections**: Key 3 only (not all 7) → avoids 800+ lines
3. **Documents source**: Bordereau PDF/Excel exports → no new storage
4. **Activities/Tasks**: Thin server action wrappers → no proto changes
5. **Accordion**: Read-only → simpler V1, inline editing deferred

### Technical Patterns
- Copy + adapt from client-detail, don't abstract
- 2-section accordion (Apporteur entity is thinner than Client)
- Client-side filtering fallback if gRPC doesn't support partenaireId

---

