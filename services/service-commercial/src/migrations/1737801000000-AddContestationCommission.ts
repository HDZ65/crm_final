import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContestationCommission1737801000000 implements MigrationInterface {
  name = 'AddContestationCommission1737801000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO statuts_commission (code, nom, description, ordre_affichage)
      SELECT 'contestee', 'Contestee', 'Commission en cours de contestation', 6
      WHERE NOT EXISTS (
        SELECT 1 FROM statuts_commission WHERE code = 'contestee'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE contestation_statut_enum AS ENUM ('en_cours', 'acceptee', 'rejetee')
    `);

    await queryRunner.query(`
      CREATE TABLE contestations_commission (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        commission_id UUID NOT NULL,
        bordereau_id UUID NOT NULL,
        apporteur_id UUID NOT NULL,
        motif TEXT NOT NULL,
        date_contestation DATE NOT NULL,
        date_limite DATE NOT NULL,
        statut contestation_statut_enum NOT NULL DEFAULT 'en_cours',
        commentaire_resolution TEXT,
        resolu_par VARCHAR(255),
        date_resolution TIMESTAMPTZ,
        ligne_regularisation_id UUID,
        statut_commission_precedent_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_contestation_commission FOREIGN KEY (commission_id) REFERENCES commissions(id),
        CONSTRAINT fk_contestation_bordereau FOREIGN KEY (bordereau_id) REFERENCES bordereaux_commission(id),
        CONSTRAINT fk_contestation_ligne_regularisation FOREIGN KEY (ligne_regularisation_id) REFERENCES lignes_bordereau(id),
        CONSTRAINT fk_contestation_statut_precedent FOREIGN KEY (statut_commission_precedent_id) REFERENCES statuts_commission(id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_contestations_org_statut ON contestations_commission(organisation_id, statut)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_contestations_commission ON contestations_commission(commission_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_contestations_apporteur_date ON contestations_commission(apporteur_id, date_contestation)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_contestations_apporteur_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_contestations_commission`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_contestations_org_statut`);
    await queryRunner.query(`DROP TABLE IF EXISTS contestations_commission`);
    await queryRunner.query(`DROP TYPE IF EXISTS contestation_statut_enum`);
    await queryRunner.query(`DELETE FROM statuts_commission WHERE code = 'contestee'`);
  }
}
