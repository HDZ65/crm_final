import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Ajoute les index de recherche optimisés pour les clients
 *
 * Ces index améliorent considérablement les performances des requêtes CRM courantes:
 * - Recherche par email
 * - Recherche par téléphone
 * - Recherche par nom/prénom (exacte et fuzzy)
 * - Filtrage par statut
 */
export class AddClientSearchIndexes1778100000000 implements MigrationInterface {
  name = 'AddClientSearchIndexes1778100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extension pg_trgm pour la recherche fuzzy (trigram)
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm
    `);

    // Index sur email (insensible à la casse)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_client_email_lower
      ON clientbases (LOWER(email))
      WHERE email IS NOT NULL
    `);

    // Index sur téléphone
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_client_telephone
      ON clientbases (telephone)
      WHERE telephone IS NOT NULL AND telephone != ''
    `);

    // Index composite nom + prénom (recherche exacte)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_client_nom_prenom
      ON clientbases (LOWER(nom), LOWER(prenom))
    `);

    // Index trigram pour recherche fuzzy sur le nom
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_client_nom_trgm
      ON clientbases USING GIN (nom gin_trgm_ops)
    `);

    // Index trigram pour recherche fuzzy sur le prénom
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_client_prenom_trgm
      ON clientbases USING GIN (prenom gin_trgm_ops)
    `);

    // Index composite pour filtrage par partenaire + statut (multi-tenant)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_client_partenaire_statut
      ON clientbases (partenaire_id, statut)
    `);

    // Index pour tri par date de création (listing récent)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_client_partenaire_created
      ON clientbases (partenaire_id, created_at DESC)
    `);

    // Index pour recherche par compte_code (identifiant métier)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_client_compte_code
      ON clientbases (compte_code)
    `);

    // Index pour recherche par date de naissance (conformité, anniversaires)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_client_date_naissance
      ON clientbases (date_naissance)
      WHERE date_naissance IS NOT NULL
    `);

    // Créer une fonction de recherche full-text pour les clients
    await queryRunner.query(`
      ALTER TABLE clientbases ADD COLUMN IF NOT EXISTS search_vector tsvector
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_client_search_vector
      ON clientbases USING GIN(search_vector)
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION client_search_update() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('french', coalesce(NEW.nom, '')), 'A') ||
          setweight(to_tsvector('french', coalesce(NEW.prenom, '')), 'A') ||
          setweight(to_tsvector('simple', coalesce(NEW.email, '')), 'B') ||
          setweight(to_tsvector('simple', coalesce(NEW.telephone, '')), 'B') ||
          setweight(to_tsvector('simple', coalesce(NEW.compte_code, '')), 'C');
        RETURN NEW;
      END $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS client_search_trigger ON clientbases
    `);

    await queryRunner.query(`
      CREATE TRIGGER client_search_trigger
        BEFORE INSERT OR UPDATE ON clientbases
        FOR EACH ROW EXECUTE FUNCTION client_search_update()
    `);

    // Initialiser le search_vector pour les données existantes
    await queryRunner.query(`
      UPDATE clientbases SET nom = nom WHERE search_vector IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS client_search_trigger ON clientbases`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS client_search_update()`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_client_search_vector`);
    await queryRunner.query(`ALTER TABLE clientbases DROP COLUMN IF EXISTS search_vector`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_client_date_naissance`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_client_compte_code`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_client_partenaire_created`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_client_partenaire_statut`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_client_prenom_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_client_nom_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_client_nom_prenom`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_client_telephone`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_client_email_lower`);
  }
}
