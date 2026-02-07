import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTvodEstPurchases1770510000000 implements MigrationInterface {
  name = 'CreateTvodEstPurchases1770510000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE purchase_type_enum AS ENUM ('TVOD', 'EST')
    `);

    await queryRunner.query(`
      CREATE TYPE payment_method_enum AS ENUM ('CB_DIRECT', 'APPLE_STORE', 'GOOGLE_STORE')
    `);

    await queryRunner.query(`
      CREATE TYPE store_source_enum AS ENUM ('DIRECT', 'APPLE', 'GOOGLE')
    `);

    await queryRunner.query(`
      CREATE TYPE purchase_status_enum AS ENUM ('PENDING', 'COMPLETED', 'REFUNDED')
    `);

    // Create table
    await queryRunner.query(`
      CREATE TABLE tvod_est_purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        client_id UUID NOT NULL,
        content_id VARCHAR(255) NOT NULL,
        content_title VARCHAR(500) NOT NULL,
        purchase_type purchase_type_enum NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
        payment_method payment_method_enum NOT NULL,
        store_source store_source_enum NOT NULL,
        store_transaction_id VARCHAR(255),
        ims_transaction_id VARCHAR(255) NOT NULL,
        invoice_id UUID,
        status purchase_status_enum NOT NULL DEFAULT 'PENDING',
        refunded_at TIMESTAMPTZ,
        refund_amount DECIMAL(12, 2),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_tvod_est_purchase_organisation_client 
      ON tvod_est_purchases(organisation_id, client_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_tvod_est_purchase_organisation_content 
      ON tvod_est_purchases(organisation_id, content_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_tvod_est_purchase_organisation_status 
      ON tvod_est_purchases(organisation_id, status)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_tvod_est_purchase_client_created 
      ON tvod_est_purchases(client_id, created_at)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_tvod_est_purchase_ims_transaction 
      ON tvod_est_purchases(ims_transaction_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tvod_est_purchase_ims_transaction`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tvod_est_purchase_client_created`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tvod_est_purchase_organisation_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tvod_est_purchase_organisation_content`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tvod_est_purchase_organisation_client`);
    await queryRunner.query(`DROP TABLE IF EXISTS tvod_est_purchases`);
    await queryRunner.query(`DROP TYPE IF EXISTS purchase_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS store_source_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_method_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS purchase_type_enum`);
  }
}
