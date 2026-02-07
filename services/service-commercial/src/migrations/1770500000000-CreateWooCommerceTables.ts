import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWooCommerceTables1770500000000 implements MigrationInterface {
  name = 'CreateWooCommerceTables1770500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE webhook_event_status_enum AS ENUM ('RECEIVED', 'VERIFIED', 'PROCESSING', 'PROCESSED', 'FAILED', 'DUPLICATE')
    `);

    await queryRunner.query(`
      CREATE TYPE woocommerce_entity_type_enum AS ENUM ('CLIENT', 'SUBSCRIPTION', 'ORDER', 'PAYMENT')
    `);

    // ============================================================================
    // CREATE TABLE: woocommerce_webhook_events (inbox pattern)
    // ============================================================================
    await queryRunner.query(`
      CREATE TABLE woocommerce_webhook_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        source VARCHAR(50) NOT NULL DEFAULT 'woocommerce',
        external_event_id VARCHAR(255) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        woo_resource_id VARCHAR(255) NOT NULL,
        raw_payload JSONB NOT NULL,
        signature VARCHAR(512),
        status webhook_event_status_enum NOT NULL DEFAULT 'RECEIVED',
        error_message TEXT,
        retry_count INT NOT NULL DEFAULT 0,
        received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        verified_at TIMESTAMPTZ,
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Unique constraint for duplicate detection
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_wc_event_unique ON woocommerce_webhook_events(source, external_event_id)
    `);

    // Indexes for querying
    await queryRunner.query(`
      CREATE INDEX idx_wc_event_org ON woocommerce_webhook_events(organisation_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_wc_event_org_status ON woocommerce_webhook_events(organisation_id, status)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_wc_event_type_created ON woocommerce_webhook_events(event_type, created_at)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_wc_event_status_received ON woocommerce_webhook_events(status, received_at)
    `);

    // ============================================================================
    // CREATE TABLE: woocommerce_mappings
    // ============================================================================
    await queryRunner.query(`
      CREATE TABLE woocommerce_mappings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        entity_type woocommerce_entity_type_enum NOT NULL,
        woo_id VARCHAR(255) NOT NULL,
        crm_entity_id UUID NOT NULL,
        last_synced_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Unique constraint for mapping lookup
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_wc_mapping_unique ON woocommerce_mappings(organisation_id, entity_type, woo_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_wc_mapping_org ON woocommerce_mappings(organisation_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_wc_mapping_crm_entity ON woocommerce_mappings(crm_entity_id)
    `);

    // ============================================================================
    // CREATE TABLE: woocommerce_configs
    // ============================================================================
    await queryRunner.query(`
      CREATE TABLE woocommerce_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL UNIQUE,
        store_url VARCHAR(500) NOT NULL,
        webhook_secret VARCHAR(255) NOT NULL,
        consumer_key_hash VARCHAR(255) NOT NULL,
        consumer_secret_hash VARCHAR(255) NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        last_sync_at TIMESTAMPTZ,
        sync_error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_wc_config_org ON woocommerce_configs(organisation_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_wc_config_active ON woocommerce_configs(active)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wc_config_active`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wc_config_org`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wc_mapping_crm_entity`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wc_mapping_org`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wc_mapping_unique`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wc_event_status_received`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wc_event_type_created`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wc_event_org_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wc_event_org`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wc_event_unique`);

    // Drop tables (reverse order)
    await queryRunner.query(`DROP TABLE IF EXISTS woocommerce_configs`);
    await queryRunner.query(`DROP TABLE IF EXISTS woocommerce_mappings`);
    await queryRunner.query(`DROP TABLE IF EXISTS woocommerce_webhook_events`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS woocommerce_entity_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS webhook_event_status_enum`);
  }
}
