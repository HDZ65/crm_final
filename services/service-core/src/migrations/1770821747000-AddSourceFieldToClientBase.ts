import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSourceFieldToClientBase1770821747000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add source column to clientbases table
    await queryRunner.addColumn(
      'clientbases',
      new TableColumn({
        name: 'source',
        type: 'varchar',
        length: '50',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove source column from clientbases table
    await queryRunner.dropColumn('clientbases', 'source');
  }
}
