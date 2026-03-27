import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeContratStatut1774300000000 implements MigrationInterface {
  name = 'NormalizeContratStatut1774300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Normalize French/English variants to standard codes
    // DRAFT: brouillon, draft, empty string, en_attente, nouveau
    await queryRunner.query(`
      UPDATE contrat SET statut = 'DRAFT' WHERE lower(statut) IN ('brouillon', 'draft', '', 'en_attente', 'nouveau')
    `);

    // ACTIVE: actif, active, en_cours, valide, validé
    await queryRunner.query(`
      UPDATE contrat SET statut = 'ACTIVE' WHERE lower(statut) IN ('actif', 'active', 'en_cours', 'valide', 'validé')
    `);

    // SUSPENDED: suspendu, suspended, pause, bloque, bloqué
    await queryRunner.query(`
      UPDATE contrat SET statut = 'SUSPENDED' WHERE lower(statut) IN ('suspendu', 'suspended', 'pause', 'bloque', 'bloqué')
    `);

    // TERMINATED: résilié, resilie, terminated, annulé, annule, cancelled, canceled
    await queryRunner.query(`
      UPDATE contrat SET statut = 'TERMINATED' WHERE lower(statut) IN ('résilié', 'resilie', 'terminated', 'annulé', 'annule', 'cancelled', 'canceled')
    `);

    // CLOSED: terminé, termine, closed, expiré, expire, cloture, clôturé
    await queryRunner.query(`
      UPDATE contrat SET statut = 'CLOSED' WHERE lower(statut) IN ('terminé', 'termine', 'closed', 'expiré', 'expire', 'cloture', 'clôturé')
    `);

    // Fallback: any remaining non-standard values default to DRAFT
    await queryRunner.query(`
      UPDATE contrat SET statut = 'DRAFT' WHERE statut NOT IN ('DRAFT', 'ACTIVE', 'SUSPENDED', 'TERMINATED', 'CLOSED')
    `);

    // Add CHECK constraint to enforce only valid statut values
    await queryRunner.query(`
      ALTER TABLE contrat ADD CONSTRAINT chk_contrat_statut CHECK (statut IN ('DRAFT', 'ACTIVE', 'SUSPENDED', 'TERMINATED', 'CLOSED'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove CHECK constraint only (data not reverted)
    await queryRunner.query(`
      ALTER TABLE contrat DROP CONSTRAINT IF EXISTS chk_contrat_statut
    `);
  }
}
