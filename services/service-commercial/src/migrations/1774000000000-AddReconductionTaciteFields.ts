import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReconductionTaciteFields1774000000000
  implements MigrationInterface
{
  name = 'AddReconductionTaciteFields1774000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "contrat"
      ADD COLUMN "renewal_date" TIMESTAMPTZ NULL,
      ADD COLUMN "tacite_renewal_enabled" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN "renewal_status" VARCHAR(60) NULL,
      ADD COLUMN "renewal_notification_j90_sent_at" TIMESTAMPTZ NULL,
      ADD COLUMN "renewal_notification_j30_sent_at" TIMESTAMPTZ NULL,
      ADD COLUMN "renewal_cancellation_deadline" TIMESTAMPTZ NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_contrat_renewal_date"
      ON "contrat" ("renewal_date")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_contrat_renewal_status"
      ON "contrat" ("renewal_status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contrat_renewal_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contrat_renewal_date"`);
    await queryRunner.query(`
      ALTER TABLE "contrat"
      DROP COLUMN IF EXISTS "renewal_cancellation_deadline",
      DROP COLUMN IF EXISTS "renewal_notification_j30_sent_at",
      DROP COLUMN IF EXISTS "renewal_notification_j90_sent_at",
      DROP COLUMN IF EXISTS "renewal_status",
      DROP COLUMN IF EXISTS "tacite_renewal_enabled",
      DROP COLUMN IF EXISTS "renewal_date"
    `);
  }
}
