-- ============================================================
-- AM04 RETRY SYSTEM - Database Migration
-- ============================================================
-- Version: 1.0.0
-- Date: 2026-01-19
-- Description: Creates all tables for the AM04 retry system
-- ============================================================

BEGIN;

-- ============================================================
-- RETRY POLICY
-- ============================================================
CREATE TABLE IF NOT EXISTS retry_policy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    societe_id UUID,
    product_id UUID,
    channel_id UUID,
    
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    
    retry_delays_days JSONB NOT NULL DEFAULT '[5, 10, 20]',
    
    max_attempts INT NOT NULL DEFAULT 3 CHECK (max_attempts >= 1 AND max_attempts <= 10),
    max_total_days INT NOT NULL DEFAULT 30 CHECK (max_total_days >= 1 AND max_total_days <= 90),
    
    retry_on_am04 BOOLEAN NOT NULL DEFAULT true,
    retryable_codes JSONB DEFAULT '[]',
    non_retryable_codes JSONB DEFAULT '[]',
    
    stop_on_payment_settled BOOLEAN NOT NULL DEFAULT true,
    stop_on_contract_cancelled BOOLEAN NOT NULL DEFAULT true,
    stop_on_mandate_revoked BOOLEAN NOT NULL DEFAULT true,
    
    backoff_strategy VARCHAR(20) NOT NULL DEFAULT 'FIXED' CHECK (backoff_strategy IN ('FIXED', 'EXPONENTIAL', 'LINEAR')),
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    priority INT NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_retry_policy_default 
    ON retry_policy(organisation_id, societe_id) 
    WHERE is_default = true AND societe_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_retry_policy_default_org 
    ON retry_policy(organisation_id) 
    WHERE is_default = true AND societe_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_retry_policy_org ON retry_policy(organisation_id);
CREATE INDEX IF NOT EXISTS idx_retry_policy_societe ON retry_policy(organisation_id, societe_id) WHERE societe_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_retry_policy_active ON retry_policy(organisation_id, is_active) WHERE is_active = true;

-- ============================================================
-- RETRY SCHEDULE
-- ============================================================
CREATE TABLE IF NOT EXISTS retry_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    societe_id UUID NOT NULL,
    
    original_payment_id UUID NOT NULL,
    schedule_id UUID NOT NULL,
    facture_id UUID,
    contrat_id UUID,
    client_id UUID NOT NULL,
    
    rejection_code VARCHAR(50) NOT NULL,
    rejection_raw_code VARCHAR(50) NOT NULL,
    rejection_message TEXT,
    rejection_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    retry_policy_id UUID NOT NULL REFERENCES retry_policy(id),
    
    amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    
    eligibility VARCHAR(50) NOT NULL CHECK (eligibility IN (
        'ELIGIBLE',
        'NOT_ELIGIBLE_REASON_CODE',
        'NOT_ELIGIBLE_MAX_ATTEMPTS',
        'NOT_ELIGIBLE_PAYMENT_SETTLED',
        'NOT_ELIGIBLE_CONTRACT_CANCELLED',
        'NOT_ELIGIBLE_MANDATE_REVOKED',
        'NOT_ELIGIBLE_CLIENT_BLOCKED',
        'NOT_ELIGIBLE_MANUAL_CANCEL'
    )),
    eligibility_reason TEXT,
    
    current_attempt INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL,
    next_retry_date TIMESTAMP WITH TIME ZONE,
    
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolution_reason TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    idempotency_key VARCHAR(255) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_retry_schedule_idempotency ON retry_schedule(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_retry_schedule_org ON retry_schedule(organisation_id);
CREATE INDEX IF NOT EXISTS idx_retry_schedule_societe ON retry_schedule(organisation_id, societe_id);
CREATE INDEX IF NOT EXISTS idx_retry_schedule_client ON retry_schedule(client_id);
CREATE INDEX IF NOT EXISTS idx_retry_schedule_contrat ON retry_schedule(contrat_id) WHERE contrat_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_retry_schedule_payment ON retry_schedule(original_payment_id);
CREATE INDEX IF NOT EXISTS idx_retry_schedule_due ON retry_schedule(next_retry_date, is_resolved, eligibility) 
    WHERE is_resolved = false AND eligibility = 'ELIGIBLE';
CREATE INDEX IF NOT EXISTS idx_retry_schedule_rejection_date ON retry_schedule(rejection_date);
CREATE INDEX IF NOT EXISTS idx_retry_schedule_unresolved ON retry_schedule(organisation_id, is_resolved) WHERE is_resolved = false;

-- ============================================================
-- RETRY ATTEMPT
-- ============================================================
CREATE TABLE IF NOT EXISTS retry_attempt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    retry_schedule_id UUID NOT NULL REFERENCES retry_schedule(id) ON DELETE CASCADE,
    
    attempt_number INT NOT NULL CHECK (attempt_number >= 1),
    planned_date TIMESTAMP WITH TIME ZONE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE,
    
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN (
        'SCHEDULED',
        'IN_PROGRESS',
        'SUBMITTED',
        'SUCCEEDED',
        'FAILED',
        'CANCELLED',
        'SKIPPED'
    )),
    
    payment_intent_id UUID,
    psp_payment_id VARCHAR(255),
    psp_response JSONB,
    
    error_code VARCHAR(50),
    error_message TEXT,
    new_rejection_code VARCHAR(50),
    
    retry_job_id UUID,
    
    idempotency_key VARCHAR(255) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_retry_attempt_schedule_number ON retry_attempt(retry_schedule_id, attempt_number);
