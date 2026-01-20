-- Migration: 001_create_calendar_tables
-- Module: Calendar / Prélèvements / Lots
-- Date: 2026-01-19

BEGIN;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE debit_date_mode AS ENUM ('BATCH', 'FIXED_DAY');
CREATE TYPE debit_batch AS ENUM ('L1', 'L2', 'L3', 'L4');
CREATE TYPE date_shift_strategy AS ENUM ('NEXT_BUSINESS_DAY', 'PREVIOUS_BUSINESS_DAY', 'NEXT_WEEK_SAME_DAY');
CREATE TYPE planned_date_status AS ENUM ('PLANNED', 'CONFIRMED', 'PROCESSING', 'EXECUTED', 'FAILED', 'CANCELLED');
CREATE TYPE holiday_type AS ENUM ('PUBLIC', 'BANK', 'REGIONAL', 'COMPANY');
CREATE TYPE audit_source AS ENUM ('UI', 'CSV_IMPORT', 'API', 'SYSTEM');

-- ============================================================================
-- HOLIDAY ZONES
-- ============================================================================

CREATE TABLE holiday_zone (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    country_code CHAR(2) NOT NULL,
    region_code VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_holiday_zone_org_code UNIQUE(organisation_id, code)
);

CREATE INDEX idx_holiday_zone_org ON holiday_zone(organisation_id);
CREATE INDEX idx_holiday_zone_country ON holiday_zone(country_code);

-- ============================================================================
-- HOLIDAYS
-- ============================================================================

