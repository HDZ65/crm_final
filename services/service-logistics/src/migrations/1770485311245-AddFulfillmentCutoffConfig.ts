import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFulfillmentCutoffConfig1770485311245 implements MigrationInterface {
    name = 'AddFulfillmentCutoffConfig1770485311245'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "fulfillment_cutoff_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" character varying NOT NULL, "societe_id" character varying NOT NULL, "cutoff_day_of_week" integer NOT NULL DEFAULT '0', "cutoff_time" character varying NOT NULL DEFAULT '12:00', "timezone" character varying NOT NULL DEFAULT 'Europe/Paris', "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fulfillment_cutoff_configs_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fulfillment_cutoff_configs_organisation_id" ON "fulfillment_cutoff_configs" ("organisation_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_fulfillment_cutoff_configs_societe_id" ON "fulfillment_cutoff_configs" ("societe_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_fulfillment_cutoff_configs_organisation_societe" ON "fulfillment_cutoff_configs" ("organisation_id", "societe_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_fulfillment_cutoff_configs_organisation_societe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fulfillment_cutoff_configs_societe_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fulfillment_cutoff_configs_organisation_id"`);
        await queryRunner.query(`DROP TABLE "fulfillment_cutoff_configs"`);
    }

}
