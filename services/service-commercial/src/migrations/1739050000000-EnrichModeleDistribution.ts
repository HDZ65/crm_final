import { MigrationInterface, QueryRunner, TableColumn, TableIndex, TableForeignKey } from 'typeorm';

export class EnrichModeleDistribution1739050000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add organisation_id (NOT NULL)
    await queryRunner.addColumn(
      'modeledistributions',
      new TableColumn({
        name: 'organisation_id',
        type: 'uuid',
        isNullable: false,
      }),
    );

    // Add partenaire_commercial_id (NULL FK)
    await queryRunner.addColumn(
      'modeledistributions',
      new TableColumn({
        name: 'partenaire_commercial_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add societe_id (NULL FK)
    await queryRunner.addColumn(
      'modeledistributions',
      new TableColumn({
        name: 'societe_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add canal_vente (VARCHAR 50 NULL)
    await queryRunner.addColumn(
      'modeledistributions',
      new TableColumn({
        name: 'canal_vente',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    );

    // Add taux_partage_revenu (DECIMAL 5,2 NULL)
    await queryRunner.addColumn(
      'modeledistributions',
      new TableColumn({
        name: 'taux_partage_revenu',
        type: 'numeric',
        precision: 5,
        scale: 2,
        isNullable: true,
      }),
    );

    // Add taux_commission_partenaire (DECIMAL 5,2 NULL)
    await queryRunner.addColumn(
      'modeledistributions',
      new TableColumn({
        name: 'taux_commission_partenaire',
        type: 'numeric',
        precision: 5,
        scale: 2,
        isNullable: true,
      }),
    );

    // Add regles_partage (JSONB NULL)
    await queryRunner.addColumn(
      'modeledistributions',
      new TableColumn({
        name: 'regles_partage',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    // Add actif (BOOLEAN DEFAULT true)
    await queryRunner.addColumn(
      'modeledistributions',
      new TableColumn({
        name: 'actif',
        type: 'boolean',
        default: true,
      }),
    );

    // Add date_debut (DATE NULL)
    await queryRunner.addColumn(
      'modeledistributions',
      new TableColumn({
        name: 'date_debut',
        type: 'date',
        isNullable: true,
      }),
    );

    // Add date_fin (DATE NULL)
    await queryRunner.addColumn(
      'modeledistributions',
      new TableColumn({
        name: 'date_fin',
        type: 'date',
        isNullable: true,
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'modeledistributions',
      new TableIndex({
        name: 'idx_modele_distribution_organisation_id',
        columnNames: ['organisation_id'],
      }),
    );

    await queryRunner.createIndex(
      'modeledistributions',
      new TableIndex({
        name: 'idx_modele_distribution_partenaire_id',
        columnNames: ['partenaire_commercial_id'],
      }),
    );

    await queryRunner.createIndex(
      'modeledistributions',
      new TableIndex({
        name: 'idx_modele_distribution_societe_id',
        columnNames: ['societe_id'],
      }),
    );

    // Add FK constraints
    await queryRunner.createForeignKey(
      'modeledistributions',
      new TableForeignKey({
        name: 'fk_modele_distribution_partenaire_commercial',
        columnNames: ['partenaire_commercial_id'],
        referencedTableName: 'partenaire_commercial',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'modeledistributions',
      new TableForeignKey({
        name: 'fk_modele_distribution_societe',
        columnNames: ['societe_id'],
        referencedTableName: 'societes',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop FK constraints
    await queryRunner.dropForeignKey(
      'modeledistributions',
      'fk_modele_distribution_societe',
    );

    await queryRunner.dropForeignKey(
      'modeledistributions',
      'fk_modele_distribution_partenaire_commercial',
    );

    // Drop indexes
    await queryRunner.dropIndex(
      'modeledistributions',
      'idx_modele_distribution_societe_id',
    );

    await queryRunner.dropIndex(
      'modeledistributions',
      'idx_modele_distribution_partenaire_id',
    );

    await queryRunner.dropIndex(
      'modeledistributions',
      'idx_modele_distribution_organisation_id',
    );

    // Drop columns in reverse order
    await queryRunner.dropColumn('modeledistributions', 'date_fin');
    await queryRunner.dropColumn('modeledistributions', 'date_debut');
    await queryRunner.dropColumn('modeledistributions', 'actif');
    await queryRunner.dropColumn('modeledistributions', 'regles_partage');
    await queryRunner.dropColumn('modeledistributions', 'taux_commission_partenaire');
    await queryRunner.dropColumn('modeledistributions', 'taux_partage_revenu');
    await queryRunner.dropColumn('modeledistributions', 'canal_vente');
    await queryRunner.dropColumn('modeledistributions', 'societe_id');
    await queryRunner.dropColumn('modeledistributions', 'partenaire_commercial_id');
    await queryRunner.dropColumn('modeledistributions', 'organisation_id');
  }
}
