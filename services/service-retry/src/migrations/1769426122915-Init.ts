import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1769426122915 implements MigrationInterface {
    name = 'Init1769426122915'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "retry_policy" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "societe_id" uuid, "product_id" uuid, "channel_id" uuid, "name" character varying(100) NOT NULL, "description" character varying(500), "retry_delays_days" jsonb NOT NULL DEFAULT '[5, 10, 20]', "max_attempts" integer NOT NULL DEFAULT '3', "max_total_days" integer NOT NULL DEFAULT '30', "retry_on_am04" boolean NOT NULL DEFAULT true, "retryable_codes" jsonb NOT NULL DEFAULT '[]', "non_retryable_codes" jsonb NOT NULL DEFAULT '[]', "stop_on_payment_settled" boolean NOT NULL DEFAULT true, "stop_on_contract_cancelled" boolean NOT NULL DEFAULT true, "stop_on_mandate_revoked" boolean NOT NULL DEFAULT true, "backoff_strategy" character varying(20) NOT NULL DEFAULT 'FIXED', "is_active" boolean NOT NULL DEFAULT true, "is_default" boolean NOT NULL DEFAULT false, "priority" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_by" uuid, CONSTRAINT "PK_10f8f5649ba57fc7f2f01ce1358" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d2ea54e3df6695b21ea8e4832d" ON "retry_policy" ("organisation_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_92f62c59d71e06ce6d36a6732a" ON "retry_policy" ("organisation_id", "societe_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_3ca8b5cb095f621651c26d1283" ON "retry_policy" ("organisation_id", "is_active") `);
        await queryRunner.query(`CREATE TYPE "public"."retry_job_status_enum" AS ENUM('JOB_PENDING', 'JOB_RUNNING', 'JOB_COMPLETED', 'JOB_FAILED', 'JOB_PARTIAL')`);
        await queryRunner.query(`CREATE TABLE "retry_job" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "target_date" date NOT NULL, "timezone" character varying(50) NOT NULL DEFAULT 'Europe/Paris', "cutoff_time" TIME NOT NULL DEFAULT '10:00:00', "scheduled_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "started_at" TIMESTAMP WITH TIME ZONE, "completed_at" TIMESTAMP WITH TIME ZONE, "status" "public"."retry_job_status_enum" NOT NULL DEFAULT 'JOB_PENDING', "total_attempts" integer NOT NULL DEFAULT '0', "successful_attempts" integer NOT NULL DEFAULT '0', "failed_attempts" integer NOT NULL DEFAULT '0', "skipped_attempts" integer NOT NULL DEFAULT '0', "error_message" text, "failed_schedule_ids" jsonb NOT NULL DEFAULT '[]', "idempotency_key" character varying(255) NOT NULL, "triggered_by" character varying(255) NOT NULL, "is_manual" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4f4fcb16a2c59ccd1aa96eaff6c" UNIQUE ("idempotency_key"), CONSTRAINT "PK_820a11dd9e23d4a948fb2f70d0f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f23f55161df8f50709bbd46160" ON "retry_job" ("organisation_id", "target_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_350b896f5f857402924685001a" ON "retry_job" ("target_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_2e3ea5124680cfb83d3218529b" ON "retry_job" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_b920e3c5f770279cdf7016cfed" ON "retry_job" ("organisation_id") `);
        await queryRunner.query(`CREATE TYPE "public"."retry_attempt_status_enum" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'SUBMITTED', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'SKIPPED')`);
        await queryRunner.query(`CREATE TABLE "retry_attempt" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "retry_schedule_id" uuid NOT NULL, "attempt_number" integer NOT NULL, "planned_date" TIMESTAMP WITH TIME ZONE NOT NULL, "executed_at" TIMESTAMP WITH TIME ZONE, "status" "public"."retry_attempt_status_enum" NOT NULL DEFAULT 'SCHEDULED', "payment_intent_id" uuid, "psp_payment_id" character varying(255), "psp_response" jsonb, "error_code" character varying(50), "error_message" text, "new_rejection_code" character varying(50), "retry_job_id" uuid, "idempotency_key" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_49d00403c5de805072e1cb7320a" UNIQUE ("idempotency_key"), CONSTRAINT "PK_4579be5822b4a87602fc085880d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0730110b612ba9c295ac59826a" ON "retry_attempt" ("planned_date", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_de341932c5077b37300d52e260" ON "retry_attempt" ("status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d174c515570539879c53467b0e" ON "retry_attempt" ("retry_schedule_id", "attempt_number") `);
        await queryRunner.query(`CREATE TABLE "reminder_policy" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "societe_id" uuid, "name" character varying(100) NOT NULL, "description" character varying(500), "trigger_rules" jsonb NOT NULL DEFAULT '[]', "cooldown_hours" integer NOT NULL DEFAULT '24', "max_reminders_per_day" integer NOT NULL DEFAULT '3', "max_reminders_per_week" integer NOT NULL DEFAULT '10', "allowed_start_hour" integer NOT NULL DEFAULT '9', "allowed_end_hour" integer NOT NULL DEFAULT '19', "allowed_days_of_week" jsonb NOT NULL DEFAULT '[1,2,3,4,5]', "respect_opt_out" boolean NOT NULL DEFAULT true, "is_active" boolean NOT NULL DEFAULT true, "is_default" boolean NOT NULL DEFAULT false, "priority" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7e1ad666f2ea8748a7f0f5cfaf3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_941d9628e1174e9f06436d52d0" ON "reminder_policy" ("organisation_id", "is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_a893f770784016ab2931bb31ea" ON "reminder_policy" ("organisation_id") `);
        await queryRunner.query(`CREATE TYPE "public"."reminder_channel_enum" AS ENUM('EMAIL', 'SMS', 'PHONE_CALL', 'PUSH_NOTIFICATION', 'POSTAL_MAIL')`);
        await queryRunner.query(`CREATE TYPE "public"."reminder_trigger_enum" AS ENUM('ON_AM04_RECEIVED', 'BEFORE_RETRY', 'AFTER_RETRY_FAILED', 'AFTER_ALL_RETRIES_EXHAUSTED', 'MANUAL')`);
        await queryRunner.query(`CREATE TYPE "public"."reminder_status_enum" AS ENUM('REMINDER_PENDING', 'REMINDER_SENT', 'REMINDER_DELIVERED', 'REMINDER_FAILED', 'REMINDER_CANCELLED', 'REMINDER_BOUNCED', 'REMINDER_OPENED', 'REMINDER_CLICKED')`);
        await queryRunner.query(`CREATE TABLE "reminder" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "societe_id" uuid NOT NULL, "retry_schedule_id" uuid NOT NULL, "retry_attempt_id" uuid, "client_id" uuid NOT NULL, "reminder_policy_id" uuid NOT NULL, "trigger_rule_id" character varying(255), "channel" "public"."reminder_channel_enum" NOT NULL, "template_id" character varying(255) NOT NULL, "template_variables" jsonb NOT NULL DEFAULT '{}', "trigger" "public"."reminder_trigger_enum" NOT NULL, "planned_at" TIMESTAMP WITH TIME ZONE NOT NULL, "sent_at" TIMESTAMP WITH TIME ZONE, "delivered_at" TIMESTAMP WITH TIME ZONE, "status" "public"."reminder_status_enum" NOT NULL DEFAULT 'REMINDER_PENDING', "provider_name" character varying(50), "provider_message_id" character varying(255), "delivery_status_raw" text, "error_code" character varying(50), "error_message" text, "retry_count" integer NOT NULL DEFAULT '0', "idempotency_key" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0e2fe70609cdfe6f3c3aa4569cc" UNIQUE ("idempotency_key"), CONSTRAINT "PK_9ec029d17cb8dece186b9221ede" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e3e2fadd8d00f08b6d537e2ad6" ON "reminder" ("channel", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_2cc7dfd7d0735668dde56e3434" ON "reminder" ("planned_at", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_3c6376101fe9bf415918f6ebba" ON "reminder" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_fdae639a6cd02eb4c54df16be0" ON "reminder" ("client_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b4ac755dd7d39709bc5bdaad1a" ON "reminder" ("retry_schedule_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a479d2626d8543c7100e28ce6f" ON "reminder" ("organisation_id") `);
        await queryRunner.query(`CREATE TYPE "public"."retry_schedule_eligibility_enum" AS ENUM('ELIGIBLE', 'NOT_ELIGIBLE_REASON_CODE', 'NOT_ELIGIBLE_MAX_ATTEMPTS', 'NOT_ELIGIBLE_PAYMENT_SETTLED', 'NOT_ELIGIBLE_CONTRACT_CANCELLED', 'NOT_ELIGIBLE_MANDATE_REVOKED', 'NOT_ELIGIBLE_CLIENT_BLOCKED', 'NOT_ELIGIBLE_MANUAL_CANCEL')`);
        await queryRunner.query(`CREATE TABLE "retry_schedule" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "societe_id" uuid NOT NULL, "original_payment_id" uuid NOT NULL, "schedule_id" uuid NOT NULL, "facture_id" uuid, "contrat_id" uuid, "client_id" uuid NOT NULL, "rejection_code" character varying(50) NOT NULL, "rejection_raw_code" character varying(50) NOT NULL, "rejection_message" text, "rejection_date" TIMESTAMP WITH TIME ZONE NOT NULL, "retry_policy_id" uuid NOT NULL, "amount_cents" bigint NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'EUR', "eligibility" "public"."retry_schedule_eligibility_enum" NOT NULL DEFAULT 'ELIGIBLE', "eligibility_reason" text, "current_attempt" integer NOT NULL DEFAULT '0', "max_attempts" integer NOT NULL, "next_retry_date" TIMESTAMP WITH TIME ZONE, "is_resolved" boolean NOT NULL DEFAULT false, "resolution_reason" text, "resolved_at" TIMESTAMP WITH TIME ZONE, "idempotency_key" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "UQ_7c10145955dcae2426a76eaaf1e" UNIQUE ("idempotency_key"), CONSTRAINT "PK_d3a8c8a15da6743724378a3e20a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1a15d0d51a555507a8af118954" ON "retry_schedule" ("organisation_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ad644eb5754e9b5eb2d337a0e1" ON "retry_schedule" ("next_retry_date", "is_resolved", "eligibility") `);
        await queryRunner.query(`CREATE INDEX "IDX_4ac6fc9efa738f0911c2cce882" ON "retry_schedule" ("original_payment_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f0c547e690fc809208d4a954cc" ON "retry_schedule" ("contrat_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8973cde716ce3b1a0711d3bfeb" ON "retry_schedule" ("client_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_018e1dca4c88fa9451aa1ae4f5" ON "retry_schedule" ("organisation_id", "societe_id") `);
        await queryRunner.query(`CREATE TYPE "public"."retry_audit_log_actor_type_enum" AS ENUM('SYSTEM', 'USER', 'SCHEDULER', 'WEBHOOK')`);
        await queryRunner.query(`CREATE TABLE "retry_audit_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "entity_type" character varying(50) NOT NULL, "entity_id" uuid NOT NULL, "action" character varying(50) NOT NULL, "old_value" jsonb, "new_value" jsonb NOT NULL, "changed_fields" text, "retry_schedule_id" uuid, "retry_attempt_id" uuid, "reminder_id" uuid, "payment_id" uuid, "actor_type" "public"."retry_audit_log_actor_type_enum" NOT NULL, "actor_id" uuid, "actor_ip" inet, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "metadata" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_ad6e40f0f9092d9892ec3f09b7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_68419d9d74d8ac82e923f1db8a" ON "retry_audit_log" ("actor_type", "actor_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_867b6fb6b1cbba57b254c550c9" ON "retry_audit_log" ("action") `);
        await queryRunner.query(`CREATE INDEX "IDX_e2e767743bddc7dc49f0f57da5" ON "retry_audit_log" ("timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_55f2f03145477a3cbb37863de9" ON "retry_audit_log" ("retry_schedule_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9545a8abd4d3fa8c1a8f5820a0" ON "retry_audit_log" ("entity_type", "entity_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8b1cd26faaf38bb833f2a6cc94" ON "retry_audit_log" ("organisation_id") `);
        await queryRunner.query(`ALTER TABLE "retry_attempt" ADD CONSTRAINT "FK_9a2150b12c7a556b3bad119f283" FOREIGN KEY ("retry_schedule_id") REFERENCES "retry_schedule"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "retry_attempt" ADD CONSTRAINT "FK_5a69248b45392968bb56fb085c1" FOREIGN KEY ("retry_job_id") REFERENCES "retry_job"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reminder" ADD CONSTRAINT "FK_b4ac755dd7d39709bc5bdaad1ab" FOREIGN KEY ("retry_schedule_id") REFERENCES "retry_schedule"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reminder" ADD CONSTRAINT "FK_617bdca304240a937f5c8108b2d" FOREIGN KEY ("retry_attempt_id") REFERENCES "retry_attempt"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reminder" ADD CONSTRAINT "FK_21b7f76621c717d70cde679209b" FOREIGN KEY ("reminder_policy_id") REFERENCES "reminder_policy"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "retry_schedule" ADD CONSTRAINT "FK_d44606f29e1f5bea8ec8f3910c2" FOREIGN KEY ("retry_policy_id") REFERENCES "retry_policy"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "retry_schedule" DROP CONSTRAINT "FK_d44606f29e1f5bea8ec8f3910c2"`);
        await queryRunner.query(`ALTER TABLE "reminder" DROP CONSTRAINT "FK_21b7f76621c717d70cde679209b"`);
        await queryRunner.query(`ALTER TABLE "reminder" DROP CONSTRAINT "FK_617bdca304240a937f5c8108b2d"`);
        await queryRunner.query(`ALTER TABLE "reminder" DROP CONSTRAINT "FK_b4ac755dd7d39709bc5bdaad1ab"`);
        await queryRunner.query(`ALTER TABLE "retry_attempt" DROP CONSTRAINT "FK_5a69248b45392968bb56fb085c1"`);
        await queryRunner.query(`ALTER TABLE "retry_attempt" DROP CONSTRAINT "FK_9a2150b12c7a556b3bad119f283"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8b1cd26faaf38bb833f2a6cc94"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9545a8abd4d3fa8c1a8f5820a0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_55f2f03145477a3cbb37863de9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e2e767743bddc7dc49f0f57da5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_867b6fb6b1cbba57b254c550c9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_68419d9d74d8ac82e923f1db8a"`);
        await queryRunner.query(`DROP TABLE "retry_audit_log"`);
        await queryRunner.query(`DROP TYPE "public"."retry_audit_log_actor_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_018e1dca4c88fa9451aa1ae4f5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8973cde716ce3b1a0711d3bfeb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f0c547e690fc809208d4a954cc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4ac6fc9efa738f0911c2cce882"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ad644eb5754e9b5eb2d337a0e1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1a15d0d51a555507a8af118954"`);
        await queryRunner.query(`DROP TABLE "retry_schedule"`);
        await queryRunner.query(`DROP TYPE "public"."retry_schedule_eligibility_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a479d2626d8543c7100e28ce6f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b4ac755dd7d39709bc5bdaad1a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fdae639a6cd02eb4c54df16be0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3c6376101fe9bf415918f6ebba"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2cc7dfd7d0735668dde56e3434"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e3e2fadd8d00f08b6d537e2ad6"`);
        await queryRunner.query(`DROP TABLE "reminder"`);
        await queryRunner.query(`DROP TYPE "public"."reminder_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."reminder_trigger_enum"`);
        await queryRunner.query(`DROP TYPE "public"."reminder_channel_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a893f770784016ab2931bb31ea"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_941d9628e1174e9f06436d52d0"`);
        await queryRunner.query(`DROP TABLE "reminder_policy"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d174c515570539879c53467b0e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_de341932c5077b37300d52e260"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0730110b612ba9c295ac59826a"`);
        await queryRunner.query(`DROP TABLE "retry_attempt"`);
        await queryRunner.query(`DROP TYPE "public"."retry_attempt_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b920e3c5f770279cdf7016cfed"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2e3ea5124680cfb83d3218529b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_350b896f5f857402924685001a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f23f55161df8f50709bbd46160"`);
        await queryRunner.query(`DROP TABLE "retry_job"`);
        await queryRunner.query(`DROP TYPE "public"."retry_job_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3ca8b5cb095f621651c26d1283"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_92f62c59d71e06ce6d36a6732a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d2ea54e3df6695b21ea8e4832d"`);
        await queryRunner.query(`DROP TABLE "retry_policy"`);
    }

}
