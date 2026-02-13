# Decisions — gamme-societe-association

## [2026-02-12T14:04:02Z] Key Decisions
- 1:N relationship via FK (not N:N junction table)
- Nullable societe_id (gammes can be cross-société)
- Strict filtering (WHERE societe_id = :id, no OR IS NULL)
- Raw UUID, no FK constraint, no @ManyToOne (follows project pattern)
- Proto field numbers: Gamme=14, CreateGammeRequest=7, UpdateGammeRequest=8, ListGammesRequest=4
