import { MigrationInterface, QueryRunner } from 'typeorm';

// Deterministic UUIDs for CFAST seed data
export const STATUT_IMPORTEE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
export const EMISSION_CFAST_IMPORT_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

export class SeedCfastData1739203201000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert statut_facture: IMPORTEE
    await queryRunner.query(
      `INSERT INTO statut_facture (id, code, nom, description, ordre_affichage, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        STATUT_IMPORTEE_ID,
        'IMPORTEE',
        'Importée',
        'Facture importée depuis un système externe',
        50,
      ],
    );

    // Insert emission_facture: CFAST_IMPORT
    await queryRunner.query(
      `INSERT INTO emission_facture (id, code, nom, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        EMISSION_CFAST_IMPORT_ID,
        'CFAST_IMPORT',
        'Import CFAST',
        'Facture importée depuis CFAST',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete emission_facture row
    await queryRunner.query(
      `DELETE FROM emission_facture WHERE id = $1`,
      [EMISSION_CFAST_IMPORT_ID],
    );

    // Delete statut_facture row
    await queryRunner.query(
      `DELETE FROM statut_facture WHERE id = $1`,
      [STATUT_IMPORTEE_ID],
    );
  }
}
