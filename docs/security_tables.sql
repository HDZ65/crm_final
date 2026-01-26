-- ============================================================================
-- SECURITY & COMPLIANCE DATABASE SCHEMA
-- CRM Final - Payment-Enabled Multi-Tenant Platform
-- ============================================================================
-- This schema defines tables for:
-- - Audit logging (append-only with hash chain)
-- - Session management
-- - Break-glass sessions
-- - Retention policies and purge tracking
-- - Encryption key metadata
-- ============================================================================

-- ============================================================================
-- AUDIT SERVICE TABLES
-- ============================================================================

-- Audit log entries (append-only, hash chain integrity)
CREATE TABLE IF NOT EXISTS audit_log_entry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Correlation
    organisation_id UUID NOT NULL,
    request_id TEXT NOT NULL,
    correlation_id TEXT,
    
    -- Actor
    actor_type TEXT NOT NULL CHECK (actor_type IN ('USER', 'SERVICE', 'SYSTEM', 'WEBHOOK')),
    actor_user_id UUID,
    actor_keycloak_sub TEXT,
    actor_service_name TEXT,
    breakglass_session_id UUID,
    actor_email TEXT,
    ip_hash TEXT,
    user_agent_hash TEXT,
    
    -- Action
    action TEXT NOT NULL,
    permission TEXT,
    result TEXT NOT NULL CHECK (result IN ('ALLOWED', 'DENIED', 'FAILED')),
    error_message TEXT,
    
    -- Target
    target_type TEXT,
    target_id TEXT,
    target_meta JSONB NOT NULL DEFAULT '{}',
    
    -- Change tracking (encrypted if sensitive)
    before_json JSONB,
    after_json JSONB,
    
    -- Hash chain integrity
    prev_hash CHAR(64) NOT NULL,
    entry_hash CHAR(64) NOT NULL,
    
    -- Additional metadata
    meta JSONB NOT NULL DEFAULT '{}'
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_log_org_occurred 
    ON audit_log_entry (organisation_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_request_id 
    ON audit_log_entry (request_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action 
    ON audit_log_entry (action, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_user 
    ON audit_log_entry (actor_user_id, occurred_at DESC) 
    WHERE actor_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_log_target 
    ON audit_log_entry (target_type, target_id, occurred_at DESC) 
    WHERE target_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_log_breakglass 
    ON audit_log_entry (breakglass_session_id) 
    WHERE breakglass_session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_log_entry_hash 
    ON audit_log_entry (entry_hash);

-- Hash chain head tracking (for computing next prev_hash)
CREATE TABLE IF NOT EXISTS audit_chain_head (
    organisation_id UUID NOT NULL,
    stream TEXT NOT NULL DEFAULT 'default',
    last_entry_hash CHAR(64) NOT NULL,
    entry_count BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organisation_id, stream)
);

-- Audit checkpoints (signed snapshots for verification)
CREATE TABLE IF NOT EXISTS audit_checkpoint (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    stream TEXT NOT NULL DEFAULT 'default',
    checkpoint_hash CHAR(64) NOT NULL,
    signature TEXT,
    entry_count BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_checkpoint_org 
    ON audit_checkpoint (organisation_id, stream, created_at DESC);

-- ============================================================================
-- APPEND-ONLY ENFORCEMENT TRIGGERS
-- ============================================================================

-- Prevent UPDATE on audit_log_entry
CREATE OR REPLACE FUNCTION prevent_audit_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'UPDATE not allowed on audit_log_entry table. Audit logs are append-only.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_update ON audit_log_entry;
CREATE TRIGGER trg_prevent_audit_update
BEFORE UPDATE ON audit_log_entry
FOR EACH ROW EXECUTE FUNCTION prevent_audit_update();

-- Prevent DELETE on audit_log_entry
CREATE OR REPLACE FUNCTION prevent_audit_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'DELETE not allowed on audit_log_entry table. Audit logs are append-only.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_delete ON audit_log_entry;
CREATE TRIGGER trg_prevent_audit_delete
BEFORE DELETE ON audit_log_entry
FOR EACH ROW EXECUTE FUNCTION prevent_audit_delete();

-- ============================================================================
-- AUTH SERVICE TABLES
-- ============================================================================

-- Session tracking
CREATE TABLE IF NOT EXISTS auth_session (
    session_id TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
    keycloak_sub TEXT NOT NULL,
    organisation_id UUID,
    
    -- Security metadata
    ip_hash TEXT,
    user_agent_hash TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- MFA state
    mfa_verified_at TIMESTAMPTZ,
    mfa_method TEXT CHECK (mfa_method IN ('TOTP', 'WEBAUTHN', 'SMS', 'EMAIL')),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED', 'SUSPICIOUS')),
    
    -- Revocation info
    revoked_by TEXT,
    revocation_reason TEXT,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_auth_session_user 
    ON auth_session (user_id, status);
CREATE INDEX IF NOT EXISTS idx_auth_session_keycloak 
    ON auth_session (keycloak_sub);
CREATE INDEX IF NOT EXISTS idx_auth_session_expires 
    ON auth_session (expires_at) 
    WHERE status = 'ACTIVE';

-- Break-glass sessions
CREATE TABLE IF NOT EXISTS breakglass_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    utilisateur_id UUID NOT NULL,
    
    -- Reason (encrypted at rest)
    reason_ciphertext BYTEA NOT NULL,
    reason_key_version INT NOT NULL,
    reason_nonce BYTEA NOT NULL,
    
    -- Ticket reference
    ticket_ref TEXT NOT NULL,
    
    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    
    -- Who ended it (if manually ended)
    ended_by_user_id UUID,
    end_reason TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'ENDED', 'REVOKED')),
    
    -- Granted permissions
    granted_permissions TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_breakglass_org_user_status 
    ON breakglass_session (organisation_id, utilisateur_id, status);
CREATE INDEX IF NOT EXISTS idx_breakglass_expires 
    ON breakglass_session (expires_at) 
    WHERE status = 'ACTIVE';

-- ============================================================================
-- COMPLIANCE SERVICE TABLES
-- ============================================================================

-- Retention policies
CREATE TABLE IF NOT EXISTS retention_policy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    service_name TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    retention_days INT NOT NULL CHECK (retention_days > 0),
    purge_mode TEXT NOT NULL CHECK (purge_mode IN ('DELETE', 'ANONYMIZE', 'ARCHIVE')),
    legal_basis TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_user_id UUID,
    UNIQUE (service_name, entity_name)
);

CREATE INDEX IF NOT EXISTS idx_retention_policy_category 
    ON retention_policy (category);
CREATE INDEX IF NOT EXISTS idx_retention_policy_service 
    ON retention_policy (service_name);

-- Purge jobs (scheduled retention enforcement)
CREATE TABLE IF NOT EXISTS purge_job (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    retention_policy_id UUID REFERENCES retention_policy(id),
    service_name TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    cutoff_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED', 'SKIPPED')),
    
    -- Counts
    records_scanned BIGINT NOT NULL DEFAULT 0,
    records_deleted BIGINT NOT NULL DEFAULT 0,
    records_anonymized BIGINT NOT NULL DEFAULT 0,
    records_archived BIGINT NOT NULL DEFAULT 0,
    records_retained BIGINT NOT NULL DEFAULT 0,
    retention_reason TEXT,
    
    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Error info
    error_message TEXT,
    
    -- Is this a dry run?
    dry_run BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_purge_job_status 
    ON purge_job (status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_purge_job_service 
    ON purge_job (service_name, started_at DESC);

-- GDPR purge requests
CREATE TABLE IF NOT EXISTS purge_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    requested_by_user_id UUID NOT NULL,
    
    -- Subject
    subject_type TEXT NOT NULL CHECK (subject_type IN ('USER', 'CUSTOMER', 'PARTNER')),
    subject_id TEXT NOT NULL,
    subject_email TEXT,
    
    -- Reason
    reason TEXT NOT NULL,
    legal_basis TEXT,
    external_reference TEXT,
    
    -- Legal hold
    legal_hold BOOLEAN NOT NULL DEFAULT FALSE,
    legal_hold_reason TEXT,
    legal_hold_until TIMESTAMPTZ,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'PARTIAL', 'REJECTED', 'FAILED')),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_purge_request_org 
    ON purge_request (organisation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purge_request_status 
    ON purge_request (status);
CREATE INDEX IF NOT EXISTS idx_purge_request_subject 
    ON purge_request (subject_type, subject_id);

-- Purge execution (per-service results)
CREATE TABLE IF NOT EXISTS purge_execution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purge_request_id UUID NOT NULL REFERENCES purge_request(id),
    service_name TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'PARTIAL', 'FAILED', 'SKIPPED')),
    
    -- Counts
    deleted_count BIGINT NOT NULL DEFAULT 0,
    anonymized_count BIGINT NOT NULL DEFAULT 0,
    retained_count BIGINT NOT NULL DEFAULT 0,
    retained_reason TEXT,
    
    -- Verification
    verification_query TEXT,
    verification_passed BOOLEAN,
    
    -- Timestamps
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Error info
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_purge_execution_request 
    ON purge_execution (purge_request_id);

