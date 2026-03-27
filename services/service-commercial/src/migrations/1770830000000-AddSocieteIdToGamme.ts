import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSocieteIdToGamme1770830000000 implements MigrationInterface {
  name = 'AddSocieteIdToGamme1770830000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add societe_id column to gamme table
    await queryRunner.query(`
      ALTER TABLE "gamme"
        ADD COLUMN "societe_id" UUID NULL
    `);

    // Create index on societe_id
    await queryRunner.query(`
      CREATE INDEX "IDX_gamme_societe_id" ON "gamme" ("societe_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_gamme_societe_id"
    `);

    // Drop column
    await queryRunner.query(`
      ALTER TABLE "gamme"
        DROP COLUMN IF EXISTS "societe_id"
    `);
  }
}
