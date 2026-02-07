import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClientExternalMappings1770487474000 implements MigrationInterface {
  name = 'CreateClientExternalMappings1770487474000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type
    await queryRunner.query(`
      CREATE TYPE source_system_enum AS ENUM ('IMS', 'WEB', 'MOBILE_APP', 'TV_APP', 'BOX')
    `);

    // Create table
    await queryRunner.query(`
      CREATE TABLE client_external_mappings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        client_id UUID NOT NULL,
        source_system source_system_enum NOT NULL,
        source_channel VARCHAR(100),
        ims_user_id VARCHAR(255),
        store_customer_id VARCHAR(255),
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_client_external_mapping_ims_user 
      ON client_external_mappings(organisation_id, ims_user_id) 
      WHERE ims_user_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_client_external_mapping_client_id 
      ON client_external_mappings(organisation_id, client_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_client_external_mapping_source_system 
      ON client_external_mappings(organisation_id, source_system)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_client_external_mapping_source_system`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_client_external_mapping_client_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_client_external_mapping_ims_user`);
    await queryRunner.query(`DROP TABLE IF EXISTS client_external_mappings`);
    await queryRunner.query(`DROP TYPE IF EXISTS source_system_enum`);
  }
}
