import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStoreBilling1770490000000 implements MigrationInterface {
  name = 'CreateStoreBilling1770490000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums for store_billing_records
    await queryRunner.query(`
      CREATE TYPE store_source_enum AS ENUM ('APPLE_STORE', 'GOOGLE_STORE', 'TV_STORE')
    `);

    await queryRunner.query(`
      CREATE TYPE store_billing_status_enum AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED')
    `);

    await queryRunner.query(`
      CREATE TYPE store_event_type_enum AS ENUM ('INITIAL_PURCHASE', 'RENEWAL', 'CANCELLATION', 'REFUND')
    `);

    // Create store_billing_records table
    await queryRunner.query(`
      CREATE TABLE store_billing_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        subscription_id UUID NOT NULL,
        client_id UUID NOT NULL,
        store_source store_source_enum NOT NULL,
        store_transaction_id VARCHAR(255) NOT NULL,
        store_product_id VARCHAR(255) NOT NULL,
        amount BIGINT NOT NULL,
        currency VARCHAR(3) NOT NULL,
        status store_billing_status_enum NOT NULL DEFAULT 'PENDING',
        receipt_data JSONB,
        event_type store_event_type_enum NOT NULL,
        original_transaction_id VARCHAR(255),
        event_date TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes for store_billing_records
    await queryRunner.query(`
      CREATE INDEX idx_store_billing_organisation_subscription 
      ON store_billing_records(organisation_id, subscription_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_store_billing_organisation_client 
      ON store_billing_records(organisation_id, client_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_store_billing_organisation_store 
      ON store_billing_records(organisation_id, store_source)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_store_billing_transaction 
      ON store_billing_records(store_source, store_transaction_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_store_billing_organisation_status 
      ON store_billing_records(organisation_id, status)
    `);

    // Create enum for store_configs
    await queryRunner.query(`
      CREATE TYPE store_type_enum AS ENUM ('APPLE', 'GOOGLE')
    `);

    // Create store_configs table
    await queryRunner.query(`
      CREATE TABLE store_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        store_type store_type_enum NOT NULL,
        bundle_id VARCHAR(255) NOT NULL,
        shared_secret_hash VARCHAR(255) NOT NULL,
        webhook_url VARCHAR(512) NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes for store_configs
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_store_config_organisation_type 
      ON store_configs(organisation_id, store_type)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_store_config_organisation_active 
      ON store_configs(organisation_id, active)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_store_config_organisation_active`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_store_config_organisation_type`);
    await queryRunner.query(`DROP TABLE IF EXISTS store_configs`);
    await queryRunner.query(`DROP TYPE IF EXISTS store_type_enum`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_store_billing_organisation_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_store_billing_transaction`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_store_billing_organisation_store`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_store_billing_organisation_client`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_store_billing_organisation_subscription`);
    await queryRunner.query(`DROP TABLE IF EXISTS store_billing_records`);
    await queryRunner.query(`DROP TYPE IF EXISTS store_event_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS store_billing_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS store_source_enum`);
  }
}
