# CFAST Integration — Issues & Gotchas

## [2026-02-26] Known Gotchas

- **FK non-nullable**: facture has 6 non-nullable FKs — migration must relax: client_partenaire_id, adresse_facturation_id, emission_facture_id; also produit_id in ligne_facture
- **Invoice number collision**: `numero` has unique constraint — CFAST invoices must use numero=NULL
- **Phone normalization**: No existing utility — must implement: +33/0033 → 0, strip spaces/dashes
- **Token caching**: In-memory only (not DB), refresh auto if expired (with 60s margin)
- **Client match failure**: If no match → skip facture, log warning, count in result
- **Rate limiting**: No existing utility — simple 500ms delay between HTTP calls
