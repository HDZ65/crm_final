import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCfastEntityMappings1772140000000 implements MigrationInterface {
  name = 'CreateCfastEntityMappings1772140000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================================
    // CREATE TABLE: cfast_entity_mappings
    // ============================================================================
    await queryRunner.query(`
      CREATE TABLE cfast_entity_mappings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        crm_entity_type VARCHAR(50) NOT NULL,
        crm_entity_id UUID NOT NULL,
        cfast_entity_type VARCHAR(50) NOT NULL,
        cfast_entity_id VARCHAR(255) NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(organisation_id, crm_entity_type, crm_entity_id, cfast_entity_type)
      )
    `);

    // Index for CRM-side lookups
    await queryRunner.query(`
      CREATE INDEX idx_cfast_mapping_crm ON cfast_entity_mappings(organisation_id, crm_entity_type, crm_entity_id)
    `);

    // Index for CFAST-side lookups
    await queryRunner.query(`
      CREATE INDEX idx_cfast_mapping_cfast ON cfast_entity_mappings(organisation_id, cfast_entity_type, cfast_entity_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_cfast_mapping_cfast`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_cfast_mapping_crm`);
    await queryRunner.query(`DROP TABLE IF EXISTS cfast_entity_mappings`);
  }
}
