import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCfastConfigTable1772130000000 implements MigrationInterface {
  name = 'CreateCfastConfigTable1772130000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================================
    // CREATE TABLE: cfast_configs
    // ============================================================================
    await queryRunner.query(`
      CREATE TABLE cfast_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        base_url VARCHAR(500) NOT NULL,
        client_id_encrypted VARCHAR(500) NOT NULL,
        client_secret_encrypted VARCHAR(500) NOT NULL,
        username_encrypted VARCHAR(500) NOT NULL,
        password_encrypted VARCHAR(500) NOT NULL,
        scopes VARCHAR(500) NOT NULL DEFAULT 'openid identity bill',
        active BOOLEAN NOT NULL DEFAULT false,
        last_sync_at TIMESTAMPTZ,
        sync_error TEXT,
        last_imported_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Unique index on organisation_id (one config per organisation)
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_cfast_config_org ON cfast_configs(organisation_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_cfast_config_org`);
    await queryRunner.query(`DROP TABLE IF EXISTS cfast_configs`);
  }
}
