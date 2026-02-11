import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApiTokenToWinLeadPlusConfigs1770829336000 implements MigrationInterface {
  name = 'AddApiTokenToWinLeadPlusConfigs1770829336000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE winleadplus_configs
      ADD COLUMN IF NOT EXISTS api_token TEXT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE winleadplus_configs
      DROP COLUMN IF EXISTS api_token
    `);
  }
}
