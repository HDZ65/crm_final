import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationDeliveryProof1774200000000 implements MigrationInterface {
  name = 'CreateNotificationDeliveryProof1774200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types for delivery channel and status
    await queryRunner.query(
      `CREATE TYPE "public"."notification_delivery_proof_channel_enum" AS ENUM('EMAIL', 'SMS', 'POSTAL')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_delivery_proof_status_enum" AS ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED')`
    );

    // Create notification_delivery_proof table
    await queryRunner.query(`
      CREATE TABLE "notification_delivery_proof" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "notification_id" uuid NULL,
        "channel" "public"."notification_delivery_proof_channel_enum" NOT NULL,
        "delivery_status" "public"."notification_delivery_proof_status_enum" NOT NULL DEFAULT 'PENDING',
        "sent_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "delivered_at" TIMESTAMPTZ NULL,
        "provider_message_id" character varying(500) NULL,
        "provider_response" jsonb NULL,
        "error_message" text NULL,
        "metadata" jsonb NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_delivery_proof" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for common query patterns
    await queryRunner.query(
      `CREATE INDEX "IDX_ndp_notification_id" ON "notification_delivery_proof" ("notification_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ndp_channel" ON "notification_delivery_proof" ("channel")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ndp_delivery_status" ON "notification_delivery_proof" ("delivery_status")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_ndp_delivery_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ndp_channel"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ndp_notification_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "notification_delivery_proof"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."notification_delivery_proof_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notification_delivery_proof_channel_enum"`);
  }
}
