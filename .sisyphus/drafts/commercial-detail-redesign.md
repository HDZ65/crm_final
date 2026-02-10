# Draft: Commercial Detail Page Redesign

## Requirements (confirmed)
- Commercial detail page must match client detail page UI/UX patterns
- User confirmed ALL sections: Header, Accordion, Commissions tab, Clients/Contrats tab, Activités & Tâches tab, Documents tab

## User's Selected Sections
1. ✅ Header with status & actions (like client page)
2. ✅ Infos générales (accordion pattern)
3. ✅ Commissions tab
4. ✅ Clients/Contrats tab
5. ✅ Activités & Tâches tab
6. ✅ Documents tab

## Technical Decisions
- Pattern to follow: client-detail-client.tsx (949 lines)
- Current commercial page: 325 lines, simple 3-card layout
- Need to restructure with Tabs, Accordion, modular sub-components
- Use same styling: gradient cards, sticky sidebar, responsive grid

## Data Model Available (Apporteur)
- Core fields: id, nom, prenom, type_apporteur, email, telephone, societe_id, actif
- Related: commissions, bordereaux, reprises, recurrences, contestations, reports négatifs, barèmes/paliers
- Contract link: contrats have commercial_id field
- RPC methods: CRUD + Activer/Desactiver + GetByUtilisateur

## Related Data Available via gRPC
- GetCommissionsByApporteur - commissions for this commercial
- GetBordereaux - filterable by apporteur
- GetReprisesByCommission - clawbacks
- GetRecurrencesByContrat - recurring commissions
- GetReportsNegatifs - negative balances
- GetContestations - disputes
- Contrat.List filtered by commercial_id
- Audit logs

## Existing Components That Can Be Reused/Adapted
- ClientHeader → CommercialHeader
- ClientInfoAccordion → CommercialInfoAccordion
- ClientTaches → adapt for commercial context
- ClientActivites → adapt for commercial context
- ClientDocuments → adapt for commercial context
- EditableField (inline editing)
- Badge, Card, Tabs, Accordion (shadcn)

## Existing Commission Components (already built)
- commission-detail-dialog.tsx
- bordereaux-list.tsx
- reprises-list.tsx
- recurrences-list.tsx
- reports-negatifs-list.tsx
- contestations-list.tsx
- calculate-commission-dialog.tsx
- baremes-list.tsx

## Metis Gap Analysis Decisions (RESOLVED)
1. Activités & Tâches: CREATE thin wrapper server actions (listActivitesByPartenaire / listTachesByPartenaire)
2. Documents tab: Use bordereau PDF/Excel exports as document source
3. Commission sub-tabs: Key 3 only (Commissions + Bordereaux + Reprises)

## Additional Decisions
- Overview layout: Left = stats cards + recent activity, Right = sticky info accordion
- Commissions tab: Reuse existing components as-is
- Contrats tab: Contracts table filtered by commercial_id
- Accordion: Read-only for V1, no inline editing
- No email integration on commercial page
- No modification of existing commission components

## Scope Boundaries
- INCLUDE: Full page redesign with tabs, accordion, header, all confirmed sections
- INCLUDE: New server actions for activities/tasks by commercial (thin wrappers)
- EXCLUDE: New gRPC proto definitions or backend changes
- EXCLUDE: Modifying existing commission components
- EXCLUDE: Email integration, inline editing, shared abstractions
