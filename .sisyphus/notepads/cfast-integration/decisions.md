# CFAST Integration — Decisions

## [2026-02-26] Architecture Decisions

- **Credential storage**: AES-256-GCM (reversible) — NOT bcrypt/hash (need plaintext for OAuth2)
- **EncryptionService**: Copy from service-finance to service-commercial (Option A, not shared-kernel)
- **Cross-service write**: service-commercial orchestrates import, calls service-finance gRPC to create factures
- **Client matching**: nom + prénom + téléphone (normalized)
- **Invoice number**: CFAST invoices stored with numero=NULL, CFAST number in external_id (avoids unique constraint collision)
- **Trigger**: On-demand only (button in UI), no cron/scheduler
- **PDF**: HTTP proxy endpoint (not gRPC) to stream PDF from CFAST
- **Tests**: None automated — agent QA scenarios only
