import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateInformationPaiementBancaire1739203200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create information_paiement_bancaire table
    await queryRunner.createTable(
      new Table({
        name: 'information_paiement_bancaire',
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
            name: 'client_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'iban',
            type: 'varchar',
            length: '34',
            isNullable: false,
            comment: 'IBAN stored in clear text (no encryption)',
          },
          {
            name: 'bic',
            type: 'varchar',
            length: '11',
            isNullable: false,
            comment: 'BIC stored in clear text (no encryption)',
          },
          {
            name: 'titulaire_compte',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'mandat_sepa_reference',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'date_mandat',
            type: 'timestamp',
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
            name: 'commentaire',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'external_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'External ID from legacy system for import matching',
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

    // Create index on client_id for fast lookup by client
    await queryRunner.createIndex(
      'information_paiement_bancaire',
      new TableIndex({
        name: 'idx_information_paiement_bancaire_client_id',
        columnNames: ['client_id'],
      }),
    );

    // Create index on iban for fast lookup by IBAN
    await queryRunner.createIndex(
      'information_paiement_bancaire',
      new TableIndex({
        name: 'idx_information_paiement_bancaire_iban',
        columnNames: ['iban'],
      }),
    );

    // Create index on external_id for fast lookup during import
    await queryRunner.createIndex(
      'information_paiement_bancaire',
      new TableIndex({
        name: 'idx_information_paiement_bancaire_external_id',
        columnNames: ['external_id'],
        where: 'external_id IS NOT NULL',
      }),
    );

    // Create unique constraint on (organisation_id, external_id) to prevent duplicates
    await queryRunner.createIndex(
      'information_paiement_bancaire',
      new TableIndex({
        name: 'idx_information_paiement_bancaire_org_external_id_unique',
        columnNames: ['organisation_id', 'external_id'],
        isUnique: true,
        where: 'external_id IS NOT NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex(
      'information_paiement_bancaire',
      'idx_information_paiement_bancaire_org_external_id_unique',
    );
    await queryRunner.dropIndex(
      'information_paiement_bancaire',
      'idx_information_paiement_bancaire_external_id',
    );
    await queryRunner.dropIndex(
      'information_paiement_bancaire',
      'idx_information_paiement_bancaire_iban',
    );
    await queryRunner.dropIndex(
      'information_paiement_bancaire',
      'idx_information_paiement_bancaire_client_id',
    );

    // Drop table
    await queryRunner.dropTable('information_paiement_bancaire', true);
  }
}