CREATE TABLE holiday (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_zone_id UUID NOT NULL REFERENCES holiday_zone(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    name VARCHAR(100) NOT NULL,
    holiday_type holiday_type NOT NULL DEFAULT 'PUBLIC',
    is_recurring BOOLEAN DEFAULT false,
    recurring_month INT CHECK (recurring_month IS NULL OR (recurring_month BETWEEN 1 AND 12)),
    recurring_day INT CHECK (recurring_day IS NULL OR (recurring_day BETWEEN 1 AND 31)),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_holiday_zone_date UNIQUE(holiday_zone_id, date)
);

CREATE INDEX idx_holiday_zone ON holiday(holiday_zone_id);
CREATE INDEX idx_holiday_date ON holiday(date);
CREATE INDEX idx_holiday_date_lookup ON holiday(holiday_zone_id, date) WHERE is_active = true;
CREATE INDEX idx_holiday_recurring ON holiday(holiday_zone_id, recurring_month, recurring_day) WHERE is_recurring = true AND is_active = true;

-- ============================================================================
-- CUTOFF CONFIGURATION
-- ============================================================================

CREATE TABLE cutoff_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    cutoff_time TIME NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'Europe/Paris',
    days_before_value_date INT NOT NULL DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cutoff_config_org ON cutoff_configuration(organisation_id);

-- ============================================================================
-- SYSTEM DEBIT CONFIGURATION (Default per organisation)
-- ============================================================================

CREATE TABLE system_debit_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL UNIQUE,
    default_mode debit_date_mode NOT NULL,
    default_batch debit_batch,
    default_fixed_day INT CHECK (default_fixed_day IS NULL OR (default_fixed_day BETWEEN 1 AND 28)),
    shift_strategy date_shift_strategy NOT NULL DEFAULT 'NEXT_BUSINESS_DAY',
    holiday_zone_id UUID REFERENCES holiday_zone(id),
    cutoff_config_id UUID REFERENCES cutoff_configuration(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_system_mode_batch CHECK (default_mode != 'BATCH' OR default_batch IS NOT NULL),
    CONSTRAINT chk_system_mode_fixed CHECK (default_mode != 'FIXED_DAY' OR default_fixed_day IS NOT NULL)
);

-- ============================================================================
-- COMPANY DEBIT CONFIGURATION
-- ============================================================================

CREATE TABLE company_debit_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    societe_id UUID NOT NULL UNIQUE,
    mode debit_date_mode NOT NULL,
    batch debit_batch,
    fixed_day INT CHECK (fixed_day IS NULL OR (fixed_day BETWEEN 1 AND 28)),
    shift_strategy date_shift_strategy NOT NULL DEFAULT 'NEXT_BUSINESS_DAY',
    holiday_zone_id UUID REFERENCES holiday_zone(id),
    cutoff_config_id UUID REFERENCES cutoff_configuration(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_company_mode_batch CHECK (mode != 'BATCH' OR batch IS NOT NULL),
    CONSTRAINT chk_company_mode_fixed CHECK (mode != 'FIXED_DAY' OR fixed_day IS NOT NULL)
);

CREATE INDEX idx_company_config_org ON company_debit_configuration(organisation_id);
CREATE INDEX idx_company_config_lookup ON company_debit_configuration(societe_id) WHERE is_active = true;

-- ============================================================================
-- CLIENT DEBIT CONFIGURATION
-- ============================================================================

CREATE TABLE client_debit_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    client_id UUID NOT NULL UNIQUE,
    mode debit_date_mode NOT NULL,
    batch debit_batch,
    fixed_day INT CHECK (fixed_day IS NULL OR (fixed_day BETWEEN 1 AND 28)),
    shift_strategy date_shift_strategy NOT NULL DEFAULT 'NEXT_BUSINESS_DAY',
    holiday_zone_id UUID REFERENCES holiday_zone(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_client_mode_batch CHECK (mode != 'BATCH' OR batch IS NOT NULL),
    CONSTRAINT chk_client_mode_fixed CHECK (mode != 'FIXED_DAY' OR fixed_day IS NOT NULL)
);

CREATE INDEX idx_client_config_org ON client_debit_configuration(organisation_id);
CREATE INDEX idx_client_config_lookup ON client_debit_configuration(client_id) WHERE is_active = true;

-- ============================================================================
-- CONTRACT DEBIT CONFIGURATION (Highest priority)
-- ============================================================================

CREATE TABLE contract_debit_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    contrat_id UUID NOT NULL UNIQUE,
    mode debit_date_mode NOT NULL,
    batch debit_batch,
    fixed_day INT CHECK (fixed_day IS NULL OR (fixed_day BETWEEN 1 AND 28)),
    shift_strategy date_shift_strategy NOT NULL DEFAULT 'NEXT_BUSINESS_DAY',
    holiday_zone_id UUID REFERENCES holiday_zone(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_contract_mode_batch CHECK (mode != 'BATCH' OR batch IS NOT NULL),
    CONSTRAINT chk_contract_mode_fixed CHECK (mode != 'FIXED_DAY' OR fixed_day IS NOT NULL)
);

CREATE INDEX idx_contract_config_org ON contract_debit_configuration(organisation_id);
CREATE INDEX idx_contract_config_lookup ON contract_debit_configuration(contrat_id) WHERE is_active = true;

-- ============================================================================
-- PLANNED DEBITS
-- ============================================================================

CREATE TABLE planned_debit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    societe_id UUID NOT NULL,
    client_id UUID NOT NULL,
    contrat_id UUID NOT NULL,
    schedule_id UUID,
    facture_id UUID,
    planned_debit_date DATE NOT NULL,
    original_target_date DATE NOT NULL,
    status planned_date_status NOT NULL DEFAULT 'PLANNED',
    batch debit_batch,
    amount_cents BIGINT NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    resolved_config JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_planned_debit_org ON planned_debit(organisation_id);
CREATE INDEX idx_planned_debit_date ON planned_debit(organisation_id, planned_debit_date);
CREATE INDEX idx_planned_debit_status ON planned_debit(organisation_id, status);
CREATE INDEX idx_planned_debit_contrat ON planned_debit(contrat_id);
CREATE INDEX idx_planned_debit_client ON planned_debit(client_id);
CREATE INDEX idx_planned_debit_calendar ON planned_debit(organisation_id, planned_debit_date, batch);

-- ============================================================================
-- VOLUME FORECAST
-- ============================================================================

CREATE TABLE volume_forecast (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    societe_id UUID,
    year INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    day INT NOT NULL CHECK (day BETWEEN 1 AND 31),
    batch debit_batch,
    expected_transaction_count INT NOT NULL DEFAULT 0,
    expected_amount_cents BIGINT NOT NULL DEFAULT 0,
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    actual_transaction_count INT,
    actual_amount_cents BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_volume_forecast UNIQUE(organisation_id, societe_id, year, month, day, batch)
);

CREATE INDEX idx_volume_forecast_org ON volume_forecast(organisation_id);
CREATE INDEX idx_volume_forecast_date ON volume_forecast(organisation_id, year, month);

-- ============================================================================
-- VOLUME THRESHOLDS
-- ============================================================================

CREATE TABLE volume_threshold (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    societe_id UUID,
    max_transaction_count INT,
    max_amount_cents BIGINT,
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    alert_on_exceed BOOLEAN DEFAULT true,
    alert_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_volume_threshold_org ON volume_threshold(organisation_id);

-- ============================================================================
-- CALENDAR AUDIT LOG
-- ============================================================================

CREATE TABLE calendar_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    actor_user_id UUID,
    source audit_source NOT NULL,
    before_state JSONB,
    after_state JSONB,
    change_summary TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_org ON calendar_audit_log(organisation_id);
CREATE INDEX idx_audit_entity ON calendar_audit_log(organisation_id, entity_type, entity_id);
CREATE INDEX idx_audit_date ON calendar_audit_log(organisation_id, created_at DESC);
CREATE INDEX idx_audit_actor ON calendar_audit_log(actor_user_id);

-- ============================================================================
-- TRIGGER: auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_holiday_zone_updated_at BEFORE UPDATE ON holiday_zone FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_holiday_updated_at BEFORE UPDATE ON holiday FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cutoff_config_updated_at BEFORE UPDATE ON cutoff_configuration FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_debit_configuration FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_config_updated_at BEFORE UPDATE ON company_debit_configuration FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_config_updated_at BEFORE UPDATE ON client_debit_configuration FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contract_config_updated_at BEFORE UPDATE ON contract_debit_configuration FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_planned_debit_updated_at BEFORE UPDATE ON planned_debit FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_volume_forecast_updated_at BEFORE UPDATE ON volume_forecast FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_volume_threshold_updated_at BEFORE UPDATE ON volume_threshold FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
