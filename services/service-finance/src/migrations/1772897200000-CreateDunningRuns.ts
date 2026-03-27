import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDunningRuns1772897200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create dunning_runs table
    await queryRunner.createTable(
      new Table({
        name: 'dunning_runs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'abonnement_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'schedule_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'client_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'organisation_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'societe_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'config_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'last_completed_step',
            type: 'int',
            default: '-1',
            isNullable: false,
          },
          {
            name: 'failure_date',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'total_attempts',
            type: 'int',
            default: '0',
            isNullable: false,
          },
          {
            name: 'is_resolved',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'resolution_reason',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create unique index on abonnement_id
    await queryRunner.createIndex(
      'dunning_runs',
      new TableIndex({
        name: 'idx_dunning_runs_abonnement_id_unique',
        columnNames: ['abonnement_id'],
        isUnique: true,
      }),
    );

    // Create index on organisation_id for fast lookup by organisation
    await queryRunner.createIndex(
      'dunning_runs',
      new TableIndex({
        name: 'idx_dunning_runs_organisation_id',
        columnNames: ['organisation_id'],
      }),
    );

    // Create index on is_resolved for finding active dunning runs
    await queryRunner.createIndex(
      'dunning_runs',
      new TableIndex({
        name: 'idx_dunning_runs_is_resolved',
        columnNames: ['is_resolved'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex(
      'dunning_runs',
      'idx_dunning_runs_is_resolved',
    );
    await queryRunner.dropIndex(
      'dunning_runs',
      'idx_dunning_runs_organisation_id',
    );
    await queryRunner.dropIndex(
      'dunning_runs',
      'idx_dunning_runs_abonnement_id_unique',
    );

    // Drop table
    await queryRunner.dropTable('dunning_runs', true);
  }
}
