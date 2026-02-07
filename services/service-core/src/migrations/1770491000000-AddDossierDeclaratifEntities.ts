import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddDossierDeclaratifEntities1770491000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create dossiers_declaratifs table
    await queryRunner.createTable(
      new Table({
        name: 'dossiers_declaratifs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'organisation_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'abonnement_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'client_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'reference_externe',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'date_ouverture',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'statut',
            type: 'varchar',
            length: '100',
            isNullable: false,
            default: "'ENREGISTRE'",
          },
          {
            name: 'adresse_risque_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'montant_estimatif',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'prise_en_charge',
            type: 'boolean',
            isNullable: true,
          },
          {
            name: 'franchise_appliquee',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'reste_a_charge',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'montant_pris_en_charge',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'nps_score',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'nps_commentaire',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'date_cloture',
            type: 'timestamptz',
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
      }),
    );

    // Add foreign keys for dossiers_declaratifs
    await queryRunner.createForeignKey(
      'dossiers_declaratifs',
      new TableForeignKey({
        columnNames: ['abonnement_id'],
        referencedTableName: 'abonnement_depanssur',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'dossiers_declaratifs',
      new TableForeignKey({
        columnNames: ['client_id'],
        referencedTableName: 'clientbases',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'dossiers_declaratifs',
      new TableForeignKey({
        columnNames: ['adresse_risque_id'],
        referencedTableName: 'adresses',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Add index on reference_externe for idempotency lookups
    await queryRunner.createIndex(
      'dossiers_declaratifs',
      new TableIndex({
        name: 'IDX_dossiers_declaratifs_reference_externe',
        columnNames: ['reference_externe'],
        isUnique: true,
      }),
    );

    // Add index for common queries
    await queryRunner.createIndex(
      'dossiers_declaratifs',
      new TableIndex({
        name: 'IDX_dossiers_declaratifs_org_client',
        columnNames: ['organisation_id', 'client_id'],
      }),
    );

    await queryRunner.createIndex(
      'dossiers_declaratifs',
      new TableIndex({
        name: 'IDX_dossiers_declaratifs_abonnement',
        columnNames: ['abonnement_id'],
      }),
    );

    // Create historique_statut_dossier table
    await queryRunner.createTable(
      new Table({
        name: 'historique_statut_dossier',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'dossier_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'ancien_statut',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'nouveau_statut',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'motif',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['dossier_id'],
            referencedTableName: 'dossiers_declaratifs',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );

    // Add index for dossier history lookups
    await queryRunner.createIndex(
      'historique_statut_dossier',
      new TableIndex({
        name: 'IDX_historique_statut_dossier_dossier',
        columnNames: ['dossier_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('historique_statut_dossier');
    await queryRunner.dropTable('dossiers_declaratifs');
  }
}
