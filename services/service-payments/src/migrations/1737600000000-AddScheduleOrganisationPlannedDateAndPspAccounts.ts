import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddScheduleOrganisationPlannedDateAndPspAccounts1737600000000 implements MigrationInterface {
  name = 'AddScheduleOrganisationPlannedDateAndPspAccounts1737600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE schedules
      ADD COLUMN organisation_id UUID
    `);

    await queryRunner.query(`
      ALTER TABLE schedules
      ADD COLUMN planned_debit_date TIMESTAMPTZ
    `);

    await queryRunner.query(`
      CREATE INDEX idx_schedules_organisation_id ON schedules(organisation_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_schedules_planned_debit_date ON schedules(planned_debit_date)
    `);

    await queryRunner.query(`
      CREATE TABLE slimpay_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        societe_id UUID NOT NULL,
        nom VARCHAR(255) NOT NULL,
        app_name VARCHAR(255),
        app_secret VARCHAR(255),
        webhook_secret VARCHAR(255),
        is_sandbox BOOLEAN NOT NULL DEFAULT true,
        actif BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_slimpay_accounts_societe_id ON slimpay_accounts(societe_id)
    `);

    await queryRunner.query(`
      CREATE TABLE multisafepay_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        societe_id UUID NOT NULL,
        nom VARCHAR(255) NOT NULL,
        api_key VARCHAR(255),
        webhook_secret VARCHAR(255),
        is_sandbox BOOLEAN NOT NULL DEFAULT true,
        actif BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_multisafepay_accounts_societe_id ON multisafepay_accounts(societe_id)
    `);

    await queryRunner.query(`
      CREATE TABLE emerchantpay_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        societe_id UUID NOT NULL,
        nom VARCHAR(255) NOT NULL,
        api_login VARCHAR(255),
        api_password VARCHAR(255),
        terminal_token VARCHAR(255),
        webhook_public_key TEXT,
        is_sandbox BOOLEAN NOT NULL DEFAULT true,
        actif BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_emerchantpay_accounts_societe_id ON emerchantpay_accounts(societe_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_emerchantpay_accounts_societe_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS emerchantpay_accounts`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_multisafepay_accounts_societe_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS multisafepay_accounts`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_slimpay_accounts_societe_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS slimpay_accounts`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_schedules_planned_debit_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_schedules_organisation_id`);

    await queryRunner.query(`ALTER TABLE schedules DROP COLUMN IF EXISTS planned_debit_date`);
    await queryRunner.query(`ALTER TABLE schedules DROP COLUMN IF EXISTS organisation_id`);
  }
}
