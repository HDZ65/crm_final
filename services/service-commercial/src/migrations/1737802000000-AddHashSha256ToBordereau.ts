import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHashSha256ToBordereau1737802000000 implements MigrationInterface {
  name = 'AddHashSha256ToBordereau1737802000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE bordereaux_commission
      ADD COLUMN IF NOT EXISTS hash_sha256 VARCHAR(64)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE bordereaux_commission
      DROP COLUMN IF EXISTS hash_sha256
    `);
  }
}
