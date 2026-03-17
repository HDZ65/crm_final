import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRequiresWithdrawalPeriodToProduit1773000002000
  implements MigrationInterface
{
  name = 'AddRequiresWithdrawalPeriodToProduit1773000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "produit"
      ADD COLUMN "requires_withdrawal_period" BOOLEAN NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_produit_requires_withdrawal_period"
      ON "produit" ("requires_withdrawal_period")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_produit_requires_withdrawal_period"`,
    );
    await queryRunner.query(`
      ALTER TABLE "produit"
      DROP COLUMN "requires_withdrawal_period"
    `);
  }
}
