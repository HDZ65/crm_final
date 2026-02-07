import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHierarchyToGamme1739010000000 implements MigrationInterface {
  name = 'AddHierarchyToGamme1739010000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to gamme table
    await queryRunner.query(`
      ALTER TABLE gamme
      ADD COLUMN IF NOT EXISTS parent_id UUID NULL REFERENCES gamme(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS niveau INT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS type_gamme VARCHAR(50) NOT NULL DEFAULT 'FAMILLE'
    `);

    // Create index on parent_id for performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_gamme_parent_id ON gamme(parent_id)
    `);

    // Migrate existing gammes: set niveau=1 and type_gamme='FAMILLE' for all existing records
    await queryRunner.query(`
      UPDATE gamme
      SET niveau = 1, type_gamme = 'FAMILLE'
      WHERE parent_id IS NULL AND niveau = 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS idx_gamme_parent_id`);

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE gamme
      DROP COLUMN IF EXISTS parent_id,
      DROP COLUMN IF EXISTS niveau,
      DROP COLUMN IF EXISTS type_gamme
    `);
  }
}
