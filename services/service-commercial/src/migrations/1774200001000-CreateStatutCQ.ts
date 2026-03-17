import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStatutCQ1774200001000 implements MigrationInterface {
  name = 'CreateStatutCQ1774200001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE statut_cq (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) NOT NULL UNIQUE,
        nom VARCHAR(100) NOT NULL,
        description TEXT,
        ordre_affichage INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_statut_cq_code ON statut_cq(code)`);

    // Seed default statuses
    await queryRunner.query(`
      INSERT INTO statut_cq (code, nom, description, ordre_affichage)
      VALUES
        ('EN_ATTENTE', 'En attente', 'Contrôle en attente de traitement', 1),
        ('EN_COURS', 'En cours', 'Contrôle en cours de traitement', 2),
        ('VALIDE', 'Validé', 'Contrôle validé avec succès', 3),
        ('REJETE', 'Rejeté', 'Contrôle rejeté', 4),
        ('RETOUR', 'Retour', 'Contrôle en retour pour correction', 5)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_statut_cq_code`);
    await queryRunner.query(`DROP TABLE IF EXISTS statut_cq`);
  }
}
