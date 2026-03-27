import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCatalogueWebhookEvents1770797667000 implements MigrationInterface {
  name = 'CreateCatalogueWebhookEvents1770797667000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE catalogue_webhook_processing_status_enum AS ENUM ('RECEIVED', 'PROCESSING', 'DONE', 'FAILED')
    `);

    await queryRunner.query(`
      CREATE TABLE catalogue_webhook_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        event_id VARCHAR(255) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        api_key_valid BOOLEAN NOT NULL DEFAULT false,
        processing_status catalogue_webhook_processing_status_enum NOT NULL DEFAULT 'RECEIVED',
        error_message TEXT,
        retry_count INT NOT NULL DEFAULT 0,
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_catalogue_webhook_event_unique ON catalogue_webhook_events(event_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_catalogue_webhook_event_org ON catalogue_webhook_events(organisation_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_catalogue_webhook_event_org_status ON catalogue_webhook_events(organisation_id, processing_status)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_catalogue_webhook_event_type_created ON catalogue_webhook_events(event_type, created_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_catalogue_webhook_event_type_created`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_catalogue_webhook_event_org_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_catalogue_webhook_event_org`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_catalogue_webhook_event_unique`);
    await queryRunner.query(`DROP TABLE IF EXISTS catalogue_webhook_events`);
    await queryRunner.query(`DROP TYPE IF EXISTS catalogue_webhook_processing_status_enum`);
  }
}
