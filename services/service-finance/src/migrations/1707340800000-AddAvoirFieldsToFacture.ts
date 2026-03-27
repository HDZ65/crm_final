import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddAvoirFieldsToFacture1707340800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add typeDocument column with default 'FACTURE'
    await queryRunner.addColumn(
      'facture',
      new TableColumn({
        name: 'type_document',
        type: 'varchar',
        length: '20',
        default: "'FACTURE'",
        isNullable: false,
      }),
    );

    // Add factureOrigineId column (nullable FK)
    await queryRunner.addColumn(
      'facture',
      new TableColumn({
        name: 'facture_origine_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add motifAvoir column (nullable)
    await queryRunner.addColumn(
      'facture',
      new TableColumn({
        name: 'motif_avoir',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    );

    // Add foreign key constraint for factureOrigineId (self-reference)
    await queryRunner.createForeignKey(
      'facture',
      new TableForeignKey({
        columnNames: ['facture_origine_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'facture',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    // Create index on typeDocument for filtering
    await queryRunner.query(`CREATE INDEX idx_facture_type_document ON facture(type_document)`);

    // Create index on factureOrigineId for finding avoirs by original facture
    await queryRunner.query(
      `CREATE INDEX idx_facture_origine_id ON facture(facture_origine_id) WHERE facture_origine_id IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_facture_origine_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_facture_type_document`);

    // Drop foreign key
    const table = await queryRunner.getTable('facture');
    const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.includes('facture_origine_id'));
    if (foreignKey) {
      await queryRunner.dropForeignKey('facture', foreignKey);
    }

    // Drop columns
    await queryRunner.dropColumn('facture', 'motif_avoir');
    await queryRunner.dropColumn('facture', 'facture_origine_id');
    await queryRunner.dropColumn('facture', 'type_document');
  }
}
