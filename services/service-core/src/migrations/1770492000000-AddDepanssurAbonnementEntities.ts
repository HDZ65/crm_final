import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddDepanssurAbonnementEntities1770492000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create abonnement_depanssur table
    await queryRunner.createTable(
      new Table({
        name: 'abonnement_depanssur',
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
            name: 'client_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'plan_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'periodicite',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'periode_attente',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'franchise',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'plafond_par_intervention',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'plafond_annuel',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'nb_interventions_max',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'statut',
            type: 'varchar',
            length: '50',
            default: "'ACTIF'",
            isNullable: false,
          },
          {
            name: 'motif_resiliation',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'date_souscription',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'date_effet',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'date_fin',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'prochaine_echeance',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'prix_ttc',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'taux_tva',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'montant_ht',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'code_remise',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'montant_remise',
            type: 'decimal',
            precision: 12,
            scale: 2,
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
            columnNames: ['client_id'],
            referencedTableName: 'clientbases',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );

    // 2. Create option_abonnement table
    await queryRunner.createTable(
      new Table({
        name: 'option_abonnement',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'abonnement_id',
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
            name: 'label',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'prix_ttc',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'actif',
            type: 'boolean',
            default: true,
            isNullable: false,
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
            columnNames: ['abonnement_id'],
            referencedTableName: 'abonnement_depanssur',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );

    // 3. Create compteur_plafond table
    await queryRunner.createTable(
      new Table({
        name: 'compteur_plafond',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'abonnement_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'annee_glissante_debut',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'annee_glissante_fin',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'nb_interventions_utilisees',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'montant_cumule',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
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
            columnNames: ['abonnement_id'],
            referencedTableName: 'abonnement_depanssur',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );

    // 4. Create historique_statut_abonnement table
    await queryRunner.createTable(
      new Table({
        name: 'historique_statut_abonnement',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'abonnement_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'ancien_statut',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'nouveau_statut',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'motif',
            type: 'varchar',
            length: '500',
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
            columnNames: ['abonnement_id'],
            referencedTableName: 'abonnement_depanssur',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('historique_statut_abonnement');
    await queryRunner.dropTable('compteur_plafond');
    await queryRunner.dropTable('option_abonnement');
    await queryRunner.dropTable('abonnement_depanssur');
  }
}