CREATE UNIQUE INDEX IF NOT EXISTS uq_retry_attempt_idempotency ON retry_attempt(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_retry_attempt_schedule ON retry_attempt(retry_schedule_id);
CREATE INDEX IF NOT EXISTS idx_retry_attempt_status ON retry_attempt(status);
CREATE INDEX IF NOT EXISTS idx_retry_attempt_job ON retry_attempt(retry_job_id) WHERE retry_job_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_retry_attempt_planned ON retry_attempt(planned_date, status) WHERE status = 'SCHEDULED';

-- ============================================================
-- RETRY JOB
-- ============================================================
CREATE TABLE IF NOT EXISTS retry_job (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    
    target_date DATE NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'Europe/Paris',
    cutoff_time TIME NOT NULL DEFAULT '10:00:00',
    
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    status VARCHAR(20) NOT NULL DEFAULT 'JOB_PENDING' CHECK (status IN (
        'JOB_PENDING',
        'JOB_RUNNING',
        'JOB_COMPLETED',
        'JOB_FAILED',
        'JOB_PARTIAL'
    )),
    
    total_attempts INT NOT NULL DEFAULT 0,
    successful_attempts INT NOT NULL DEFAULT 0,
    failed_attempts INT NOT NULL DEFAULT 0,
    skipped_attempts INT NOT NULL DEFAULT 0,
    
    error_message TEXT,
    failed_schedule_ids JSONB DEFAULT '[]',
    
    idempotency_key VARCHAR(255) NOT NULL,
    
    triggered_by VARCHAR(255) NOT NULL,
    is_manual BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_retry_job_idempotency ON retry_job(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_retry_job_org ON retry_job(organisation_id);
CREATE INDEX IF NOT EXISTS idx_retry_job_status ON retry_job(status);
CREATE INDEX IF NOT EXISTS idx_retry_job_date ON retry_job(target_date);
CREATE INDEX IF NOT EXISTS idx_retry_job_org_date ON retry_job(organisation_id, target_date);

ALTER TABLE retry_attempt 
    ADD CONSTRAINT fk_retry_attempt_job 
    FOREIGN KEY (retry_job_id) REFERENCES retry_job(id);

-- ============================================================
-- REMINDER POLICY
-- ============================================================
CREATE TABLE IF NOT EXISTS reminder_policy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    societe_id UUID,
    
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    
    trigger_rules JSONB NOT NULL DEFAULT '[]',
    
    cooldown_hours INT NOT NULL DEFAULT 24 CHECK (cooldown_hours >= 0 AND cooldown_hours <= 168),
    max_reminders_per_day INT NOT NULL DEFAULT 3 CHECK (max_reminders_per_day >= 1 AND max_reminders_per_day <= 10),
    max_reminders_per_week INT NOT NULL DEFAULT 10 CHECK (max_reminders_per_week >= 1 AND max_reminders_per_week <= 50),
    
    allowed_start_hour INT NOT NULL DEFAULT 9 CHECK (allowed_start_hour >= 0 AND allowed_start_hour <= 23),
    allowed_end_hour INT NOT NULL DEFAULT 19 CHECK (allowed_end_hour >= 0 AND allowed_end_hour <= 23),
    allowed_days_of_week JSONB NOT NULL DEFAULT '[1,2,3,4,5]',
    
    respect_opt_out BOOLEAN NOT NULL DEFAULT true,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    priority INT NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminder_policy_org ON reminder_policy(organisation_id);
CREATE INDEX IF NOT EXISTS idx_reminder_policy_active ON reminder_policy(organisation_id, is_active) WHERE is_active = true;

-- ============================================================
-- REMINDER
-- ============================================================
CREATE TABLE IF NOT EXISTS reminder (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    societe_id UUID NOT NULL,
    
    retry_schedule_id UUID NOT NULL REFERENCES retry_schedule(id),
    retry_attempt_id UUID REFERENCES retry_attempt(id),
    client_id UUID NOT NULL,
    
    reminder_policy_id UUID NOT NULL REFERENCES reminder_policy(id),
    trigger_rule_id VARCHAR(255),
    
    channel VARCHAR(20) NOT NULL CHECK (channel IN (
        'EMAIL',
        'SMS',
        'PHONE_CALL',
        'PUSH_NOTIFICATION',
        'POSTAL_MAIL'
    )),
    template_id VARCHAR(255) NOT NULL,
    template_variables JSONB DEFAULT '{}',
    
    trigger VARCHAR(50) NOT NULL CHECK (trigger IN (
        'ON_AM04_RECEIVED',
        'BEFORE_RETRY',
        'AFTER_RETRY_FAILED',
        'AFTER_ALL_RETRIES_EXHAUSTED',
        'MANUAL'
    )),
    
    planned_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    status VARCHAR(20) NOT NULL DEFAULT 'REMINDER_PENDING' CHECK (status IN (
        'REMINDER_PENDING',
        'REMINDER_SENT',
        'REMINDER_DELIVERED',
        'REMINDER_FAILED',
        'REMINDER_CANCELLED',
        'REMINDER_BOUNCED',
        'REMINDER_OPENED',
        'REMINDER_CLICKED'
    )),
    
    provider_name VARCHAR(50),
    provider_message_id VARCHAR(255),
    delivery_status_raw TEXT,
    
    error_code VARCHAR(50),
    error_message TEXT,
    retry_count INT NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
    
    idempotency_key VARCHAR(255) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_reminder_idempotency ON reminder(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_reminder_org ON reminder(organisation_id);
CREATE INDEX IF NOT EXISTS idx_reminder_schedule ON reminder(retry_schedule_id);
CREATE INDEX IF NOT EXISTS idx_reminder_client ON reminder(client_id);
CREATE INDEX IF NOT EXISTS idx_reminder_status ON reminder(status);
CREATE INDEX IF NOT EXISTS idx_reminder_planned ON reminder(planned_at, status) WHERE status = 'REMINDER_PENDING';
CREATE INDEX IF NOT EXISTS idx_reminder_channel ON reminder(channel, status);

-- ============================================================
-- AUDIT LOG (Append-Only)
-- ============================================================
CREATE TABLE IF NOT EXISTS retry_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    
    old_value JSONB,
    new_value JSONB NOT NULL,
    changed_fields TEXT,
    
    retry_schedule_id UUID,
    retry_attempt_id UUID,
    reminder_id UUID,
    payment_id UUID,
    
    actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('SYSTEM', 'USER', 'SCHEDULER', 'WEBHOOK')),
    actor_id UUID,
    actor_ip INET,
    
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_audit_log_org ON retry_audit_log(organisation_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON retry_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_schedule ON retry_audit_log(retry_schedule_id) WHERE retry_schedule_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON retry_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON retry_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON retry_audit_log(actor_type, actor_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_retry_policy_updated_at
    BEFORE UPDATE ON retry_policy
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_retry_schedule_updated_at
    BEFORE UPDATE ON retry_schedule
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_retry_attempt_updated_at
    BEFORE UPDATE ON retry_attempt
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_retry_job_updated_at
    BEFORE UPDATE ON retry_job
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_reminder_policy_updated_at
    BEFORE UPDATE ON reminder_policy
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_reminder_updated_at
    BEFORE UPDATE ON reminder
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Prevent updates/deletes on audit log
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit log is append-only. Updates and deletes are not allowed.';
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER prevent_audit_log_update
    BEFORE UPDATE ON retry_audit_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

CREATE OR REPLACE TRIGGER prevent_audit_log_delete
    BEFORE DELETE ON retry_audit_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

-- ============================================================
-- SEED DATA: Default Retry Policy
-- ============================================================

INSERT INTO retry_policy (
    id,
    organisation_id,
    name,
    description,
    retry_delays_days,
    max_attempts,
    max_total_days,
    retry_on_am04,
    retryable_codes,
    non_retryable_codes,
    stop_on_payment_settled,
    stop_on_contract_cancelled,
    stop_on_mandate_revoked,
    backoff_strategy,
    is_active,
    is_default,
    priority
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000', -- System-wide default
    'Default AM04 Retry Policy',
    'Standard retry policy for AM04 rejections: J+5, J+10, J+20',
    '[5, 10, 20]',
    3,
    30,
    true,
    '["AM04_ACCOUNT_CLOSED", "AC04_ACCOUNT_CLOSED", "AC06_ACCOUNT_BLOCKED", "MS02_NOT_SPECIFIED_REASON"]',
    '["AC01_IBAN_INVALID", "FF05_DUPLICATE_ENTRY", "FOCR_FOLLOWING_CANCELLATION"]',
    true,
    true,
    true,
    'FIXED',
    true,
    true,
    0
) ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA: Default Reminder Policy
-- ============================================================

INSERT INTO reminder_policy (
    id,
    organisation_id,
    name,
    description,
    trigger_rules,
    cooldown_hours,
    max_reminders_per_day,
    max_reminders_per_week,
    allowed_start_hour,
    allowed_end_hour,
    allowed_days_of_week,
    respect_opt_out,
    is_active,
    is_default,
    priority
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000', -- System-wide default
    'Default AM04 Reminder Policy',
    'Standard reminder policy for AM04 rejections',
    '[
        {
            "id": "rule_on_am04",
            "trigger": "ON_AM04_RECEIVED",
            "channel": "EMAIL",
            "template_id": "am04_initial_notification",
            "delay_hours": 0,
            "order": 1,
            "only_if_no_response": false,
            "only_first_rejection": true
        },
        {
            "id": "rule_before_retry",
            "trigger": "BEFORE_RETRY",
            "channel": "EMAIL",
            "template_id": "retry_upcoming_reminder",
            "delay_hours": 0,
            "days_before_retry": 2,
            "order": 2,
            "only_if_no_response": false,
            "only_first_rejection": false
        },
        {
            "id": "rule_after_fail",
            "trigger": "AFTER_RETRY_FAILED",
            "channel": "EMAIL",
            "template_id": "retry_failed_notification",
            "delay_hours": 1,
            "order": 3,
            "only_if_no_response": false,
            "only_first_rejection": false
        },
        {
            "id": "rule_exhausted",
            "trigger": "AFTER_ALL_RETRIES_EXHAUSTED",
            "channel": "EMAIL",
            "template_id": "all_retries_exhausted",
            "delay_hours": 0,
            "order": 4,
            "only_if_no_response": false,
            "only_first_rejection": false
        }
    ]',
    24,
    3,
    10,
    9,
    19,
    '[1, 2, 3, 4, 5]', -- Monday to Friday
    true,
    true,
    true,
    0
) ON CONFLICT DO NOTHING;

COMMIT;
