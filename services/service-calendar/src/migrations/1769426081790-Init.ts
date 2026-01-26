import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1769426081790 implements MigrationInterface {
    name = 'Init1769426081790'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."holiday_holiday_type_enum" AS ENUM('PUBLIC', 'BANK', 'REGIONAL', 'COMPANY')`);
        await queryRunner.query(`CREATE TABLE "holiday" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "holiday_zone_id" uuid NOT NULL, "date" date NOT NULL, "name" character varying(100) NOT NULL, "holiday_type" "public"."holiday_holiday_type_enum" NOT NULL DEFAULT 'PUBLIC', "is_recurring" boolean NOT NULL DEFAULT false, "recurring_month" integer, "recurring_day" integer, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3e7492c25f80418a7aad0aec053" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_89b26e4ed3db8895b86c8df55e" ON "holiday" ("date") `);
        await queryRunner.query(`CREATE INDEX "IDX_ac56f773c4466bd1cd149b18da" ON "holiday" ("holiday_zone_id", "date") `);
        await queryRunner.query(`CREATE TABLE "holiday_zone" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "code" character varying(20) NOT NULL, "name" character varying(100) NOT NULL, "country_code" character varying(2) NOT NULL, "region_code" character varying(10), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d18faa32e5b670356bd629c86c5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7ecb59193a6d6ee8891788d74c" ON "holiday_zone" ("organisation_id") `);
        await queryRunner.query(`CREATE TYPE "public"."system_debit_configuration_default_mode_enum" AS ENUM('BATCH', 'FIXED_DAY')`);
        await queryRunner.query(`CREATE TYPE "public"."system_debit_configuration_default_batch_enum" AS ENUM('L1', 'L2', 'L3', 'L4')`);
        await queryRunner.query(`CREATE TYPE "public"."system_debit_configuration_shift_strategy_enum" AS ENUM('NEXT_BUSINESS_DAY', 'PREVIOUS_BUSINESS_DAY', 'NEXT_WEEK_SAME_DAY')`);
        await queryRunner.query(`CREATE TABLE "system_debit_configuration" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "default_mode" "public"."system_debit_configuration_default_mode_enum" NOT NULL, "default_batch" "public"."system_debit_configuration_default_batch_enum", "default_fixed_day" integer, "shift_strategy" "public"."system_debit_configuration_shift_strategy_enum" NOT NULL DEFAULT 'NEXT_BUSINESS_DAY', "holiday_zone_id" uuid, "cutoff_config_id" uuid, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8f288bf2c21c0d0af693a0c206c" UNIQUE ("organisation_id"), CONSTRAINT "PK_065ad491e0afd57e566408b29c6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."volume_forecast_batch_enum" AS ENUM('L1', 'L2', 'L3', 'L4')`);
        await queryRunner.query(`CREATE TABLE "volume_forecast" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "societe_id" uuid, "year" integer NOT NULL, "month" integer NOT NULL, "day" integer NOT NULL, "batch" "public"."volume_forecast_batch_enum", "expected_transaction_count" integer NOT NULL DEFAULT '0', "expected_amount_cents" bigint NOT NULL DEFAULT '0', "currency" character varying(3) NOT NULL DEFAULT 'EUR', "actual_transaction_count" integer, "actual_amount_cents" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6742c725da502c2a1db26f25da4" UNIQUE ("organisation_id", "societe_id", "year", "month", "day", "batch"), CONSTRAINT "PK_b0b33c4934b450806cf6c7cebca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fa6bd744d4658271e263ef245a" ON "volume_forecast" ("organisation_id", "year", "month") `);
        await queryRunner.query(`CREATE TABLE "volume_threshold" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "societe_id" uuid, "max_transaction_count" integer, "max_amount_cents" bigint, "currency" character varying(3) NOT NULL DEFAULT 'EUR', "alert_on_exceed" boolean NOT NULL DEFAULT true, "alert_email" character varying(255), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e74c722b24b86fa6845289812a5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_14756a4f3201046e529199d3be" ON "volume_threshold" ("organisation_id") `);
        await queryRunner.query(`CREATE TYPE "public"."planned_debit_status_enum" AS ENUM('PLANNED', 'CONFIRMED', 'PROCESSING', 'EXECUTED', 'FAILED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TYPE "public"."planned_debit_batch_enum" AS ENUM('L1', 'L2', 'L3', 'L4')`);
        await queryRunner.query(`CREATE TABLE "planned_debit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "societe_id" uuid NOT NULL, "client_id" uuid NOT NULL, "contrat_id" uuid NOT NULL, "schedule_id" uuid, "facture_id" uuid, "planned_debit_date" date NOT NULL, "original_target_date" date NOT NULL, "status" "public"."planned_debit_status_enum" NOT NULL DEFAULT 'PLANNED', "batch" "public"."planned_debit_batch_enum", "amount_cents" bigint NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'EUR', "resolved_config" jsonb NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_721587f3ed0142086059e6e212c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d29d9705b4dabc767ddc8be701" ON "planned_debit" ("client_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d55bc8bdf57e96c1a874a13660" ON "planned_debit" ("contrat_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c3477731344a16abefe22e2704" ON "planned_debit" ("organisation_id", "planned_debit_date", "batch") `);
        await queryRunner.query(`CREATE INDEX "IDX_2fa64cf0649202acde3bb3b7fe" ON "planned_debit" ("organisation_id", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_b08c20b2e9b94223a2fc5a73e3" ON "planned_debit" ("organisation_id", "planned_debit_date") `);
        await queryRunner.query(`CREATE TYPE "public"."contract_debit_configuration_mode_enum" AS ENUM('BATCH', 'FIXED_DAY')`);
        await queryRunner.query(`CREATE TYPE "public"."contract_debit_configuration_batch_enum" AS ENUM('L1', 'L2', 'L3', 'L4')`);
        await queryRunner.query(`CREATE TYPE "public"."contract_debit_configuration_shift_strategy_enum" AS ENUM('NEXT_BUSINESS_DAY', 'PREVIOUS_BUSINESS_DAY', 'NEXT_WEEK_SAME_DAY')`);
        await queryRunner.query(`CREATE TABLE "contract_debit_configuration" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "contrat_id" uuid NOT NULL, "mode" "public"."contract_debit_configuration_mode_enum" NOT NULL, "batch" "public"."contract_debit_configuration_batch_enum", "fixed_day" integer, "shift_strategy" "public"."contract_debit_configuration_shift_strategy_enum" NOT NULL DEFAULT 'NEXT_BUSINESS_DAY', "holiday_zone_id" uuid, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_419cae7e152544229c60f3ccedf" UNIQUE ("contrat_id"), CONSTRAINT "PK_0f8d56a72d286ba484d3320c18a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0342761e8477a5f2473108e597" ON "contract_debit_configuration" ("organisation_id") `);
        await queryRunner.query(`CREATE TYPE "public"."company_debit_configuration_mode_enum" AS ENUM('BATCH', 'FIXED_DAY')`);
        await queryRunner.query(`CREATE TYPE "public"."company_debit_configuration_batch_enum" AS ENUM('L1', 'L2', 'L3', 'L4')`);
        await queryRunner.query(`CREATE TYPE "public"."company_debit_configuration_shift_strategy_enum" AS ENUM('NEXT_BUSINESS_DAY', 'PREVIOUS_BUSINESS_DAY', 'NEXT_WEEK_SAME_DAY')`);
        await queryRunner.query(`CREATE TABLE "company_debit_configuration" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "societe_id" uuid NOT NULL, "mode" "public"."company_debit_configuration_mode_enum" NOT NULL, "batch" "public"."company_debit_configuration_batch_enum", "fixed_day" integer, "shift_strategy" "public"."company_debit_configuration_shift_strategy_enum" NOT NULL DEFAULT 'NEXT_BUSINESS_DAY', "holiday_zone_id" uuid, "cutoff_config_id" uuid, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9b71b41ef84d4270f7c2630adcf" UNIQUE ("societe_id"), CONSTRAINT "PK_7537dfaed006b7e7532d82f0d36" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2651f42c35b975e597067a1c55" ON "company_debit_configuration" ("organisation_id") `);
        await queryRunner.query(`CREATE TABLE "cutoff_configuration" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "cutoff_time" TIME NOT NULL, "timezone" character varying(50) NOT NULL DEFAULT 'Europe/Paris', "days_before_value_date" integer NOT NULL DEFAULT '2', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_63016d72c62ea3e2c058ebe7b28" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1f1099f76f179578b2fa6479ab" ON "cutoff_configuration" ("organisation_id") `);
        await queryRunner.query(`CREATE TYPE "public"."client_debit_configuration_mode_enum" AS ENUM('BATCH', 'FIXED_DAY')`);
        await queryRunner.query(`CREATE TYPE "public"."client_debit_configuration_batch_enum" AS ENUM('L1', 'L2', 'L3', 'L4')`);
        await queryRunner.query(`CREATE TYPE "public"."client_debit_configuration_shift_strategy_enum" AS ENUM('NEXT_BUSINESS_DAY', 'PREVIOUS_BUSINESS_DAY', 'NEXT_WEEK_SAME_DAY')`);
        await queryRunner.query(`CREATE TABLE "client_debit_configuration" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "client_id" uuid NOT NULL, "mode" "public"."client_debit_configuration_mode_enum" NOT NULL, "batch" "public"."client_debit_configuration_batch_enum", "fixed_day" integer, "shift_strategy" "public"."client_debit_configuration_shift_strategy_enum" NOT NULL DEFAULT 'NEXT_BUSINESS_DAY', "holiday_zone_id" uuid, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d0864ad72305fffe56497312ab6" UNIQUE ("client_id"), CONSTRAINT "PK_e66e579c4dffb27b4d35ac4aaed" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3902649e4bbf6754507eab4cb1" ON "client_debit_configuration" ("organisation_id") `);
        await queryRunner.query(`CREATE TYPE "public"."calendar_audit_log_source_enum" AS ENUM('UI', 'CSV_IMPORT', 'API', 'SYSTEM')`);
        await queryRunner.query(`CREATE TABLE "calendar_audit_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "entity_type" character varying(50) NOT NULL, "entity_id" uuid NOT NULL, "action" character varying(20) NOT NULL, "actor_user_id" uuid, "source" "public"."calendar_audit_log_source_enum" NOT NULL, "before_state" jsonb, "after_state" jsonb, "change_summary" text, "ip_address" inet, "user_agent" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2bda7a350754631b5e8ada03ea0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_88a043498b12460d2930372122" ON "calendar_audit_log" ("actor_user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_bb3daa711f4bbe693b1900cd1e" ON "calendar_audit_log" ("organisation_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_4016b85a25defcd6eedd95af48" ON "calendar_audit_log" ("organisation_id", "entity_type", "entity_id") `);
        await queryRunner.query(`ALTER TABLE "holiday" ADD CONSTRAINT "FK_9f23c788e2ef5aded4a36dc7518" FOREIGN KEY ("holiday_zone_id") REFERENCES "holiday_zone"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "holiday" DROP CONSTRAINT "FK_9f23c788e2ef5aded4a36dc7518"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4016b85a25defcd6eedd95af48"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bb3daa711f4bbe693b1900cd1e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88a043498b12460d2930372122"`);
        await queryRunner.query(`DROP TABLE "calendar_audit_log"`);
        await queryRunner.query(`DROP TYPE "public"."calendar_audit_log_source_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3902649e4bbf6754507eab4cb1"`);
        await queryRunner.query(`DROP TABLE "client_debit_configuration"`);
        await queryRunner.query(`DROP TYPE "public"."client_debit_configuration_shift_strategy_enum"`);
        await queryRunner.query(`DROP TYPE "public"."client_debit_configuration_batch_enum"`);
        await queryRunner.query(`DROP TYPE "public"."client_debit_configuration_mode_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1f1099f76f179578b2fa6479ab"`);
        await queryRunner.query(`DROP TABLE "cutoff_configuration"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2651f42c35b975e597067a1c55"`);
        await queryRunner.query(`DROP TABLE "company_debit_configuration"`);
        await queryRunner.query(`DROP TYPE "public"."company_debit_configuration_shift_strategy_enum"`);
        await queryRunner.query(`DROP TYPE "public"."company_debit_configuration_batch_enum"`);
        await queryRunner.query(`DROP TYPE "public"."company_debit_configuration_mode_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0342761e8477a5f2473108e597"`);
        await queryRunner.query(`DROP TABLE "contract_debit_configuration"`);
        await queryRunner.query(`DROP TYPE "public"."contract_debit_configuration_shift_strategy_enum"`);
        await queryRunner.query(`DROP TYPE "public"."contract_debit_configuration_batch_enum"`);
        await queryRunner.query(`DROP TYPE "public"."contract_debit_configuration_mode_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b08c20b2e9b94223a2fc5a73e3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2fa64cf0649202acde3bb3b7fe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c3477731344a16abefe22e2704"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d55bc8bdf57e96c1a874a13660"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d29d9705b4dabc767ddc8be701"`);
        await queryRunner.query(`DROP TABLE "planned_debit"`);
        await queryRunner.query(`DROP TYPE "public"."planned_debit_batch_enum"`);
        await queryRunner.query(`DROP TYPE "public"."planned_debit_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_14756a4f3201046e529199d3be"`);
        await queryRunner.query(`DROP TABLE "volume_threshold"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fa6bd744d4658271e263ef245a"`);
        await queryRunner.query(`DROP TABLE "volume_forecast"`);
        await queryRunner.query(`DROP TYPE "public"."volume_forecast_batch_enum"`);
        await queryRunner.query(`DROP TABLE "system_debit_configuration"`);
        await queryRunner.query(`DROP TYPE "public"."system_debit_configuration_shift_strategy_enum"`);
        await queryRunner.query(`DROP TYPE "public"."system_debit_configuration_default_batch_enum"`);
        await queryRunner.query(`DROP TYPE "public"."system_debit_configuration_default_mode_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7ecb59193a6d6ee8891788d74c"`);
        await queryRunner.query(`DROP TABLE "holiday_zone"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ac56f773c4466bd1cd149b18da"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_89b26e4ed3db8895b86c8df55e"`);
        await queryRunner.query(`DROP TABLE "holiday"`);
        await queryRunner.query(`DROP TYPE "public"."holiday_holiday_type_enum"`);
    }

}
