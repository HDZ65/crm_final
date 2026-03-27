import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitControleQualite1774100000000 implements MigrationInterface {
  name = 'InitControleQualite1774100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE statut_cq_enum AS ENUM ('EN_ATTENTE', 'EN_COURS', 'VALIDE', 'REJETE', 'RETOUR')
    `);

    await queryRunner.query(`
      CREATE TYPE type_critere_enum AS ENUM ('DOCUMENT', 'SIGNATURE', 'PAIEMENT', 'CONFORMITE', 'CUSTOM')
    `);

    await queryRunner.query(`
      CREATE TABLE controles_qualite (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id VARCHAR(255) NOT NULL,
        contrat_id VARCHAR(255) NOT NULL,
        statut statut_cq_enum NOT NULL DEFAULT 'EN_ATTENTE',
        validateur_id VARCHAR(255),
        score DECIMAL(5, 2),
        date_soumission TIMESTAMP NOT NULL DEFAULT NOW(),
        date_validation TIMESTAMP,
        motif_rejet TEXT,
        commentaire TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_controles_qualite_organisation_id ON controles_qualite(organisation_id)`);
    await queryRunner.query(`CREATE INDEX idx_controles_qualite_contrat_id ON controles_qualite(contrat_id)`);
    await queryRunner.query(`CREATE INDEX idx_controles_qualite_statut ON controles_qualite(statut)`);

    await queryRunner.query(`
      CREATE TABLE criteres_cq (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id VARCHAR(255) NOT NULL,
        code VARCHAR(255) NOT NULL,
        nom VARCHAR(255) NOT NULL,
        description TEXT,
        type_critere type_critere_enum NOT NULL,
        obligatoire BOOLEAN NOT NULL DEFAULT true,
        actif BOOLEAN NOT NULL DEFAULT true,
        ordre INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(organisation_id, code)
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_criteres_cq_organisation_id ON criteres_cq(organisation_id)`);

    await queryRunner.query(`
      CREATE TABLE resultats_criteres (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        controle_qualite_id VARCHAR(255) NOT NULL REFERENCES controles_qualite(id),
        critere_id VARCHAR(255) NOT NULL REFERENCES criteres_cq(id),
        conforme BOOLEAN,
        commentaire TEXT,
        verifie_par VARCHAR(255),
        date_verification TIMESTAMP
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_resultats_criteres_controle_qualite_id ON resultats_criteres(controle_qualite_id)`);
    await queryRunner.query(`CREATE INDEX idx_resultats_criteres_critere_id ON resultats_criteres(critere_id)`);

    await queryRunner.query(`
      CREATE TABLE regles_cq (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id VARCHAR(255) NOT NULL,
        type_produit VARCHAR(255) NOT NULL,
        score_minimum DECIMAL(5, 2) NOT NULL DEFAULT 80,
        auto_validation BOOLEAN NOT NULL DEFAULT false,
        actif BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_regles_cq_organisation_id ON regles_cq(organisation_id)`);

    await queryRunner.query(`
      CREATE TABLE regles_cq_criteres (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        regle_id VARCHAR(255) NOT NULL REFERENCES regles_cq(id),
        critere_id VARCHAR(255) NOT NULL REFERENCES criteres_cq(id)
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_regles_cq_criteres_regle_id ON regles_cq_criteres(regle_id)`);
    await queryRunner.query(`CREATE INDEX idx_regles_cq_criteres_critere_id ON regles_cq_criteres(critere_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_regles_cq_criteres_critere_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_regles_cq_criteres_regle_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS regles_cq_criteres`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_regles_cq_organisation_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS regles_cq`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_resultats_criteres_critere_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_resultats_criteres_controle_qualite_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS resultats_criteres`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_criteres_cq_organisation_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS criteres_cq`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_controles_qualite_statut`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_controles_qualite_contrat_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_controles_qualite_organisation_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS controles_qualite`);

    await queryRunner.query(`DROP TYPE IF EXISTS type_critere_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS statut_cq_enum`);
  }
}
