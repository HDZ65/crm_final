import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateExportConfigs1774400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for format_defaut
    await queryRunner.query(
      `CREATE TYPE "export_format_default_enum" AS ENUM ('CSV', 'FEC')`,
    );

    await queryRunner.createTable(
      new Table({
        name: 'export_configs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'societe_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'journal_vente_code',
            type: 'varchar',
            length: '10',
            default: "'VT'",
            isNullable: false,
          },
          {
            name: 'journal_reglement_code',
            type: 'varchar',
            length: '10',
            default: "'BAN'",
            isNullable: false,
          },
          {
            name: 'journal_impayes_code',
            type: 'varchar',
            length: '10',
            default: "'IMP'",
            isNullable: false,
          },
          {
            name: 'format_defaut',
            type: 'export_format_default_enum',
            default: "'CSV'",
            isNullable: false,
          },
          {
            name: 'separator',
            type: 'varchar',
            length: '5',
            default: "';'",
            isNullable: false,
          },
          {
            name: 'encoding',
            type: 'varchar',
            length: '20',
            default: "'UTF-8'",
            isNullable: false,
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
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Unique index on societe_id
    await queryRunner.createIndex(
      'export_configs',
      new TableIndex({
        name: 'idx_export_configs_societe_id_unique',
        columnNames: ['societe_id'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'export_configs',
      'idx_export_configs_societe_id_unique',
    );
    await queryRunner.dropTable('export_configs', true);
    await queryRunner.query(`DROP TYPE IF EXISTS "export_format_default_enum"`);
  }
}
