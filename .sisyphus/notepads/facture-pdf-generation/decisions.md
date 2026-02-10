# Decisions - Facture PDF Generation

## Task 2 - Backend PDF Services (2026-02-10)

### ClientInfoPdf interface
- **Decision**: Extract client rendering data into a `ClientInfoPdf` interface param instead of requiring entity join
- **Rationale**: FactureEntity has `clientBaseId` but no embedded client info. Client data lives in another service. The PDF service should not depend on client repository — caller provides it.

### Storage path structure
- **Decision**: `uploads/factures/{societe}/{annee}/FAC_{reference}_{timestamp}.pdf`
- **Rationale**: Follows exact bordereau pattern (`uploads/bordereaux/...`), uses timestamp for uniqueness, FAC prefix distinguishes from other document types.

### No Excel export
- **Decision**: Only PDF for factures (unlike bordereau which has PDF+Excel)
- **Rationale**: Invoices are legal documents — PDF-only is standard. Storage service reflects this with single-file output.