-- Legal holds
CREATE TABLE IF NOT EXISTS legal_hold (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    subject_type TEXT NOT NULL CHECK (subject_type IN ('USER', 'CUSTOMER', 'PARTNER')),
    subject_id TEXT NOT NULL,
    
    -- Hold details
    reason TEXT NOT NULL,
    case_reference TEXT,
    
    -- Who placed it
    placed_by_user_id UUID NOT NULL,
    placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Expiration (optional)
    expires_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- If lifted
    lifted_by_user_id UUID,
    lifted_at TIMESTAMPTZ,
    lift_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_legal_hold_subject 
    ON legal_hold (organisation_id, subject_type, subject_id, is_active);
CREATE INDEX IF NOT EXISTS idx_legal_hold_expires 
    ON legal_hold (expires_at) 
    WHERE is_active = TRUE AND expires_at IS NOT NULL;

-- ============================================================================
-- CRYPTO SERVICE TABLES
-- ============================================================================

-- Data encryption key metadata (DEK)
CREATE TABLE IF NOT EXISTS data_key (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL CHECK (domain IN ('PII', 'PAYMENT', 'AUDIT_SIGNING', 'SECRETS')),
    version INT NOT NULL,
    environment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DECRYPT_ONLY', 'PENDING_DELETION', 'DESTROYED')),
    algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
    
    -- Encrypted DEK (encrypted by KEK in KMS)
    encrypted_key BYTEA NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    deprecated_at TIMESTAMPTZ,
    scheduled_deletion_at TIMESTAMPTZ,
    
    -- Created by
    created_by TEXT,
    
    -- Is this the current key for encryption?
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    
    UNIQUE (domain, environment, version)
);

CREATE INDEX IF NOT EXISTS idx_data_key_domain_env 
    ON data_key (domain, environment, status);
CREATE INDEX IF NOT EXISTS idx_data_key_current 
    ON data_key (domain, environment) 
    WHERE is_current = TRUE;

-- Ensure only one current key per domain/environment
CREATE UNIQUE INDEX IF NOT EXISTS idx_data_key_unique_current 
    ON data_key (domain, environment) 
    WHERE is_current = TRUE;

-- ============================================================================
-- DATABASE ROLES AND PERMISSIONS
-- ============================================================================

-- Note: Run these with a superuser account

-- Audit writer role (INSERT + SELECT only)
-- CREATE ROLE audit_writer;
-- GRANT INSERT, SELECT ON audit_log_entry TO audit_writer;
-- GRANT SELECT, UPDATE ON audit_chain_head TO audit_writer;
-- GRANT INSERT, SELECT ON audit_checkpoint TO audit_writer;
-- REVOKE UPDATE, DELETE ON audit_log_entry FROM audit_writer;

-- Audit reader role (SELECT only)
-- CREATE ROLE audit_reader;
-- GRANT SELECT ON audit_log_entry TO audit_reader;
-- GRANT SELECT ON audit_chain_head TO audit_reader;
-- GRANT SELECT ON audit_checkpoint TO audit_reader;

-- Compliance service role
-- CREATE ROLE compliance_service;
-- GRANT ALL ON retention_policy TO compliance_service;
-- GRANT ALL ON purge_job TO compliance_service;
-- GRANT ALL ON purge_request TO compliance_service;
-- GRANT ALL ON purge_execution TO compliance_service;
-- GRANT ALL ON legal_hold TO compliance_service;

-- Auth service role
-- CREATE ROLE auth_service;
-- GRANT ALL ON auth_session TO auth_service;
-- GRANT ALL ON breakglass_session TO auth_service;

-- Crypto service role
-- CREATE ROLE crypto_service;
-- GRANT ALL ON data_key TO crypto_service;

-- ============================================================================
-- PARTITIONING (Optional - for high-volume audit logs)
-- ============================================================================

-- Example: Partition audit_log_entry by month
-- Note: Uncomment and adapt for production use

-- CREATE TABLE audit_log_entry_partitioned (
--     LIKE audit_log_entry INCLUDING ALL
-- ) PARTITION BY RANGE (occurred_at);

-- CREATE TABLE audit_log_entry_2026_01 
--     PARTITION OF audit_log_entry_partitioned
--     FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- CREATE TABLE audit_log_entry_2026_02 
--     PARTITION OF audit_log_entry_partitioned
--     FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- ============================================================================
-- SEED DATA - Default Retention Policies
-- ============================================================================

INSERT INTO retention_policy (category, service_name, entity_name, retention_days, purge_mode, legal_basis, description, is_active)
VALUES 
    -- Payment records: 10 years (French commercial law)
    ('PAYMENT_10Y', 'payment-service', 'payment_intent', 3650, 'ARCHIVE', 'French Commercial Code L123-22', 'Payment intents must be retained for 10 years', TRUE),
    ('PAYMENT_10Y', 'payment-service', 'payment_schedule', 3650, 'ARCHIVE', 'French Commercial Code L123-22', 'Payment schedules must be retained for 10 years', TRUE),
    
    -- Audit logs: 7 years
    ('AUDIT_7Y', 'audit-service', 'audit_log_entry', 2555, 'ARCHIVE', 'Compliance requirement', 'Audit logs retained for compliance', TRUE),
    
    -- Technical logs: 90 days
    ('TECH_90D', '*', 'technical_logs', 90, 'DELETE', 'Operational', 'Technical logs for debugging', TRUE),
    
    -- Session data: 30 days after expiry
    ('SESSION_30D', 'auth-service', 'auth_session', 30, 'DELETE', 'No legal requirement', 'Session data cleanup', TRUE),
    
    -- Invoices: 10 years
    ('INVOICE_10Y', 'factures-service', 'facture', 3650, 'ARCHIVE', 'French Commercial Code L123-22', 'Invoice retention', TRUE),
    
    -- Contracts: 10 years after end
    ('CONTRACT_10Y', 'contrats-service', 'contrat', 3650, 'ARCHIVE', 'French Civil Code', 'Contract retention after termination', TRUE),
    
    -- PII default: Account lifetime + 30 days
    ('PII_DEFAULT', 'clients-service', 'client_base', 30, 'ANONYMIZE', 'GDPR Art. 17', 'PII removed after account deletion', TRUE),
    
    -- Webhook events: 90 days
    ('WEBHOOK_90D', 'payment-service', 'payment_event', 90, 'DELETE', 'Operational', 'Webhook event cleanup', TRUE),
    
    -- Notification inbox: 1 year
    ('NOTIFICATION_1Y', 'notifications-service', 'notification', 365, 'DELETE', 'No legal requirement', 'Notification cleanup', TRUE)
ON CONFLICT (service_name, entity_name) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE audit_log_entry IS 'Append-only audit log with hash chain integrity. UPDATE and DELETE are blocked by triggers.';
COMMENT ON TABLE audit_chain_head IS 'Tracks the current head of each audit chain for hash computation.';
COMMENT ON TABLE audit_checkpoint IS 'Signed checkpoints for audit chain verification.';
COMMENT ON TABLE auth_session IS 'Active user sessions tracked for revocation and security monitoring.';
COMMENT ON TABLE breakglass_session IS 'Time-bound emergency access sessions with encrypted reasons.';
COMMENT ON TABLE retention_policy IS 'Data retention policies per service and entity.';
COMMENT ON TABLE purge_job IS 'Scheduled purge job execution history.';
COMMENT ON TABLE purge_request IS 'GDPR and manual purge requests.';
COMMENT ON TABLE purge_execution IS 'Per-service purge execution results.';
COMMENT ON TABLE legal_hold IS 'Legal holds preventing data purge.';
COMMENT ON TABLE data_key IS 'Data encryption key metadata (encrypted DEKs).';
