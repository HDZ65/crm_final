import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAgendaTables1770479817292 implements MigrationInterface {
    name = 'AddAgendaTables1770479817292'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types
        await queryRunner.query(`CREATE TYPE "public"."oauth_connections_provider_enum" AS ENUM('zoom', 'google', 'microsoft')`);
        await queryRunner.query(`CREATE TYPE "public"."oauth_connections_status_enum" AS ENUM('active', 'expired', 'revoked', 'error')`);
        await queryRunner.query(`CREATE TYPE "public"."calendar_events_provider_enum" AS ENUM('zoom', 'google', 'microsoft')`);
        await queryRunner.query(`CREATE TYPE "public"."calendar_events_source_enum" AS ENUM('crm', 'google_calendar', 'outlook', 'zoom', 'google_meet')`);
        await queryRunner.query(`CREATE TYPE "public"."meetings_provider_enum" AS ENUM('zoom', 'google', 'microsoft')`);
        await queryRunner.query(`CREATE TYPE "public"."meetings_summary_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed', 'no_transcript')`);

        // Create oauth_connections table
        await queryRunner.query(`CREATE TABLE "oauth_connections" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "user_id" uuid NOT NULL,
            "organisation_id" uuid NOT NULL,
            "provider" "public"."oauth_connections_provider_enum" NOT NULL,
            "scopes" text,
            "access_token_encrypted" text,
            "refresh_token_encrypted" text,
            "token_expires_at" TIMESTAMP WITH TIME ZONE,
            "status" "public"."oauth_connections_status_enum" NOT NULL DEFAULT 'active',
            "connected_at" TIMESTAMP WITH TIME ZONE,
            "sync_token" text,
            "channel_id" character varying(255),
            "channel_expiration" TIMESTAMP WITH TIME ZONE,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            CONSTRAINT "PK_oauth_connections" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`CREATE INDEX "IDX_oauth_connections_user_id" ON "oauth_connections" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_oauth_connections_organisation_id" ON "oauth_connections" ("organisation_id")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_oauth_connections_user_provider" ON "oauth_connections" ("user_id", "provider")`);

        // Create calendar_events table
        await queryRunner.query(`CREATE TABLE "calendar_events" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "user_id" uuid NOT NULL,
            "organisation_id" uuid NOT NULL,
            "provider" "public"."calendar_events_provider_enum",
            "external_id" character varying(512),
            "title" character varying(500) NOT NULL,
            "description" text,
            "start_time" TIMESTAMP WITH TIME ZONE NOT NULL,
            "end_time" TIMESTAMP WITH TIME ZONE NOT NULL,
            "location" character varying(500),
            "attendees" jsonb,
            "is_all_day" boolean NOT NULL DEFAULT false,
            "source" "public"."calendar_events_source_enum" NOT NULL DEFAULT 'crm',
            "source_url" text,
            "meeting_id" uuid,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            CONSTRAINT "PK_calendar_events" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`CREATE INDEX "IDX_calendar_events_user_id" ON "calendar_events" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_calendar_events_user_org" ON "calendar_events" ("user_id", "organisation_id")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_calendar_events_provider_external" ON "calendar_events" ("provider", "external_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_calendar_events_time_range" ON "calendar_events" ("start_time", "end_time")`);

        // Create meetings table
        await queryRunner.query(`CREATE TABLE "meetings" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "user_id" uuid NOT NULL,
            "organisation_id" uuid NOT NULL,
            "provider" "public"."meetings_provider_enum" NOT NULL,
            "external_meeting_id" character varying(512),
            "title" character varying(500) NOT NULL,
            "start_time" TIMESTAMP WITH TIME ZONE NOT NULL,
            "end_time" TIMESTAMP WITH TIME ZONE,
            "duration_minutes" integer,
            "participants" jsonb,
            "recording_url" text,
            "transcript_url" text,
            "summary_status" "public"."meetings_summary_status_enum" NOT NULL DEFAULT 'pending',
            "calendar_event_id" uuid,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            CONSTRAINT "PK_meetings" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`CREATE INDEX "IDX_meetings_user_id" ON "meetings" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_meetings_user_org" ON "meetings" ("user_id", "organisation_id")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_meetings_provider_external" ON "meetings" ("provider", "external_meeting_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_meetings_time_range" ON "meetings" ("start_time", "end_time")`);

        // Create call_summaries table
        await queryRunner.query(`CREATE TABLE "call_summaries" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "meeting_id" uuid NOT NULL,
            "executive_summary" text,
            "key_points" jsonb,
            "decisions" jsonb,
            "action_items" jsonb,
            "generated_at" TIMESTAMP WITH TIME ZONE,
            "ai_model" character varying(100),
            "raw_ai_response" text,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            CONSTRAINT "PK_call_summaries" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_call_summaries_meeting_id" ON "call_summaries" ("meeting_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order
        await queryRunner.query(`DROP INDEX "public"."IDX_call_summaries_meeting_id"`);
        await queryRunner.query(`DROP TABLE "call_summaries"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_meetings_time_range"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_meetings_provider_external"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_meetings_user_org"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_meetings_user_id"`);
        await queryRunner.query(`DROP TABLE "meetings"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_calendar_events_time_range"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_calendar_events_provider_external"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_calendar_events_user_org"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_calendar_events_user_id"`);
        await queryRunner.query(`DROP TABLE "calendar_events"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_oauth_connections_user_provider"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_oauth_connections_organisation_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_oauth_connections_user_id"`);
        await queryRunner.query(`DROP TABLE "oauth_connections"`);

        // Drop enum types
        await queryRunner.query(`DROP TYPE "public"."meetings_summary_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."meetings_provider_enum"`);
        await queryRunner.query(`DROP TYPE "public"."calendar_events_source_enum"`);
        await queryRunner.query(`DROP TYPE "public"."calendar_events_provider_enum"`);
        await queryRunner.query(`DROP TYPE "public"."oauth_connections_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."oauth_connections_provider_enum"`);
    }
}
