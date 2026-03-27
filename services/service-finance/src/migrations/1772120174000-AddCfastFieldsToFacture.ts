import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddCfastFieldsToFacture1772120174000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add source_system column to facture table
    await queryRunner.addColumn(
      'facture',
      new TableColumn({
        name: 'source_system',
        type: 'varchar',
        length: '50',
        default: "'INTERNAL'",
        isNullable: false,
      }),
    );

    // Add external_id column to facture table
    await queryRunner.addColumn(
      'facture',
      new TableColumn({
        name: 'external_id',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: 'External ID from CFAST or other systems for import matching',
      }),
    );

    // Add imported_at column to facture table
    await queryRunner.addColumn(
      'facture',
      new TableColumn({
        name: 'imported_at',
        type: 'timestamptz',
        isNullable: true,
        comment: 'Timestamp when invoice was imported from external system',
      }),
    );

    // Make client_partenaire_id nullable in facture table
    await queryRunner.changeColumn(
      'facture',
      'client_partenaire_id',
      new TableColumn({
        name: 'client_partenaire_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Make adresse_facturation_id nullable in facture table
    await queryRunner.changeColumn(
      'facture',
      'adresse_facturation_id',
      new TableColumn({
        name: 'adresse_facturation_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Make emission_facture_id nullable in facture table
    await queryRunner.changeColumn(
      'facture',
      'emission_facture_id',
      new TableColumn({
        name: 'emission_facture_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Make produit_id nullable in ligne_facture table
    await queryRunner.changeColumn(
      'ligne_facture',
      'produit_id',
      new TableColumn({
        name: 'produit_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Create index on source_system for fast lookup
    await queryRunner.createIndex(
      'facture',
      new TableIndex({
        name: 'idx_facture_source_system',
        columnNames: ['source_system'],
      }),
    );

    // Create partial index on external_id for fast lookup during import
    await queryRunner.createIndex(
      'facture',
      new TableIndex({
        name: 'idx_facture_external_id',
        columnNames: ['external_id'],
        where: 'external_id IS NOT NULL',
      }),
    );

    // Create partial index on imported_at for tracking imported invoices
    await queryRunner.createIndex(
      'facture',
      new TableIndex({
        name: 'idx_facture_imported_at',
        columnNames: ['imported_at'],
        where: 'imported_at IS NOT NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('facture', 'idx_facture_imported_at');
    await queryRunner.dropIndex('facture', 'idx_facture_external_id');
    await queryRunner.dropIndex('facture', 'idx_facture_source_system');

    // Restore produit_id to NOT NULL in ligne_facture table
    await queryRunner.changeColumn(
      'ligne_facture',
      'produit_id',
      new TableColumn({
        name: 'produit_id',
        type: 'uuid',
        isNullable: false,
      }),
    );

    // Restore emission_facture_id to NOT NULL in facture table
    await queryRunner.changeColumn(
      'facture',
      'emission_facture_id',
      new TableColumn({
        name: 'emission_facture_id',
        type: 'uuid',
        isNullable: false,
      }),
    );

    // Restore adresse_facturation_id to NOT NULL in facture table
    await queryRunner.changeColumn(
      'facture',
      'adresse_facturation_id',
      new TableColumn({
        name: 'adresse_facturation_id',
        type: 'uuid',
        isNullable: false,
      }),
    );

    // Restore client_partenaire_id to NOT NULL in facture table
    await queryRunner.changeColumn(
      'facture',
      'client_partenaire_id',
      new TableColumn({
        name: 'client_partenaire_id',
        type: 'uuid',
        isNullable: false,
      }),
    );

    // Drop imported_at column
    await queryRunner.dropColumn('facture', 'imported_at');

    // Drop external_id column
    await queryRunner.dropColumn('facture', 'external_id');

    // Drop source_system column
    await queryRunner.dropColumn('facture', 'source_system');
  }
}
