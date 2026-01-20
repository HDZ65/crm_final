import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePortalPaymentTables1737300000000 implements MigrationInterface {
  name = 'CreatePortalPaymentTables1737300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE portal_session_status_enum AS ENUM (
        'CREATED', 'ACTIVE', 'REDIRECTED', 'COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE portal_session_action_enum AS ENUM (
        'VIEW_PAYMENT', 'PAY_BY_CARD', 'PAY_BY_SEPA', 'SETUP_SEPA', 'VIEW_MANDATE'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE psp_provider_enum AS ENUM (
        'STRIPE', 'PAYPAL', 'GOCARDLESS', 'EMERCHANTPAY', 'SLIMPAY', 'MULTISAFEPAY'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE audit_event_type_enum AS ENUM (
        'SESSION_CREATED', 'SESSION_ACCESSED', 'SESSION_ACTIVATED', 'SESSION_EXPIRED',
        'SESSION_CANCELLED', 'REDIRECT_INITIATED', 'REDIRECT_COMPLETED', 'CALLBACK_RECEIVED',
        'PAYMENT_INITIATED', 'PAYMENT_COMPLETED', 'PAYMENT_FAILED', 'WEBHOOK_RECEIVED',
        'WEBHOOK_VERIFIED', 'WEBHOOK_REJECTED', 'WEBHOOK_PROCESSED', 'TOKEN_VALIDATED',
        'TOKEN_REJECTED', 'RATE_LIMIT_HIT', 'REPLAY_DETECTED'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE audit_actor_type_enum AS ENUM (
        'PORTAL_TOKEN', 'AUTHENTICATED_USER', 'ADMIN', 'WEBHOOK', 'SYSTEM'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE webhook_event_status_enum AS ENUM (
        'RECEIVED', 'VERIFIED', 'REJECTED', 'PROCESSED', 'FAILED', 'DUPLICATE'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE portal_payment_session (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        societe_id UUID NOT NULL,
        customer_id UUID NOT NULL,
        contract_id UUID,
        payment_intent_id UUID,
        token_hash VARCHAR(64) NOT NULL,
        token_version VARCHAR(4) NOT NULL DEFAULT 'v1',
        status portal_session_status_enum NOT NULL DEFAULT 'CREATED',
        allowed_actions TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        max_uses INTEGER NOT NULL DEFAULT 1,
        use_count INTEGER NOT NULL DEFAULT 0,
        idempotency_key_hash VARCHAR(64),
        amount_cents BIGINT NOT NULL DEFAULT 0,
        currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
        description VARCHAR(500),
        mandate_id UUID,
        rum_masked VARCHAR(50),
        psp_state VARCHAR(64),
        psp_redirect_url TEXT,
        psp_provider psp_provider_enum,
        psp_session_id VARCHAR(255),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_accessed_at TIMESTAMPTZ,
        consumed_at TIMESTAMPTZ,
        revoked_at TIMESTAMPTZ,
        CONSTRAINT chk_portal_session_currency CHECK (LENGTH(currency) = 3),
        CONSTRAINT chk_portal_session_amount CHECK (amount_cents >= 0),
        CONSTRAINT chk_portal_session_uses CHECK (use_count <= max_uses)
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_portal_session_token_hash ON portal_payment_session(token_hash)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_portal_session_organisation ON portal_payment_session(organisation_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_portal_session_societe ON portal_payment_session(societe_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_portal_session_customer ON portal_payment_session(customer_id, status)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_portal_session_contract ON portal_payment_session(contract_id) 
      WHERE contract_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_portal_session_expires ON portal_payment_session(expires_at) 
      WHERE status NOT IN ('COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED')
    `);

    await queryRunner.query(`
      CREATE INDEX idx_portal_session_psp_state ON portal_payment_session(psp_state) 
      WHERE psp_state IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_portal_session_idempotency ON portal_payment_session(idempotency_key_hash) 
      WHERE idempotency_key_hash IS NOT NULL 
      AND status NOT IN ('COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED')
    `);

    await queryRunner.query(`
      CREATE TABLE portal_session_audit (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        portal_session_id UUID NOT NULL REFERENCES portal_payment_session(id),
        event_type audit_event_type_enum NOT NULL,
        actor_type audit_actor_type_enum NOT NULL,
        request_id VARCHAR(64),
        correlation_id VARCHAR(64),
        ip_address_hash VARCHAR(64),
        user_agent_hash VARCHAR(64),
        geo_country VARCHAR(2),
        previous_status VARCHAR(32),
        new_status VARCHAR(32),
        data JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_portal_audit_session ON portal_session_audit(portal_session_id, created_at)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_portal_audit_event_type ON portal_session_audit(event_type, created_at)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_portal_audit_request_id ON portal_session_audit(request_id) 
      WHERE request_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE RULE portal_audit_no_update AS ON UPDATE TO portal_session_audit DO INSTEAD NOTHING
    `);

    await queryRunner.query(`
      CREATE RULE portal_audit_no_delete AS ON DELETE TO portal_session_audit DO INSTEAD NOTHING
    `);

    await queryRunner.query(`
      CREATE TABLE psp_event_inbox (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        psp_provider psp_provider_enum NOT NULL,
        psp_event_id VARCHAR(255) NOT NULL,
        psp_event_type VARCHAR(128),
        portal_session_id UUID REFERENCES portal_payment_session(id),
        payment_intent_id UUID,
        raw_payload TEXT NOT NULL,
        signature VARCHAR(512),
        status webhook_event_status_enum NOT NULL DEFAULT 'RECEIVED',
        error_message TEXT,
        received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        verified_at TIMESTAMPTZ,
        processed_at TIMESTAMPTZ
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_psp_event_unique ON psp_event_inbox(psp_provider, psp_event_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_psp_event_session ON psp_event_inbox(portal_session_id) 
      WHERE portal_session_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_psp_event_status ON psp_event_inbox(status, received_at)
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_portal_session_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_portal_session_updated_at
      BEFORE UPDATE ON portal_payment_session
      FOR EACH ROW
      EXECUTE FUNCTION update_portal_session_updated_at()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_portal_session_updated_at ON portal_payment_session`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_portal_session_updated_at`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_psp_event_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_psp_event_session`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_psp_event_unique`);
    await queryRunner.query(`DROP TABLE IF EXISTS psp_event_inbox`);

    await queryRunner.query(`DROP RULE IF EXISTS portal_audit_no_delete ON portal_session_audit`);
    await queryRunner.query(`DROP RULE IF EXISTS portal_audit_no_update ON portal_session_audit`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_portal_audit_request_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_portal_audit_event_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_portal_audit_session`);
    await queryRunner.query(`DROP TABLE IF EXISTS portal_session_audit`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_portal_session_idempotency`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_portal_session_psp_state`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_portal_session_expires`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_portal_session_contract`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_portal_session_customer`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_portal_session_societe`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_portal_session_organisation`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_portal_session_token_hash`);
    await queryRunner.query(`DROP TABLE IF EXISTS portal_payment_session`);

    await queryRunner.query(`DROP TYPE IF EXISTS webhook_event_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS audit_actor_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS audit_event_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS psp_provider_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS portal_session_action_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS portal_session_status_enum`);
  }
}
