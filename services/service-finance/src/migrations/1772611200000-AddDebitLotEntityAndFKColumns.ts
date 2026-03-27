import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddDebitLotEntityAndFKColumns1772611200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'debit_lot',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organisation_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'societe_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'start_day',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'end_day',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'display_order',
            type: 'int',
            default: 0,
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
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'debit_lot',
      new TableIndex({
        name: 'IDX_debit_lot_organisation_societe',
        columnNames: ['organisation_id', 'societe_id'],
      }),
    );

    await queryRunner.createIndex(
      'debit_lot',
      new TableIndex({
        name: 'IDX_debit_lot_organisation_is_active',
        columnNames: ['organisation_id', 'is_active'],
      }),
    );

    await queryRunner.createIndex(
      'debit_lot',
      new TableIndex({
        name: 'UQ_debit_lot_organisation_societe_name',
        columnNames: ['organisation_id', 'societe_id', 'name'],
        isUnique: true,
      }),
    );

    await this.addLotReference(queryRunner, 'planned_debit');
    await this.addLotReference(queryRunner, 'volume_forecast');
    await this.addLotReference(queryRunner, 'system_debit_configuration');
    await this.addLotReference(queryRunner, 'company_debit_configuration');
    await this.addLotReference(queryRunner, 'client_debit_configuration');
    await this.addLotReference(queryRunner, 'contract_debit_configuration');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.removeLotReference(queryRunner, 'contract_debit_configuration');
    await this.removeLotReference(queryRunner, 'client_debit_configuration');
    await this.removeLotReference(queryRunner, 'company_debit_configuration');
    await this.removeLotReference(queryRunner, 'system_debit_configuration');
    await this.removeLotReference(queryRunner, 'volume_forecast');
    await this.removeLotReference(queryRunner, 'planned_debit');

    await queryRunner.dropIndex('debit_lot', 'UQ_debit_lot_organisation_societe_name');
    await queryRunner.dropIndex('debit_lot', 'IDX_debit_lot_organisation_is_active');
    await queryRunner.dropIndex('debit_lot', 'IDX_debit_lot_organisation_societe');
    await queryRunner.dropTable('debit_lot', true);
  }

  private async addLotReference(queryRunner: QueryRunner, tableName: string): Promise<void> {
    await queryRunner.addColumn(
      tableName,
      new TableColumn({
        name: 'lot_id',
        type: 'uuid',
        isNullable: true,
      }),
    );
    await queryRunner.createForeignKey(
      tableName,
      new TableForeignKey({
        name: `FK_${tableName}_lot_id_debit_lot`,
        columnNames: ['lot_id'],
        referencedTableName: 'debit_lot',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  private async removeLotReference(queryRunner: QueryRunner, tableName: string): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.includes('lot_id'));

    if (foreignKey) {
      await queryRunner.dropForeignKey(tableName, foreignKey);
    }

    await queryRunner.dropColumn(tableName, 'lot_id');
  }
}
