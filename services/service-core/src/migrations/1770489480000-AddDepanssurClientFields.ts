import { MigrationInterface, QueryRunner, TableColumn, Table } from 'typeorm';

export class AddDepanssurClientFields1770489480000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add civilite column to clientbases table
    await queryRunner.addColumn(
      'clientbases',
      new TableColumn({
        name: 'civilite',
        type: 'varchar',
        length: '50',
        isNullable: true,
        default: null,
      }),
    );

    // Add type_adresse column to adresses table
    await queryRunner.addColumn(
      'adresses',
      new TableColumn({
        name: 'type_adresse',
        type: 'varchar',
        length: '50',
        isNullable: true,
        default: "'FACTURATION'",
      }),
    );

    // Create consentements table
    await queryRunner.createTable(
      new Table({
        name: 'consentements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'client_base_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'accorde',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'date_accord',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'date_retrait',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'source',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['client_base_id'],
            referencedTableName: 'clientbases',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop consentements table
    await queryRunner.dropTable('consentements');

    // Remove type_adresse column from adresses table
    await queryRunner.dropColumn('adresses', 'type_adresse');

    // Remove civilite column from clientbases table
    await queryRunner.dropColumn('clientbases', 'civilite');
  }
}
