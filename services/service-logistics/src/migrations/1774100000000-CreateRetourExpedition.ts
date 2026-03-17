import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRetourExpedition1774100000000 implements MigrationInterface {
  name = 'CreateRetourExpedition1774100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "retour_expedition" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "expedition_id" uuid NOT NULL,
        "reason" character varying NOT NULL,
        "status" character varying(50) NOT NULL DEFAULT 'DEMANDE',
        "tracking_number" character varying NULL,
        "label_url" text NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_retour_expedition" PRIMARY KEY ("id"),
        CONSTRAINT "FK_retour_expedition_expedition" FOREIGN KEY ("expedition_id")
          REFERENCES "expeditions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_retour_expedition_expedition_id" ON "retour_expedition" ("expedition_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_retour_expedition_status" ON "retour_expedition" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_retour_expedition_status"`);
    await queryRunner.query(`DROP INDEX "IDX_retour_expedition_expedition_id"`);
    await queryRunner.query(`DROP TABLE "retour_expedition"`);
  }
}
