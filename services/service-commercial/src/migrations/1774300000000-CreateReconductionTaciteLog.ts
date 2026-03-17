import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReconductionTaciteLog1774300000000
  implements MigrationInterface
{
  name = 'CreateReconductionTaciteLog1774300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "reconduction_tacite_log" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "contrat_id" UUID NOT NULL,
        "renewal_date" TIMESTAMPTZ NOT NULL,
        "notification_j90_sent" BOOLEAN NOT NULL DEFAULT false,
        "notification_j30_sent" BOOLEAN NOT NULL DEFAULT false,
        "notification_j90_delivery_proof_id" UUID,
        "notification_j30_delivery_proof_id" UUID,
        "status" VARCHAR(60) NOT NULL DEFAULT 'PENDING',
        "cancelled_at" TIMESTAMPTZ,
        "cancellation_reason" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reconduction_tacite_log" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reconduction_tacite_log_contrat" FOREIGN KEY ("contrat_id")
          REFERENCES "contrat"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_reconduction_tacite_log_contrat_id"
      ON "reconduction_tacite_log" ("contrat_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_reconduction_tacite_log_status"
      ON "reconduction_tacite_log" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_reconduction_tacite_log_renewal_date"
      ON "reconduction_tacite_log" ("renewal_date")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reconduction_tacite_log_renewal_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reconduction_tacite_log_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reconduction_tacite_log_contrat_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reconduction_tacite_log"`);
  }
}
