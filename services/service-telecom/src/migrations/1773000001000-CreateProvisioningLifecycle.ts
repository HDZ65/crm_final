import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProvisioningLifecycle1773000001000
  implements MigrationInterface
{
  name = 'CreateProvisioningLifecycle1773000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "provisioning_lifecycle" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organisation_id" uuid,
        "contrat_id" character varying(120) NOT NULL,
        "client_id" character varying(120) NOT NULL,
        "commercial_id" character varying(120),
        "date_signature" TIMESTAMPTZ NOT NULL,
        "date_fin_retractation" TIMESTAMPTZ NOT NULL,
        "abonnement_status" character varying(120) NOT NULL DEFAULT 'Attente',
        "provisioning_state" character varying(60) NOT NULL DEFAULT 'EN_ATTENTE_RETRACTATION',
        "montant_abonnement" numeric(15,2) NOT NULL DEFAULT '0',
        "devise" character varying(10) NOT NULL DEFAULT 'EUR',
        "sepa_mandate_id" character varying(120),
        "gocardless_subscription_id" character varying(120),
        "compensation_done" boolean NOT NULL DEFAULT false,
        "last_error" text,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_provisioning_lifecycle_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_provisioning_lifecycle_contrat_id" UNIQUE ("contrat_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_provisioning_lifecycle_date_fin_retractation"
      ON "provisioning_lifecycle" ("date_fin_retractation")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_provisioning_lifecycle_state"
      ON "provisioning_lifecycle" ("provisioning_state")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_provisioning_lifecycle_state"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_provisioning_lifecycle_date_fin_retractation"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "provisioning_lifecycle"`);
  }
}
