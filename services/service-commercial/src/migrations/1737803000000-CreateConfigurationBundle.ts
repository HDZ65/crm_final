import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConfigurationBundle1737803000000 implements MigrationInterface {
  name = 'CreateConfigurationBundle1737803000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS configuration_bundle (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL UNIQUE,
        remise_justi_plus_avec_conciergerie DECIMAL(12, 2) NOT NULL DEFAULT 4.00,
        remise_wincash_avec_conciergerie DECIMAL(12, 2) NOT NULL DEFAULT 4.00,
        remise_both_avec_conciergerie DECIMAL(12, 2) NOT NULL DEFAULT 8.00,
        prix_standalone DECIMAL(12, 2) NOT NULL DEFAULT 9.90,
        prix_justi_plus_standalone DECIMAL(12, 2) NOT NULL DEFAULT 9.90,
        prix_wincash_standalone DECIMAL(12, 2) NOT NULL DEFAULT 9.90,
        prix_conciergerie_standalone DECIMAL(12, 2) NOT NULL DEFAULT 9.90,
        pro_rata_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        grouped_billing_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        actif BOOLEAN NOT NULL DEFAULT TRUE,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_configuration_bundle_organisation_id
      ON configuration_bundle(organisation_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_configuration_bundle_organisation_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS configuration_bundle`);
  }
}
