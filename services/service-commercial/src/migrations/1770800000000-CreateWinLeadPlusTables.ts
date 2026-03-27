import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWinLeadPlusTables1770800000000 implements MigrationInterface {
  name = 'CreateWinLeadPlusTables1770800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type
    await queryRunner.query(`
      CREATE TYPE winleadplus_sync_status_enum AS ENUM ('RUNNING', 'SUCCESS', 'FAILED')
    `);

    // ============================================================================
    // CREATE TABLE: winleadplus_configs
    // ============================================================================
    await queryRunner.query(`
      CREATE TABLE winleadplus_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL UNIQUE,
        api_endpoint VARCHAR(500) NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT true,
        sync_interval_minutes INT NOT NULL DEFAULT 60,
        last_sync_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_wlp_config_org ON winleadplus_configs(organisation_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_wlp_config_enabled ON winleadplus_configs(enabled)
    `);

    // ============================================================================
    // CREATE TABLE: winleadplus_mappings
    // ============================================================================
    await queryRunner.query(`
      CREATE TABLE winleadplus_mappings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        winleadplus_prospect_id INT NOT NULL,
        crm_client_id UUID NOT NULL,
        crm_contrat_ids JSONB NOT NULL DEFAULT '[]',
        last_synced_at TIMESTAMPTZ,
        data_hash VARCHAR(64),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Unique constraint for duplicate prevention
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_wlp_mapping_unique ON winleadplus_mappings(organisation_id, winleadplus_prospect_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_wlp_mapping_org ON winleadplus_mappings(organisation_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_wlp_mapping_crm_client ON winleadplus_mappings(crm_client_id)
    `);

    // ============================================================================
    // CREATE TABLE: winleadplus_sync_logs
    // ============================================================================
    await queryRunner.query(`
      CREATE TABLE winleadplus_sync_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        started_at TIMESTAMPTZ NOT NULL,
        finished_at TIMESTAMPTZ,
        status winleadplus_sync_status_enum NOT NULL DEFAULT 'RUNNING',
        total_prospects INT NOT NULL DEFAULT 0,
        created INT NOT NULL DEFAULT 0,
        updated INT NOT NULL DEFAULT 0,
        skipped INT NOT NULL DEFAULT 0,
        errors JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_wlp_sync_org ON winleadplus_sync_logs(organisation_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_wlp_sync_org_started ON winleadplus_sync_logs(organisation_id, started_at)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_wlp_sync_status ON winleadplus_sync_logs(status)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wlp_sync_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wlp_sync_org_started`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wlp_sync_org`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wlp_mapping_crm_client`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wlp_mapping_org`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wlp_mapping_unique`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wlp_config_enabled`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wlp_config_org`);

    // Drop tables (reverse order)
    await queryRunner.query(`DROP TABLE IF EXISTS winleadplus_sync_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS winleadplus_mappings`);
    await queryRunner.query(`DROP TABLE IF EXISTS winleadplus_configs`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS winleadplus_sync_status_enum`);
  }
}
