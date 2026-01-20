# Security & Compliance Specification
## CRM Final - Payment-Enabled Multi-Tenant Platform

**Version**: 1.0.0  
**Date**: 19 janvier 2026  
**Classification**: INTERNAL - CONFIDENTIAL  
**Compliance Targets**: DSP2/PSD2 alignment, PCI-DSS best practices, GDPR

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Threat Model](#2-threat-model)
3. [Encryption Specification](#3-encryption-specification)
4. [Authentication & MFA Design](#4-authentication--mfa-design)
5. [RBAC Design](#5-rbac-design)
6. [Audit Logs](#6-audit-logs)
7. [Retention & Purge](#7-retention--purge)
8. [Error Taxonomy](#8-error-taxonomy)
9. [Test Plan](#9-test-plan)
10. [Scenarios](#10-scenarios)
11. [Implementation Roadmap](#11-implementation-roadmap)

---

## 1. Executive Summary

### 1.1 Objectives

This specification defines a security and compliance foundation for the CRM platform that:

- **Protects** sensitive data (PII, payment information, secrets) through encryption at rest and in transit
- **Authenticates** users via SSO/OIDC with mandatory MFA for sensitive operations
- **Authorizes** all actions through explicit, auditable RBAC with no implicit permissions
- **Audits** every sensitive action with tamper-evident, append-only logs
- **Complies** with data retention requirements and enables verifiable purge

### 1.2 Architectural Principles

| Principle | Implementation |
|-----------|----------------|
| **Protobuf = Single Source of Truth** | All security models, policies, errors defined in `.proto` files |
| **Zero Manual Mapping** | snake_case in proto/DB, camelCase in transit via naming strategy |
| **Validation at Boundary** | All inputs validated via buf.validate/protovalidate |
| **No Silent Errors** | Every violation is blocking OR explicitly logged/alerted |
| **Audit Everything Sensitive** | If audit fails, sensitive action fails |

### 1.3 New Platform Services

| Service | Responsibility |
|---------|----------------|
| `audit-service` | Append-only audit log storage, hash-chain integrity, query/export |
| `compliance-service` | Retention policy management, purge orchestration, proof generation |

### 1.4 Shared Security Library

A cross-cutting NestJS library (`@crm/security-kit`) providing:
- JWT validation interceptor
- Tenant scope guard
- RBAC evaluator guard
- Step-up authentication guard
- Audit client (sync for blocking, async for non-blocking)
- Crypto service (envelope encryption, blind indexes)

---

## 2. Threat Model

### 2.1 Actors

| Actor | Description | Goals | Capabilities | Primary Controls |
|-------|-------------|-------|--------------|------------------|
| **End User** | Viewer/Operator/Finance | Access CRM data within scope | Authenticated, role-limited | RBAC + tenant scoping + audit |
| **Org Admin** | Admin role within tenant | Manage users/roles, exports | Elevated privileges | MFA required + step-up + audit |
| **SuperAdmin** | Break-glass emergency access | Incident response, recovery | Highest privilege (time-bound) | Break-glass workflow + heavy audit + alerts |
| **Service Account** | Microservices, schedulers | Automation (billing, jobs) | Client credentials, mTLS | Least-privilege permissions |
| **PSP Systems** | Stripe/PayPal/GoCardless | Webhooks, payment events | Signed callbacks | Signature verification, idempotency |
| **External Attacker** | Internet threat actor | Data exfiltration, fraud | Phishing, injection, SSRF | WAF, rate limits, encryption, audit |
| **Insider Threat** | Compromised/malicious employee | Privilege escalation, tampering | Valid credentials | Separation of duties, immutable audit |

### 2.2 Attack Surfaces

| Surface | Examples | Risk Level | Mitigations |
|---------|----------|------------|-------------|
| **Frontend (Next.js)** | Session storage, XSS vectors | HIGH | HttpOnly cookies, CSP, no localStorage tokens |
| **External API** | Public endpoints, portal | HIGH | Rate limiting, schema validation, WAF |
| **gRPC Inter-service** | 17 microservices | MEDIUM | mTLS, service identities, allowlists |
| **Databases** | PostgreSQL per service | HIGH | Disk encryption + field encryption + limited roles |
| **Secrets** | Env vars, PSP keys | CRITICAL | Secrets manager, rotation, no plaintext logs |
| **Audit Logs** | audit-service DB | HIGH | Append-only, hash chain, restricted access |
| **Payment Webhooks** | PSP callbacks | HIGH | Signature verify + replay detection |

### 2.3 Attack Scenarios

| ID | Scenario | Attack Vector | Impact | Mitigation |
|----|----------|---------------|--------|------------|
| ATK-001 | Privilege Escalation | Alter `organisation_id` in request | Cross-tenant data access | Server-side tenant validation, audit deny |
| ATK-002 | Token Theft | XSS, compromised device | Session hijack | BFF cookies, short TTL, step-up, revocation |
| ATK-003 | Webhook Replay | Replay captured webhook | Duplicate transactions | Event ID dedup, timestamp validation |
| ATK-004 | Audit Tampering | DB admin or compromised service | Cover tracks | Append-only triggers, hash chain, checkpoints |
| ATK-005 | Data Exfiltration | Export endpoint abuse | Mass data leak | Export permission + step-up + watermark + rate limit |
| ATK-006 | Secret Theft | PSP key extraction | Financial fraud | Secrets manager, no DB storage, rotation |
| ATK-007 | Lateral Movement | Service compromise | Multi-service breach | mTLS, service identity allowlists |
| ATK-008 | Admin Compromise | Credential theft | Full tenant access | MFA mandatory, step-up, break-glass separation |

### 2.4 Threat Model Diagram

```
                                    [External Attacker]
                                           |
                                    [WAF/Rate Limit]
                                           |
[Browser] --(OIDC PKCE)--> [Keycloak IdP]  |
    |                           |          |
    | (HttpOnly session)        | (JWT)    |
    v                           v          v
[Next.js BFF] ----mTLS gRPC----> [API Gateway] ----mTLS----> [17 NestJS Services]
                                      |                              |
                                      |                    [Postgres per service]
                                      |                              |
                            [audit-service] <---audit write-----------+
                            (append-only)                             |
                                      |                    [compliance-service]
                            [Hash Chain]                   (retention/purge)
                                      |
[PSPs] --(signed webhooks)--> [payment-service] ---audit---> [audit-service]
```

---

## 3. Encryption Specification

### 3.1 Encryption in Transit

| Channel | Protocol | Configuration |
|---------|----------|---------------|
| External (browser → BFF) | TLS 1.3 | HSTS enabled, modern ciphers only |
| BFF → Keycloak | TLS 1.2+ | Certificate validation |
| Inter-service gRPC | **mTLS** | Per-service certificates, mutual auth |
| Service → PostgreSQL | TLS | `sslmode=require` minimum |

**mTLS Implementation**:
- Each service has a unique X.509 certificate
- Certificates issued by internal CA (or Vault PKI)
- Service identity validated at transport layer
- Allowlist which services can call which RPCs

### 3.2 Encryption at Rest

#### 3.2.1 Volume Encryption (Baseline)
- All PostgreSQL volumes: AES-256 disk encryption
- All backup snapshots: encrypted at rest
- Protects against: lost disks, stolen snapshots

#### 3.2.2 Application-Level Field Encryption (Sensitive Data)

| Classification | Fields | Encryption Required | Blind Index |
|----------------|--------|---------------------|-------------|
| **PII** | name, email, phone, address, IP | YES (AES-256-GCM) | email, phone |
| **Payment** | IBAN, mandate_ref, payer identifiers | YES | iban, mandate_ref |
| **Secrets** | break-glass reason, tokens | YES | NO |
| **Financial** | amounts, dates | NO (audited) | N/A |
| **Identifiers** | UUIDs, PSP IDs | NO | N/A |

### 3.3 Sensitive Data Classification

```protobuf
enum DataClassification {
  DATA_CLASSIFICATION_UNSPECIFIED = 0;
  DATA_CLASSIFICATION_PUBLIC = 1;      // No restrictions
  DATA_CLASSIFICATION_INTERNAL = 2;    // Internal only, no encryption required
  DATA_CLASSIFICATION_PII = 3;         // Personal data, encryption required
  DATA_CLASSIFICATION_PAYMENT = 4;     // Payment-related, encryption + audit
  DATA_CLASSIFICATION_SECRET = 5;      // Secrets, never log, always encrypt
}
```

### 3.4 KMS Design (Envelope Encryption)

```
┌─────────────────────────────────────────────────────────────────┐
│                         KMS (Vault/Cloud KMS)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ KEK: pii_dev │  │ KEK: pii_prod│  │ KEK: payment │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
│         ▼                  ▼                  ▼                  │
│   [Encrypt DEK]      [Encrypt DEK]     [Encrypt DEK]            │
└─────────────────────────────────────────────────────────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Services                          │
│  DEK_v1 (cached) ──> AES-256-GCM encrypt(plaintext)             │
│  Store: { key_version, nonce, ciphertext, aad }                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Hierarchy**:
| Key Type | Scope | Rotation | Access |
|----------|-------|----------|--------|
| KEK (Key Encryption Key) | Per environment + domain | Annual | KMS only |
| DEK (Data Encryption Key) | Per service | Quarterly | Service runtime |
| Signing Key | Audit integrity | Annual | audit-service only |

**Rotation Process**:
1. Generate new DEK version
2. Encrypt new DEK with KEK
3. Store encrypted DEK in service config
4. Background job re-encrypts existing data with new DEK version
5. Support multiple DEK versions for decryption during migration

### 3.5 Searchable Encryption (Blind Indexes)

For fields requiring exact-match search while encrypted:

```sql
-- Example: encrypted email with blind index
CREATE TABLE client_base (
  id UUID PRIMARY KEY,
  -- Encrypted field
  email_ciphertext BYTEA NOT NULL,
  email_key_version INT NOT NULL,
  email_nonce BYTEA NOT NULL,
  -- Blind index for search
  email_bi BYTEA NOT NULL,  -- HMAC-SHA256(search_key, lowercase(email))
  -- Display helper (optional)
  email_masked VARCHAR(100),  -- "j***@example.com"
  
  CONSTRAINT uk_email_bi UNIQUE (email_bi)
);

-- Search by email (exact match)
SELECT * FROM client_base WHERE email_bi = $1;
-- Then decrypt email_ciphertext in application
```

**Blind Index Generation**:
```typescript
function generateBlindIndex(value: string, indexKey: Buffer): Buffer {
  const canonical = value.toLowerCase().trim();
  return crypto.createHmac('sha256', indexKey).update(canonical).digest();
}
```

---

## 4. Authentication & MFA Design

### 4.1 OIDC Flow (Authorization Code + PKCE)

```
┌─────────┐                  ┌──────────────┐                ┌──────────┐
│ Browser │                  │  Next.js BFF │                │ Keycloak │
└────┬────┘                  └──────┬───────┘                └────┬─────┘
     │  1. GET /login               │                              │
     │─────────────────────────────>│                              │
     │                              │  2. Generate PKCE            │
     │                              │     code_verifier            │
     │                              │     code_challenge           │
     │                              │                              │
     │  3. Redirect to /authorize   │                              │
     │<─────────────────────────────│                              │
     │                              │                              │
     │  4. /authorize (code_challenge, state)                      │
     │─────────────────────────────────────────────────────────────>
     │                              │                              │
     │  5. Login UI (+ MFA if required)                            │
     │<─────────────────────────────────────────────────────────────
     │                              │                              │
     │  6. Redirect with code       │                              │
     │─────────────────────────────>│                              │
     │                              │  7. POST /token              │
     │                              │     (code, code_verifier)    │
     │                              │─────────────────────────────>│
     │                              │                              │
     │                              │  8. access_token,            │
     │                              │     refresh_token            │
     │                              │<─────────────────────────────│
     │                              │                              │
     │  9. Set HttpOnly cookies     │                              │
     │<─────────────────────────────│                              │
     │                              │                              │
     │  10. Authenticated app       │                              │
     │<─────────────────────────────│                              │
```

### 4.2 Token Configuration

| Token | TTL | Storage | Rotation |
|-------|-----|---------|----------|
| Access Token | 5 minutes | HttpOnly cookie | On refresh |
| Refresh Token | 8 hours (active) / 24h (idle) | HttpOnly cookie | Rotating (reuse detection) |
| ID Token | 5 minutes | Not stored client-side | N/A |

**Critical Settings**:
- `refresh_token_reuse_detection`: ENABLED (revoke session on reuse)
- `offline_access`: DISABLED (no long-lived tokens)
- `pkce`: REQUIRED for all public clients

### 4.3 Session Management

```protobuf
message AuthSession {
  string session_id = 1;           // Keycloak session ID (sid)
  string user_id = 2;
  string keycloak_sub = 3;
  string organisation_id = 4;
  string ip_hash = 5;              // SHA256(IP) for anomaly detection
  string user_agent_hash = 6;      // SHA256(UA) for anomaly detection
  google.protobuf.Timestamp created_at = 7;
  google.protobuf.Timestamp last_activity_at = 8;
  google.protobuf.Timestamp mfa_verified_at = 9;
  SessionStatus status = 10;
}

enum SessionStatus {
  SESSION_STATUS_UNSPECIFIED = 0;
  SESSION_STATUS_ACTIVE = 1;
  SESSION_STATUS_REVOKED = 2;
  SESSION_STATUS_EXPIRED = 3;
}
```

**Session Revocation**:
- On logout: Add `sid` to Redis revocation cache (TTL = token expiry)
- On breach: Admin-triggered revocation via Keycloak admin API
- Services check revocation cache for sensitive RPCs

### 4.4 MFA Requirements Matrix

| Action Category | MFA Required | Step-Up Window |
|-----------------|--------------|----------------|
| Read-only access | NO | N/A |
| Standard CRUD | NO | N/A |
| **Admin actions** | YES | 15 minutes |
| **Export sensitive data** | YES | 10 minutes |
| **Payment execution** | YES | 10 minutes |
| **Refund/cancellation** | YES | 5 minutes |
| **Config changes (routing, calendar, PSP)** | YES | 10 minutes |
| **Role/permission changes** | YES | 5 minutes |
| **Break-glass activation** | YES | Immediate |

### 4.5 Step-Up Authentication Flow

```
┌─────────┐          ┌──────────────┐          ┌──────────┐          ┌─────────┐
│ Browser │          │  Next.js BFF │          │ Service  │          │Keycloak │
└────┬────┘          └──────┬───────┘          └────┬─────┘          └────┬────┘
     │  1. Sensitive action       │                  │                     │
     │───────────────────────────>│                  │                     │
     │                            │  2. gRPC call    │                     │
     │                            │─────────────────>│                     │
     │                            │                  │                     │
     │                            │  3. Check mfa_verified_at              │
     │                            │     (stale or missing)                 │
     │                            │                  │                     │
     │                            │  4. MFA_STEP_UP_REQUIRED               │
     │                            │<─────────────────│                     │
     │                            │                  │                     │
     │  5. Redirect: step-up needed                  │                     │
     │<───────────────────────────│                  │                     │
     │                            │                  │                     │
     │  6. /authorize (prompt=login, max_age=0, acr_values=mfa)           │
     │────────────────────────────────────────────────────────────────────>│
     │                            │                  │                     │
     │  7. MFA challenge (OTP/WebAuthn)                                    │
     │<────────────────────────────────────────────────────────────────────│
     │                            │                  │                     │
     │  8. Complete MFA           │                  │                     │
     │────────────────────────────────────────────────────────────────────>│
     │                            │                  │                     │
     │  9. Redirect with code (amr includes "mfa")                         │
     │<───────────────────────────│                  │                     │
     │                            │                  │                     │
     │  10. Retry sensitive action│                  │                     │
     │───────────────────────────>│                  │                     │
     │                            │  11. gRPC (fresh mfa_verified_at)      │
     │                            │─────────────────>│                     │
     │                            │                  │  12. SUCCESS        │
     │                            │<─────────────────│                     │
```

---

## 5. RBAC Design

### 5.1 Permission Model

**Format**: `resource:action[:sub_resource]`

```protobuf
// Permission structure
message Permission {
  string id = 1;
  string code = 2;           // e.g., "payment:refund:create"
  string resource = 3;       // e.g., "payment"
  string action = 4;         // e.g., "create"
  string sub_resource = 5;   // e.g., "refund" (optional)
  string description = 6;
  DataClassification data_classification = 7;
  bool requires_mfa = 8;
  bool audit_blocking = 9;
}
```

### 5.2 Core Permissions Catalog

| Resource | Permission Code | Description | MFA | Audit Blocking |
|----------|-----------------|-------------|-----|----------------|
| **user** | `user:read` | View user profiles | NO | NO |
| **user** | `user:create` | Create users | YES | YES |
| **user** | `user:update` | Update user data | NO | YES |
| **user** | `user:delete` | Delete users | YES | YES |
| **role** | `role:read` | View roles | NO | NO |
| **role** | `role:assign` | Assign roles to users | YES | YES |
| **role** | `role:manage` | Create/update/delete roles | YES | YES |
| **payment** | `payment:read` | View payments | NO | NO |
| **payment** | `payment:create` | Create payment intents | NO | YES |
| **payment** | `payment:refund:create` | Create refunds | YES | YES |
| **payment** | `payment:cancel` | Cancel payments | YES | YES |
| **mandate** | `mandate:read` | View mandates | NO | NO |
| **mandate** | `mandate:create` | Create mandates | NO | YES |
| **mandate** | `mandate:cancel` | Cancel mandates | YES | YES |
| **export** | `export:sensitive` | Export sensitive data | YES | YES |
| **export** | `export:audit` | Export audit logs | YES | YES |
| **config** | `config:routing` | Modify payment routing | YES | YES |
| **config** | `config:calendar` | Modify calendars | YES | YES |
| **config** | `config:psp` | Modify PSP settings | YES | YES |
| **audit** | `audit:read` | View audit logs | NO | NO |
| **audit** | `audit:export` | Export audit logs | YES | YES |
| **breakglass** | `breakglass:activate` | Activate break-glass | YES | YES |
| **breakglass** | `breakglass:deactivate` | Deactivate break-glass | YES | YES |

### 5.3 Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ROLE HIERARCHY                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SuperAdmin (Break-Glass)                                               │
│  └── ALL permissions (time-bound, emergency only)                       │
│                                                                          │
│  Admin                                                                   │
│  ├── All Operator permissions                                           │
│  ├── user:create, user:update, user:delete                             │
│  ├── role:read, role:assign                                             │
│  ├── export:sensitive, export:audit                                     │
│  ├── config:routing, config:calendar, config:psp                        │
│  └── audit:read, audit:export                                           │
│                                                                          │
│  Finance                                                                 │
│  ├── All Operator permissions                                           │
│  ├── payment:refund:create, payment:cancel                             │
│  ├── mandate:cancel                                                      │
│  └── export:sensitive (financial only)                                  │
│                                                                          │
│  Operator                                                                │
│  ├── All Viewer permissions                                             │
│  ├── client:create, client:update                                       │
│  ├── contrat:create, contrat:update                                     │
│  ├── payment:create                                                      │
│  └── mandate:create                                                      │
│                                                                          │
│  Viewer                                                                  │
│  ├── user:read (self only)                                              │
│  ├── client:read, contrat:read                                          │
│  ├── payment:read, mandate:read                                          │
│  └── facture:read                                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Role-Permission Matrix

| Permission | Viewer | Operator | Finance | Admin | SuperAdmin |
|------------|--------|----------|---------|-------|------------|
| `user:read` | SELF | SELF | SELF | ALL | ALL |
| `user:create` | - | - | - | YES | YES |
| `user:update` | SELF | SELF | SELF | ALL | ALL |
| `user:delete` | - | - | - | YES | YES |
| `role:read` | - | - | - | YES | YES |
| `role:assign` | - | - | - | YES | YES |
| `role:manage` | - | - | - | - | YES |
| `client:read` | YES | YES | YES | YES | YES |
| `client:create` | - | YES | YES | YES | YES |
| `client:update` | - | YES | YES | YES | YES |
| `payment:read` | YES | YES | YES | YES | YES |
| `payment:create` | - | YES | YES | YES | YES |
| `payment:refund:create` | - | - | YES | YES | YES |
| `payment:cancel` | - | - | YES | YES | YES |
| `export:sensitive` | - | - | FINANCIAL | ALL | ALL |
| `export:audit` | - | - | - | YES | YES |
| `config:*` | - | - | - | YES | YES |
| `audit:read` | - | - | - | YES | YES |
| `breakglass:activate` | - | - | - | - | YES |

### 5.5 Tenant Scoping

Every access decision includes tenant context:

```protobuf
message AccessContext {
  string user_id = 1;
  string keycloak_sub = 2;
  string organisation_id = 3;        // Required for tenant-scoped requests
  repeated string roles = 4;
  repeated string permissions = 5;   // Effective (computed from roles)
  string breakglass_session_id = 6;  // If active
  google.protobuf.Timestamp mfa_verified_at = 7;
}
```

**Enforcement Rules**:
1. `organisation_id` in request MUST match actor's membership
2. Actor MUST have `etat=ACTIVE` in `membre_compte` for that org
3. Mismatch → `TENANT_SCOPE_VIOLATION` error + audit deny

### 5.6 Break-Glass Protocol

```
┌────────────────────────────────────────────────────────────────────────┐
│                       BREAK-GLASS WORKFLOW                             │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. ACTIVATION (SuperAdmin only)                                       │
│     ├── Requires: MFA step-up (immediate)                              │
│     ├── Input: reason (encrypted), ticket_ref, ttl_seconds (max 3600)  │
│     ├── Creates: BreakglassSession with ACTIVE status                  │
│     ├── Audit: breakglass.activate (BLOCKING)                          │
│     └── Alert: Security team notified immediately                      │
│                                                                         │
│  2. ACTIVE SESSION                                                      │
│     ├── All RPCs executed include breakglass_session_id in audit       │
│     ├── Extended permissions granted temporarily                        │
│     └── Continuous monitoring: alert on unusual patterns               │
│                                                                         │
│  3. DEACTIVATION                                                        │
│     ├── Manual: ended_by + reason required                             │
│     ├── Automatic: expires_at reached                                   │
│     ├── Audit: breakglass.deactivate OR breakglass.expire              │
│     └── Alert: Session ended notification                              │
│                                                                         │
│  4. POST-INCIDENT                                                       │
│     ├── Mandatory review of all actions during session                 │
│     └── Export audit trail for incident report                         │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.7 Proto-Enforced Permissions

Every RPC declares its security requirements:

```protobuf
import "security/options.proto";

service PaymentService {
  rpc CreateRefund(CreateRefundRequest) returns (RefundResponse) {
    option (security.required_permission) = {
      permission: "payment:refund:create"
      tenant_scoped: true
      mfa_step_up_required: true
      audit_blocking: true
      audit_action: "payment.refund.create"
      data_classification: "PAYMENT"
    };
  }
}
```

---

## 6. Audit Logs

### 6.1 What to Log

| Category | Events | Audit Blocking |
|----------|--------|----------------|
| **Authentication** | login_success, login_failure, logout, token_refresh, session_revoke | NO |
| **Authorization** | access_denied, permission_check_failed, tenant_scope_violation | NO (deny is logged) |
| **MFA** | mfa_challenge_sent, mfa_verified, mfa_failed, step_up_required | NO |
| **Data Access** | sensitive_field_viewed, export_requested, export_completed | YES (for exports) |
| **Configuration** | routing_changed, calendar_updated, psp_config_changed | YES |
| **Payment** | payment_created, refund_created, payment_cancelled, mandate_created | YES |
| **Break-Glass** | breakglass_activated, breakglass_deactivated, breakglass_expired | YES |
| **Retention** | purge_requested, purge_completed, purge_partial, purge_failed | YES |
| **System** | audit_write_failed (this is a security incident) | N/A |

### 6.2 Audit Entry Schema

```protobuf
message AuditLogEntry {
  // Identity
  string id = 1;                               // UUID
  google.protobuf.Timestamp occurred_at = 2;
  
  // Correlation
  string request_id = 3;                       // Trace ID
  string correlation_id = 4;                   // Business correlation
  
  // Actor
  AuditActor actor = 5;
  
  // Action
  string action = 6;                           // e.g., "payment.refund.create"
  string permission = 7;                       // Permission evaluated
  AuditResult result = 8;                      // ALLOWED, DENIED, FAILED
  
  // Target
  AuditTarget target = 9;
  
  // Change tracking
  string before_json = 10;                     // Encrypted if sensitive
  string after_json = 11;                      // Encrypted if sensitive
  
  // Integrity (hash chain)
  string prev_hash = 12;                       // SHA256 hex
  string entry_hash = 13;                      // SHA256 hex
  
  // Metadata
  map<string, string> meta = 14;               // ip_hash, ua_hash, etc.
}

message AuditActor {
  ActorType actor_type = 1;                    // USER, SERVICE, SYSTEM, WEBHOOK
  string user_id = 2;
  string keycloak_sub = 3;
  string service_name = 4;
  string organisation_id = 5;
  string breakglass_session_id = 6;
}

message AuditTarget {
  string target_type = 1;                      // "payment_intent", "user", etc.
  string target_id = 2;
  map<string, string> target_meta = 3;
}

enum AuditResult {
  AUDIT_RESULT_UNSPECIFIED = 0;
  AUDIT_RESULT_ALLOWED = 1;
  AUDIT_RESULT_DENIED = 2;
  AUDIT_RESULT_FAILED = 3;
}

enum ActorType {
  ACTOR_TYPE_UNSPECIFIED = 0;
  ACTOR_TYPE_USER = 1;
  ACTOR_TYPE_SERVICE = 2;
  ACTOR_TYPE_SYSTEM = 3;
  ACTOR_TYPE_WEBHOOK = 4;
}
```

### 6.3 Hash Chain Integrity

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        HASH CHAIN STRUCTURE                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Entry 0 (Genesis)                                                       │
│  ├── prev_hash: "0000...0000" (genesis marker)                          │
│  ├── entry_hash: SHA256(prev_hash || canonical(entry))                  │
│  └── = "a1b2c3..."                                                      │
│         │                                                                │
│         ▼                                                                │
│  Entry 1                                                                 │
│  ├── prev_hash: "a1b2c3..." (from Entry 0)                             │
│  ├── entry_hash: SHA256(prev_hash || canonical(entry))                  │
│  └── = "d4e5f6..."                                                      │
│         │                                                                │
│         ▼                                                                │
│  Entry 2                                                                 │
│  ├── prev_hash: "d4e5f6..." (from Entry 1)                             │
│  └── ...                                                                 │
│                                                                          │
│  Checkpoint (every N entries or daily)                                   │
│  ├── checkpoint_hash: current chain head                                 │
│  └── signature: KMS-signed for external verification                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Canonical Serialization**:
```typescript
function canonicalJson(entry: AuditLogEntry): string {
  const ordered = {
    id: entry.id,
    occurredAt: entry.occurredAt.toISOString(),
    requestId: entry.requestId,
    // ... all fields in fixed order
  };
  return JSON.stringify(ordered);
}

function computeEntryHash(prevHash: string, entry: AuditLogEntry): string {
  const canonical = canonicalJson(entry);
  return crypto.createHash('sha256')
    .update(prevHash)
    .update(canonical)
    .digest('hex');
}
```

### 6.4 Append-Only Enforcement

**Database Triggers** (PostgreSQL):
```sql
-- Prevent UPDATE
CREATE OR REPLACE FUNCTION prevent_audit_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'UPDATE not allowed on audit_log_entry table';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_audit_update
BEFORE UPDATE ON audit_log_entry
FOR EACH ROW EXECUTE FUNCTION prevent_audit_update();

-- Prevent DELETE
CREATE OR REPLACE FUNCTION prevent_audit_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'DELETE not allowed on audit_log_entry table';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_audit_delete
BEFORE DELETE ON audit_log_entry
FOR EACH ROW EXECUTE FUNCTION prevent_audit_delete();
```

**Database Role Permissions**:
```sql
-- audit_writer role: INSERT + SELECT only
GRANT INSERT, SELECT ON audit_log_entry TO audit_writer;
REVOKE UPDATE, DELETE ON audit_log_entry FROM audit_writer;

-- audit_reader role: SELECT only
GRANT SELECT ON audit_log_entry TO audit_reader;
```

### 6.5 Query & Export API

```protobuf
service AuditQueryService {
  // Query audit entries with filters
  rpc List(ListAuditRequest) returns (ListAuditResponse) {
    option (security.required_permission) = {
      permission: "audit:read"
      tenant_scoped: true
      mfa_step_up_required: false
      audit_blocking: false
      audit_action: "audit.list"
    };
  }
  
  // Export audit entries (controlled, watermarked)
  rpc Export(ExportAuditRequest) returns (stream ExportAuditChunk) {
    option (security.required_permission) = {
      permission: "audit:export"
      tenant_scoped: true
      mfa_step_up_required: true
      audit_blocking: true
      audit_action: "audit.export"
    };
  }
  
  // Verify chain integrity
  rpc VerifyChain(VerifyChainRequest) returns (VerifyChainResponse);
}

message ListAuditRequest {
  string organisation_id = 1;
  google.protobuf.Timestamp from = 2;
  google.protobuf.Timestamp to = 3;
  repeated string actions = 4;           // Filter by action
  repeated string actor_user_ids = 5;    // Filter by actor
  string target_type = 6;
  string target_id = 7;
  Pagination pagination = 8;
}

message ExportAuditRequest {
  string organisation_id = 1;
  google.protobuf.Timestamp from = 2;
  google.protobuf.Timestamp to = 3;
  ExportFormat format = 4;               // CSV, JSON, PARQUET
  bool include_chain_proof = 5;          // Include hash verification data
}

message ExportAuditChunk {
  bytes data = 1;
  string watermark_id = 2;               // Tracks who exported
}
```

---

## 7. Retention & Purge

### 7.1 Retention Categories

| Category | Retention Period | Justification | Purge Mode |
|----------|------------------|---------------|------------|
| `PAYMENT_RECORDS` | 10 years | French commercial law, tax | ARCHIVE |
| `AUDIT_LOGS` | 7 years | Compliance, legal | ARCHIVE |
| `CONTRACT_DATA` | 10 years after end | Legal retention | ARCHIVE |
| `INVOICE_DATA` | 10 years | Tax requirements | ARCHIVE |
| `TECHNICAL_LOGS` | 90 days | Operational | DELETE |
| `SESSION_DATA` | 30 days after expiry | No legal requirement | DELETE |
| `NOTIFICATION_INBOX` | 1 year | UX, no legal | DELETE |
| `WEBHOOK_EVENTS` | 90 days | Debugging | DELETE |
| `PII_DEFAULT` | Account lifetime + 30 days | GDPR minimization | ANONYMIZE |
| `INVITATION_TOKENS` | 90 days after expiry | No retention need | DELETE |

### 7.2 Retention Policy Schema

```protobuf
message RetentionPolicy {
  string id = 1;
  string category = 2;                    // PAYMENT_RECORDS, AUDIT_LOGS, etc.
  string service_name = 3;                // Which service owns this data
  string entity_name = 4;                 // Table/entity name
  int32 retention_days = 5;
  PurgeMode purge_mode = 6;
  string legal_basis = 7;                 // Justification
  google.protobuf.Timestamp updated_at = 8;
  string updated_by_user_id = 9;
}

enum PurgeMode {
  PURGE_MODE_UNSPECIFIED = 0;
  PURGE_MODE_DELETE = 1;                  // Hard delete
  PURGE_MODE_ANONYMIZE = 2;               // Remove PII, keep structure
  PURGE_MODE_ARCHIVE = 3;                 // Move to cold storage
}
```

### 7.3 Scheduled Purge Jobs

```
┌────────────────────────────────────────────────────────────────────────┐
│                     SCHEDULED PURGE WORKFLOW                            │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Daily at 02:00 UTC:                                                    │
│                                                                         │
│  1. compliance-service fetches all RetentionPolicy records              │
│                                                                         │
│  2. For each policy:                                                    │
│     ├── Calculate cutoff_date = now() - retention_days                 │
│     ├── DRY RUN: count affected records                                │
│     └── Log planned purge scope                                         │
│                                                                         │
│  3. Execute purge (if not dry-run):                                     │
│     ├── DELETE: Remove rows where retention_date < cutoff              │
│     ├── ANONYMIZE: SET pii_fields = NULL/hash WHERE ...                │
│     └── ARCHIVE: Move to archive tables/storage                         │
│                                                                         │
│  4. Record PurgeExecution:                                              │
│     ├── deleted_count, anonymized_count, retained_count                │
│     └── Store in purge_execution table                                  │
│                                                                         │
│  5. Emit metrics:                                                       │
│     ├── purge_deleted_rows_total{service, entity, category}            │
│     └── purge_execution_duration_seconds{service}                       │
│                                                                         │
│  6. Verification query:                                                 │
│     └── Confirm no rows exist past retention (sample check)            │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### 7.4 On-Demand GDPR Purge

```protobuf
message PurgeRequest {
  string id = 1;
  string organisation_id = 2;
  string requested_by_user_id = 3;
  SubjectType subject_type = 4;           // USER, CUSTOMER
  string subject_id = 5;
  string reason = 6;                       // GDPR request reference
  string legal_basis = 7;
  bool legal_hold = 8;                     // If true, partial purge only
  PurgeRequestStatus status = 9;
  google.protobuf.Timestamp created_at = 10;
  google.protobuf.Timestamp completed_at = 11;
}

enum SubjectType {
  SUBJECT_TYPE_UNSPECIFIED = 0;
  SUBJECT_TYPE_USER = 1;
  SUBJECT_TYPE_CUSTOMER = 2;
}

enum PurgeRequestStatus {
  PURGE_REQUEST_STATUS_UNSPECIFIED = 0;
  PURGE_REQUEST_STATUS_PENDING = 1;
  PURGE_REQUEST_STATUS_RUNNING = 2;
  PURGE_REQUEST_STATUS_COMPLETED = 3;
  PURGE_REQUEST_STATUS_PARTIAL = 4;        // Some data retained (legal hold)
  PURGE_REQUEST_STATUS_REJECTED = 5;
  PURGE_REQUEST_STATUS_FAILED = 6;
}
```

**Legal Hold Handling**:
```
┌────────────────────────────────────────────────────────────────────────┐
│                     GDPR PURGE WITH LEGAL HOLD                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Scenario: Customer requests deletion but has invoices < 10 years      │
│                                                                         │
│  1. PurgeRequest created with legal_hold = true                        │
│                                                                         │
│  2. For each service:                                                   │
│     ├── clients-service: ANONYMIZE (remove PII, keep structure)        │
│     ├── contrats-service: ANONYMIZE                                    │
│     ├── factures-service: RETAIN (legal requirement)                   │
│     │   └── Note: anonymize customer name, keep amounts/dates          │
│     ├── payments-service: RETAIN (financial records)                   │
│     └── audit-service: RETAIN (compliance requirement)                 │
│                                                                         │
│  3. Status = PARTIAL                                                    │
│     └── Detailed breakdown in PurgeExecution records                   │
│                                                                         │
│  4. Notify requester:                                                   │
│     └── "PII removed. Financial records retained per legal obligation" │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### 7.5 Proof of Purge

```protobuf
message PurgeExecution {
  string id = 1;
  string purge_request_id = 2;
  string service_name = 3;
  string entity_name = 4;
  PurgeExecutionStatus status = 5;
  int64 deleted_count = 6;
  int64 anonymized_count = 7;
  int64 retained_count = 8;
  string retained_reason = 9;              // If any retained
  google.protobuf.Timestamp executed_at = 10;
  
  // Verification
  string verification_query = 11;          // SQL to verify purge
  bool verification_passed = 12;
}
```

**Metrics**:
- `purge_requests_total{status, subject_type}`
- `purge_execution_duration_seconds{service}`
- `purge_deleted_rows_total{service, entity, category}`
- `purge_retained_rows_total{service, entity, reason}`
- `purge_verification_passed_total{service}`
- `purge_verification_failed_total{service}` (ALERT if > 0)

---

## 8. Error Taxonomy

### 8.1 Security Error Codes

```protobuf
enum SecurityErrorCode {
  SECURITY_ERROR_CODE_UNSPECIFIED = 0;
  
  // Authentication (100-199)
  UNAUTHORIZED = 100;                      // No valid credentials
  SESSION_EXPIRED = 101;                   // Token expired
  SESSION_REVOKED = 102;                   // Session explicitly revoked
  SSO_ASSERTION_INVALID = 103;             // OIDC/SAML assertion invalid
  TOKEN_REFRESH_FAILED = 104;              // Refresh token invalid/reused
  
  // Authorization (200-299)
  FORBIDDEN = 200;                         // Generic forbidden
  PERMISSION_MISSING = 201;                // Specific permission not granted
  TENANT_SCOPE_VIOLATION = 202;            // Wrong organisation_id
  ROLE_INSUFFICIENT = 203;                 // Role doesn't have permission
  
  // MFA / Step-up (300-399)
  MFA_REQUIRED = 300;                      // MFA not configured
  MFA_STEP_UP_REQUIRED = 301;              // MFA verification stale
  MFA_CHALLENGE_FAILED = 302;              // Wrong OTP/WebAuthn
  
  // Audit (400-499)
  AUDIT_WRITE_FAILED = 400;                // BLOCKING: action cannot proceed
  AUDIT_SERVICE_UNAVAILABLE = 401;         // audit-service down
  
  // Retention / Purge (500-599)
  RETENTION_POLICY_INVALID = 500;          // Bad policy configuration
  PURGE_NOT_ALLOWED = 501;                 // Legal hold or other block
  PURGE_IN_PROGRESS = 502;                 // Duplicate request
  
  // Encryption (600-699)
  DECRYPTION_FAILED = 600;                 // Key version mismatch or corrupt
  KEY_NOT_FOUND = 601;                     // KMS key unavailable
  
  // Break-glass (700-799)
  BREAKGLASS_REQUIRED = 700;               // Action requires break-glass
  BREAKGLASS_EXPIRED = 701;                // Session no longer valid
  BREAKGLASS_NOT_ACTIVE = 702;             // No active session
}
```

### 8.2 Error Response Structure

```protobuf
message SecurityError {
  SecurityErrorCode code = 1;
  string message = 2;                      // Safe for UI display
  string request_id = 3;                   // For log correlation
  map<string, string> details = 4;         // Non-sensitive context
  
  // For step-up flows
  string step_up_url = 5;                  // Redirect URL for MFA
  int32 step_up_ttl_seconds = 6;           // How long step-up is valid
}
```

### 8.3 Error Handling Rules

| Error Code | HTTP Equivalent | User Action | Audit |
|------------|-----------------|-------------|-------|
| `UNAUTHORIZED` | 401 | Redirect to login | YES (failure) |
| `SESSION_EXPIRED` | 401 | Refresh or re-login | YES |
| `FORBIDDEN` | 403 | Contact admin | YES (deny) |
| `PERMISSION_MISSING` | 403 | Request access | YES (deny) |
| `TENANT_SCOPE_VIOLATION` | 403 | N/A (attack) | YES (deny + alert) |
| `MFA_STEP_UP_REQUIRED` | 403 + body | Complete MFA | YES |
| `AUDIT_WRITE_FAILED` | 503 | Retry later | YES (incident) |
| `PURGE_NOT_ALLOWED` | 409 | Review legal hold | YES |

### 8.4 Critical Error Handling

**AUDIT_WRITE_FAILED** is a **blocking error** for sensitive operations:

```typescript
async function executeWithAudit(
  action: () => Promise<T>,
  auditEntry: AuditLogEntry,
  isBlocking: boolean
): Promise<T> {
  try {
    const auditResult = await auditClient.write(auditEntry);
    if (!auditResult.success && isBlocking) {
      throw new SecurityException(
        SecurityErrorCode.AUDIT_WRITE_FAILED,
        'Unable to record audit. Sensitive action blocked.'
      );
    }
  } catch (error) {
    if (isBlocking) {
      // Alert security team
      await alertService.sendSecurityAlert('AUDIT_WRITE_FAILED', { auditEntry, error });
      throw new SecurityException(
        SecurityErrorCode.AUDIT_WRITE_FAILED,
        'Audit service unavailable. Sensitive action blocked.'
      );
    }
    // Non-blocking: log locally and continue
    logger.error('Audit write failed (non-blocking)', { auditEntry, error });
  }
  
  return action();
}
```

---

## 9. Test Plan

### 9.1 Unit Tests

#### 9.1.1 RBAC Evaluator
```typescript
describe('RbacEvaluator', () => {
  // Permission resolution
  it('should resolve permissions from role', () => {});
  it('should combine permissions from multiple roles', () => {});
  it('should not grant permissions not in role', () => {});
  
  // Tenant scoping
  it('should allow access when organisation_id matches membership', () => {});
  it('should deny access when organisation_id does not match', () => {});
  it('should deny access when membership is not ACTIVE', () => {});
  
  // Break-glass
  it('should grant elevated permissions during active break-glass', () => {});
  it('should deny elevated permissions when break-glass expired', () => {});
  it('should include breakglass_session_id in context', () => {});
  
  // Step-up
  it('should require MFA for mfa_step_up_required permissions', () => {});
  it('should allow if mfa_verified_at within window', () => {});
  it('should deny if mfa_verified_at stale', () => {});
});
```

#### 9.1.2 Crypto Service
```typescript
describe('CryptoService', () => {
  // Envelope encryption
  it('should encrypt and decrypt with current key version', () => {});
  it('should decrypt with older key version', () => {});
  it('should fail decryption with wrong key', () => {});
  
  // Blind indexes
  it('should generate consistent blind index for same input', () => {});
  it('should generate different blind index for different input', () => {});
  it('should normalize email before indexing (lowercase, trim)', () => {});
  it('should normalize IBAN before indexing (no spaces, uppercase)', () => {});
});
```

#### 9.1.3 Audit Hash Chain
```typescript
describe('AuditHashChain', () => {
  it('should compute entry_hash from prev_hash and canonical entry', () => {});
  it('should produce stable hash for same entry', () => {});
  it('should produce different hash if any field changes', () => {});
  it('should verify valid chain', () => {});
  it('should detect tampered entry in chain', () => {});
});
```

### 9.2 Integration Tests

#### 9.2.1 OIDC/Keycloak
```typescript
describe('OIDC Integration', () => {
  it('should complete authorization code + PKCE flow', () => {});
  it('should set HttpOnly cookies after successful auth', () => {});
  it('should refresh tokens before expiry', () => {});
  it('should detect refresh token reuse and revoke session', () => {});
  it('should clear session on logout', () => {});
  it('should reject requests with revoked session', () => {});
});
```

#### 9.2.2 Step-Up Authentication
```typescript
describe('Step-Up Authentication', () => {
  it('should return MFA_STEP_UP_REQUIRED for sensitive operation without recent MFA', () => {});
  it('should allow sensitive operation after MFA verification', () => {});
  it('should provide step_up_url in error response', () => {});
  it('should accept fresh tokens after step-up', () => {});
});
```

#### 9.2.3 Audit Blocking
```typescript
describe('Audit Blocking', () => {
  it('should execute sensitive operation when audit write succeeds', () => {});
  it('should fail sensitive operation when audit write fails', () => {});
  it('should return AUDIT_WRITE_FAILED error code', () => {});
  it('should not execute business logic when audit fails', () => {});
  it('should allow non-blocking operations when audit service is down', () => {});
});
```

### 9.3 Security Tests (Abuse Cases)

#### 9.3.1 Replay Attacks
```typescript
describe('Replay Attack Prevention', () => {
  // Webhook replay
  it('should reject duplicate webhook with same provider_event_id', () => {});
  it('should reject webhook with timestamp outside window', () => {});
  
  // Token replay
  it('should reject access token after session revocation', () => {});
  it('should reject refresh token after rotation', () => {});
});
```

#### 9.3.2 Token Theft
```typescript
describe('Token Theft Mitigation', () => {
  it('should detect refresh token reuse (concurrent use)', () => {});
  it('should revoke entire session on refresh token reuse', () => {});
  it('should flag session with changed IP/UA as suspicious', () => {});
  it('should require step-up for suspicious session', () => {});
});
```

#### 9.3.3 Privilege Escalation
```typescript
describe('Privilege Escalation Prevention', () => {
  it('should reject request with organisation_id not in membership', () => {});
  it('should reject role assignment without role:assign permission', () => {});
  it('should reject permission modification without role:manage', () => {});
  it('should audit all privilege escalation attempts', () => {});
  it('should alert on repeated escalation attempts', () => {});
});
```

#### 9.3.4 Audit Tampering
```typescript
describe('Audit Tampering Prevention', () => {
  it('should reject UPDATE on audit_log_entry (DB trigger)', () => {});
  it('should reject DELETE on audit_log_entry (DB trigger)', () => {});
  it('should detect chain break during verification', () => {});
  it('should detect modified entry via hash mismatch', () => {});
});
```

### 9.4 Compliance Tests

#### 9.4.1 Retention Enforcement
```typescript
describe('Retention Enforcement', () => {
  it('should delete technical logs older than 90 days', () => {});
  it('should retain payment records for 10 years', () => {});
  it('should archive audit logs older than 7 years', () => {});
  it('should anonymize PII after retention period', () => {});
});
```

#### 9.4.2 GDPR Purge
```typescript
describe('GDPR Purge', () => {
  it('should purge all PII for user without legal hold', () => {});
  it('should partial purge when legal hold active', () => {});
  it('should retain financial records during partial purge', () => {});
  it('should anonymize retained records (remove identifying PII)', () => {});
  it('should generate proof of purge with counts', () => {});
  it('should verify no PII remains after purge', () => {});
});
```

---

## 10. Scenarios

### Scenario 1: Break-Glass Activation
**Actors**: SuperAdmin (Alice)  
**Preconditions**: Production incident requiring elevated access  
**Flow**:
1. Alice navigates to break-glass activation UI
2. System requires MFA step-up (immediate verification)
3. Alice provides: reason="Production DB corruption recovery", ticket_ref="INC-12345", ttl=1800
4. System creates BreakglassSession, status=ACTIVE
5. Audit: `breakglass.activate` (BLOCKING) logged
6. Security team receives immediate alert
7. Alice performs recovery operations
8. All operations logged with `breakglass_session_id`
9. Session auto-expires after 30 minutes OR Alice deactivates manually  
**Postconditions**: Audit trail of all break-glass actions, session ended

### Scenario 2: Break-Glass Deactivation (Manual)
**Actors**: SuperAdmin (Alice)  
**Flow**:
1. Alice clicks "End Break-Glass Session"
2. System requires: ended_by (Alice), reason
3. BreakglassSession updated: status=ENDED, ended_at=now()
4. Audit: `breakglass.deactivate` logged
5. Alert sent: "Break-glass session ended"  
**Postconditions**: No more elevated access, full audit trail

### Scenario 3: Export Denied (Permission Missing)
**Actors**: Operator (Bob)  
**Flow**:
1. Bob requests export of customer data (includes PII)
2. System checks permission: `export:sensitive`
3. Bob's role (Operator) does not include this permission
4. Return: `PERMISSION_MISSING` error
5. Audit: `access_denied` with action=`export.sensitive`, result=DENIED
6. Bob sees: "You don't have permission to export sensitive data"  
**Postconditions**: No data exported, denial audited

### Scenario 4: Audit Service Down (Sensitive Action Blocked)
**Actors**: Finance user (Carol)  
**Flow**:
1. Carol initiates refund (audit_blocking=true)
2. Service attempts audit write
3. audit-service returns error (unavailable)
4. System returns `AUDIT_WRITE_FAILED`
5. Refund NOT executed
6. Local logging records attempted action
7. Alert sent to security team: "AUDIT_WRITE_FAILED"
8. Carol sees: "Unable to process refund. Please try again later."  
**Postconditions**: No refund processed, incident logged, alert sent

### Scenario 5: Partial Purge (Legal Hold)
**Actors**: Admin (David), Customer (Eve)  
**Flow**:
1. Eve submits GDPR deletion request
2. David creates PurgeRequest for Eve's data
3. System detects: Eve has invoices from last 3 years
4. Legal hold applied (invoices must be retained 10 years)
5. Purge executes:
   - clients-service: ANONYMIZE (name, email, phone removed)
   - contrats-service: ANONYMIZE
   - factures-service: RETAIN (anonymize customer name only)
   - payments-service: RETAIN (anonymize payer name)
6. Status = PARTIAL
7. Notification to Eve: "Your personal data has been removed. Financial records retained per legal obligation."  
**Postconditions**: PII removed where possible, financial records retained, full proof

### Scenario 6: MFA Step-Up During Payment
**Actors**: Finance user (Frank)  
**Flow**:
1. Frank logged in 2 hours ago with MFA
2. Frank initiates payment refund
3. System checks: mfa_verified_at = 2 hours ago
4. Policy requires: MFA within 10 minutes for refunds
5. Return: `MFA_STEP_UP_REQUIRED` with step_up_url
6. Frank redirected to Keycloak with prompt=login, acr_values=mfa
7. Frank completes OTP verification
8. New tokens issued with fresh mfa_verified_at
9. Frank redirected back to app
10. Refund request succeeds  
**Postconditions**: Refund processed, step-up recorded in audit

### Scenario 7: Session Hijack Detection
**Actors**: Legit user (Grace), Attacker  
**Flow**:
1. Attacker steals Grace's access token (XSS on another site)
2. Attacker attempts to use token from different IP/UA
3. System detects: IP changed from 1.2.3.4 to 5.6.7.8, UA changed
4. Session flagged as suspicious
5. For sensitive operations: `MFA_STEP_UP_REQUIRED`
6. Attacker cannot complete MFA
7. Alert: "Suspicious session activity for Grace"
8. Security team can revoke session  
**Postconditions**: Attack blocked, user session protected, alert generated

### Scenario 8: Tenant Scope Violation Attempt
**Actors**: Attacker (compromised Operator account)  
**Flow**:
1. Attacker modifies request: organisation_id = "other-tenant-uuid"
2. Service validates: actor's membership organisations
3. organisation_id NOT in actor's memberships
4. Return: `TENANT_SCOPE_VIOLATION`
5. Audit: `access_denied`, reason="Tenant scope violation", severity=HIGH
6. Alert sent immediately
7. Account flagged for review  
**Postconditions**: No cross-tenant access, incident documented, alert sent

### Scenario 9: Webhook Replay Attempt
**Actors**: Attacker  
**Flow**:
1. Attacker captures Stripe webhook payload
2. Attacker replays same webhook hours later
3. System checks: provider_event_id in processed events
4. Duplicate found
5. Webhook marked DUPLICATE, not processed
6. Audit: `webhook.duplicate`
7. If frequency high: alert for potential attack  
**Postconditions**: No duplicate processing, attack logged

### Scenario 10: Non-Sensitive Action (Audit Degraded)
**Actors**: Viewer (Helen)  
**Flow**:
1. Helen requests list of her clients (read-only)
2. Permission: `client:read` (audit_blocking=false)
3. audit-service happens to be slow/unavailable
4. Service logs audit locally (best-effort)
5. Client list returned to Helen
6. Local audit forwarded when audit-service recovers  
**Postconditions**: UX not impacted, audit eventually consistent

### Scenario 11: Retention Policy Violation Rejected
**Actors**: Admin (Ivan)  
**Flow**:
1. Ivan tries to set technical_logs retention to -5 days
2. Validation: retention_days must be > 0
3. Return: `RETENTION_POLICY_INVALID`
4. Audit: `config.retention.update_failed`, reason="Invalid retention_days"
5. Policy not changed  
**Postconditions**: Invalid config rejected, attempt logged

### Scenario 12: Successful Break-Glass Recovery
**Actors**: SuperAdmin (Julia)  
**Flow**:
1. Critical bug discovered: payment intents stuck in PROCESSING
2. Julia activates break-glass (reason, ticket, 30min TTL)
3. Julia uses elevated permissions to:
   - Query payment_intent table directly
   - Update stuck intents to correct state
4. All actions audited with breakglass_session_id
5. Julia deactivates break-glass
6. Post-incident: audit export for break-glass period
7. Review confirms all actions appropriate  
**Postconditions**: System recovered, full accountability

### Scenario 13: Encrypted Field Search
**Actors**: Operator (Kevin)  
**Flow**:
1. Kevin searches for customer by email: "john@example.com"
2. System generates blind_index: HMAC("john@example.com")
3. Query: SELECT * FROM client WHERE email_bi = $blind_index
4. Result found
5. System decrypts email_ciphertext for display
6. Kevin sees customer record  
**Postconditions**: Secure search, encryption maintained

### Scenario 14: Key Rotation
**Actors**: System (automated)  
**Flow**:
1. Scheduled job triggers quarterly key rotation
2. New DEK_v2 generated, encrypted with KEK
3. DEK_v2 deployed to services
4. New encryptions use DEK_v2
5. Background job re-encrypts existing data:
   - Read with DEK_v1
   - Write with DEK_v2
   - Update key_version = 2
6. After migration: DEK_v1 deprecated
7. Audit: `crypto.key_rotated`  
**Postconditions**: All data on new key, old key retired

### Scenario 15: Full GDPR Purge (No Legal Hold)
**Actors**: Admin (Lisa), Customer (Mike)  
**Flow**:
1. Mike requests account deletion
2. Lisa creates PurgeRequest
3. No legal hold (Mike never made payments)
4. Purge executes across all services:
   - DELETE all Mike's data
   - No anonymization needed (full delete)
5. Verification queries confirm zero rows for Mike
6. Status = COMPLETED
7. Proof generated: counts per service, verification results
8. Mike notified: "Your account has been deleted"  
**Postconditions**: Complete erasure, verifiable proof

---

## 11. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Create proto/security/*.proto files
- [ ] Generate TypeScript types
- [ ] Create @crm/security-kit library structure
- [ ] Implement JWT validation interceptor

### Phase 2: Core Security (Week 3-4)
- [ ] Implement RBAC evaluator
- [ ] Implement tenant scope guard
- [ ] Implement step-up guard
- [ ] Add security options to 5 critical RPCs

### Phase 3: Audit Service (Week 5-6)
- [ ] Deploy audit-service
- [ ] Implement hash chain
- [ ] Add append-only triggers
- [ ] Wire audit-blocking for payment RPCs

### Phase 4: Compliance Service (Week 7-8)
- [ ] Deploy compliance-service
- [ ] Implement retention policies
- [ ] Implement scheduled purge
- [ ] Implement on-demand GDPR purge

### Phase 5: Encryption (Week 9-10)
- [ ] Set up KMS integration
- [ ] Implement envelope encryption
- [ ] Add blind indexes for searchable fields
- [ ] Migrate sensitive fields

### Phase 6: Rollout (Week 11-12)
- [ ] Add security options to all RPCs
- [ ] Enable mTLS for inter-service
- [ ] Security testing
- [ ] Documentation and training

---

## Appendix A: File Locations

| File | Purpose |
|------|---------|
| `proto/security/options.proto` | Method-level security annotations |
| `proto/security/errors.proto` | Typed security errors |
| `proto/security/audit.proto` | Audit log schema and service |
| `proto/security/auth.proto` | Session, MFA, break-glass |
| `proto/security/retention.proto` | Retention policies, purge |
| `proto/security/crypto.proto` | Encryption metadata |
| `docs/SECURITY_COMPLIANCE_SPECIFICATION.md` | This document |
| `schemas/security_tables.sql` | Database schema |

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-19 | Security Architecture | Initial specification |

---

*This specification is the authoritative reference for security and compliance implementation. All implementations MUST conform to these requirements.*
