import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateComptesComptables1774500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for compte type
    await queryRunner.query(
      `CREATE TYPE "compte_type_enum" AS ENUM ('DEBIT', 'CREDIT', 'MIXTE')`,
    );

    await queryRunner.createTable(
      new Table({
        name: 'comptes_comptables',
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
            isNullable: true,
          },
          {
            name: 'numero',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'libelle',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'compte_type_enum',
            isNullable: false,
          },
          {
            name: 'journal_type',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'actif',
            type: 'boolean',
            default: true,
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

    // Unique composite index on (societe_id, numero)
    await queryRunner.createIndex(
      'comptes_comptables',
      new TableIndex({
        name: 'idx_comptes_comptables_societe_numero_unique',
        columnNames: ['societe_id', 'numero'],
        isUnique: true,
      }),
    );

    // Index on societe_id for fast lookup
    await queryRunner.createIndex(
      'comptes_comptables',
      new TableIndex({
        name: 'idx_comptes_comptables_societe_id',
        columnNames: ['societe_id'],
      }),
    );

    // Seed 7 standard PCG accounts (global defaults with societe_id = NULL)
    await queryRunner.query(`
      INSERT INTO comptes_comptables (id, societe_id, numero, libelle, type, journal_type, actif)
      VALUES
        (uuid_generate_v4(), NULL, '411000', 'Clients', 'DEBIT', 'VENTES', true),
        (uuid_generate_v4(), NULL, '416000', 'Clients douteux', 'DEBIT', 'IMPAYES', true),
        (uuid_generate_v4(), NULL, '445710', 'TVA collectée', 'CREDIT', 'VENTES', true),
        (uuid_generate_v4(), NULL, '512000', 'Banque', 'DEBIT', 'REGLEMENTS', true),
        (uuid_generate_v4(), NULL, '706000', 'Prestations de services', 'CREDIT', 'VENTES', true),
        (uuid_generate_v4(), NULL, '706100', 'Abonnements', 'CREDIT', 'VENTES', true),
        (uuid_generate_v4(), NULL, '706200', 'Commissions', 'CREDIT', 'VENTES', true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'comptes_comptables',
      'idx_comptes_comptables_societe_id',
    );
    await queryRunner.dropIndex(
      'comptes_comptables',
      'idx_comptes_comptables_societe_numero_unique',
    );
    await queryRunner.dropTable('comptes_comptables', true);
    await queryRunner.query(`DROP TYPE IF EXISTS "compte_type_enum"`);
  }
}
