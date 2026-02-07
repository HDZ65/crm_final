import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddDepanssurWebhookEventLog1770493000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for webhook event status
    await queryRunner.query(`
      CREATE TYPE "webhook_event_status_enum" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'DUPLICATE')
    `);

    // Create depanssur_webhook_event_log table
    await queryRunner.createTable(
      new Table({
        name: 'depanssur_webhook_event_log',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'event_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'raw_payload',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'signature',
            type: 'varchar',
            length: '512',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'webhook_event_status_enum',
            default: "'RECEIVED'",
            isNullable: false,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'received_at',
            type: 'timestamptz',
            default: 'NOW()',
            isNullable: false,
          },
          {
            name: 'processed_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
    );

    // Unique index on event_id for idempotency
    await queryRunner.createIndex(
      'depanssur_webhook_event_log',
      new TableIndex({
        name: 'idx_depanssur_webhook_event_id',
        columnNames: ['event_id'],
        isUnique: true,
      }),
    );

    // Index on status + received_at for monitoring/cleanup queries
    await queryRunner.createIndex(
      'depanssur_webhook_event_log',
      new TableIndex({
        name: 'idx_depanssur_webhook_status',
        columnNames: ['status', 'received_at'],
      }),
    );

    // Index on event_type for analytics
    await queryRunner.createIndex(
      'depanssur_webhook_event_log',
      new TableIndex({
        name: 'idx_depanssur_webhook_event_type',
        columnNames: ['event_type'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('depanssur_webhook_event_log');
    await queryRunner.query('DROP TYPE IF EXISTS "webhook_event_status_enum"');
  }
}
