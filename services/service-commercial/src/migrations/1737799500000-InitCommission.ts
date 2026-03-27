import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitCommission1737799500000 implements MigrationInterface {
  name = 'InitCommission1737799500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE statut_bordereau_enum AS ENUM ('brouillon', 'valide', 'exporte', 'archive')
    `);

    await queryRunner.query(`
      CREATE TYPE type_ligne_enum AS ENUM ('commission', 'reprise', 'acompte', 'prime', 'regularisation')
    `);

    await queryRunner.query(`
      CREATE TYPE statut_ligne_enum AS ENUM ('selectionnee', 'deselectionnee', 'validee', 'rejetee')
    `);

    await queryRunner.query(`
      CREATE TYPE type_reprise_enum AS ENUM ('resiliation', 'impaye', 'annulation', 'regularisation')
    `);

    await queryRunner.query(`
      CREATE TYPE statut_reprise_enum AS ENUM ('en_attente', 'appliquee', 'annulee')
    `);

    await queryRunner.query(`
      CREATE TABLE statuts_commission (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) NOT NULL UNIQUE,
        nom VARCHAR(100) NOT NULL,
        description TEXT,
        ordre_affichage INTEGER DEFAULT 0
      )
    `);

    await queryRunner.query(`
      INSERT INTO statuts_commission (code, nom, description, ordre_affichage) VALUES
      ('calculee', 'Calculée', 'Commission calculée mais non validée', 1),
      ('validee', 'Validée', 'Commission validée par un responsable', 2),
      ('en_attente_paiement', 'En attente de paiement', 'Commission en attente de paiement', 3),
      ('payee', 'Payée', 'Commission payée', 4),
      ('annulee', 'Annulée', 'Commission annulée', 5)
    `);

    await queryRunner.query(`
      CREATE TABLE commissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        reference VARCHAR(100) NOT NULL UNIQUE,
        apporteur_id UUID NOT NULL,
        contrat_id UUID NOT NULL,
        produit_id UUID,
        compagnie VARCHAR(255) NOT NULL,
        type_base VARCHAR(50) NOT NULL,
        montant_brut DECIMAL(12, 2) NOT NULL,
        montant_reprises DECIMAL(12, 2) DEFAULT 0,
        montant_acomptes DECIMAL(12, 2) DEFAULT 0,
        montant_net_a_payer DECIMAL(12, 2) NOT NULL,
        statut_id UUID NOT NULL REFERENCES statuts_commission(id),
        periode VARCHAR(7) NOT NULL,
        date_creation DATE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_commissions_org_periode ON commissions(organisation_id, periode)`);
    await queryRunner.query(`CREATE INDEX idx_commissions_apporteur_periode ON commissions(apporteur_id, periode)`);
    await queryRunner.query(`CREATE INDEX idx_commissions_org ON commissions(organisation_id)`);
    await queryRunner.query(`CREATE INDEX idx_commissions_apporteur ON commissions(apporteur_id)`);
    await queryRunner.query(`CREATE INDEX idx_commissions_contrat ON commissions(contrat_id)`);

    await queryRunner.query(`
      CREATE TABLE bordereaux_commission (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        reference VARCHAR(100) NOT NULL UNIQUE,
        periode VARCHAR(7) NOT NULL,
        apporteur_id UUID NOT NULL,
        total_brut DECIMAL(12, 2) DEFAULT 0,
        total_reprises DECIMAL(12, 2) DEFAULT 0,
        total_acomptes DECIMAL(12, 2) DEFAULT 0,
        total_net_a_payer DECIMAL(12, 2) DEFAULT 0,
        nombre_lignes INTEGER DEFAULT 0,
        statut_bordereau statut_bordereau_enum DEFAULT 'brouillon',
        date_validation TIMESTAMPTZ,
        validateur_id UUID,
        date_export TIMESTAMPTZ,
        fichier_pdf_url VARCHAR(500),
        fichier_excel_url VARCHAR(500),
        commentaire TEXT,
        cree_par VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_bordereaux_org_periode ON bordereaux_commission(organisation_id, periode)`);
    await queryRunner.query(`CREATE INDEX idx_bordereaux_apporteur_periode ON bordereaux_commission(apporteur_id, periode)`);
    await queryRunner.query(`CREATE INDEX idx_bordereaux_org ON bordereaux_commission(organisation_id)`);
    await queryRunner.query(`CREATE INDEX idx_bordereaux_apporteur ON bordereaux_commission(apporteur_id)`);

    await queryRunner.query(`
      CREATE TABLE lignes_bordereau (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        bordereau_id UUID NOT NULL REFERENCES bordereaux_commission(id),
        commission_id UUID,
        reprise_id UUID,
        type_ligne type_ligne_enum NOT NULL,
        contrat_id UUID NOT NULL,
        contrat_reference VARCHAR(100) NOT NULL,
        client_nom VARCHAR(255),
        produit_nom VARCHAR(255),
        montant_brut DECIMAL(10, 2) NOT NULL,
        montant_reprise DECIMAL(10, 2) DEFAULT 0,
        montant_net DECIMAL(10, 2) NOT NULL,
        base_calcul VARCHAR(50),
        taux_applique DECIMAL(5, 2),
        bareme_id UUID,
        statut_ligne statut_ligne_enum DEFAULT 'selectionnee',
        selectionne BOOLEAN DEFAULT TRUE,
        motif_deselection TEXT,
        validateur_id VARCHAR(255),
        date_validation DATE,
        ordre INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_lignes_bordereau_ordre ON lignes_bordereau(bordereau_id, ordre)`);
    await queryRunner.query(`CREATE INDEX idx_lignes_org ON lignes_bordereau(organisation_id)`);

    await queryRunner.query(`
      CREATE TABLE reprises_commission (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        commission_originale_id UUID NOT NULL,
        contrat_id UUID NOT NULL,
        apporteur_id UUID NOT NULL,
        reference VARCHAR(100) NOT NULL,
        type_reprise type_reprise_enum NOT NULL,
        montant_reprise DECIMAL(10, 2) NOT NULL,
        taux_reprise DECIMAL(5, 2) DEFAULT 100,
        montant_original DECIMAL(10, 2) NOT NULL,
        periode_origine VARCHAR(7) NOT NULL,
        periode_application VARCHAR(7) NOT NULL,
        date_evenement DATE NOT NULL,
        date_limite DATE NOT NULL,
        date_application DATE,
        statut_reprise statut_reprise_enum DEFAULT 'en_attente',
        bordereau_id UUID,
        motif TEXT,
        commentaire TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_reprises_org_statut ON reprises_commission(organisation_id, statut_reprise)`);
    await queryRunner.query(`CREATE INDEX idx_reprises_apporteur_periode ON reprises_commission(apporteur_id, periode_application)`);
    await queryRunner.query(`CREATE INDEX idx_reprises_org ON reprises_commission(organisation_id)`);
    await queryRunner.query(`CREATE INDEX idx_reprises_apporteur ON reprises_commission(apporteur_id)`);
    await queryRunner.query(`CREATE INDEX idx_reprises_commission_originale ON reprises_commission(commission_originale_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_reprises_commission_originale`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_reprises_apporteur`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_reprises_org`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_reprises_apporteur_periode`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_reprises_org_statut`);
    await queryRunner.query(`DROP TABLE IF EXISTS reprises_commission`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_lignes_org`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_lignes_bordereau_ordre`);
    await queryRunner.query(`DROP TABLE IF EXISTS lignes_bordereau`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_bordereaux_apporteur`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_bordereaux_org`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_bordereaux_apporteur_periode`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_bordereaux_org_periode`);
    await queryRunner.query(`DROP TABLE IF EXISTS bordereaux_commission`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_commissions_contrat`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_commissions_apporteur`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_commissions_org`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_commissions_apporteur_periode`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_commissions_org_periode`);
    await queryRunner.query(`DROP TABLE IF EXISTS commissions`);

    await queryRunner.query(`DROP TABLE IF EXISTS statuts_commission`);

    await queryRunner.query(`DROP TYPE IF EXISTS statut_reprise_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS type_reprise_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS statut_ligne_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS type_ligne_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS statut_bordereau_enum`);
  }
}
