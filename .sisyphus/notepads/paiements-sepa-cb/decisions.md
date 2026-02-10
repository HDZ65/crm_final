# Decisions — Paiements SEPA & CB

## 2026-02-07 Initialization
- PSP Priority: Slimpay → MultiSafepay → Emerchantpay
- Scoring: Complete ML (FastAPI/XGBoost, separate Python service)
- Tests: Tests-after (implement first, tests added per block)
- Encryption: AES-256-GCM for IBAN/BIC, TypeORM column transformer
- Archive: J+30 after final status, separate read-only table
