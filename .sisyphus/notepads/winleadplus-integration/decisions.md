# Decisions: WinLeadPlus Integration

## Purpose
Track architectural choices and design decisions made during implementation.

---

## Initial Decisions (from planning)

### 2026-02-11

**Auth Strategy**: Keycloak Bearer token forwarded from user session. For scheduled sync (no user session), stored API token in WinLeadPlusConfig entity.

**Source Tracking**: New `source` field (field 31) on ClientBase proto. Cleaner than reusing `canal_acquisition`.

**Cross-Service Communication**: service-commercial orchestrates sync, publishes NATS events (`client.create.from-winleadplus`, `client.update.from-winleadplus`) for service-core to create/update clients.

**Update Strategy**: Auto-update — CRM client updated automatically when WinLeadPlus data changes. No conflict resolution UI.

---

