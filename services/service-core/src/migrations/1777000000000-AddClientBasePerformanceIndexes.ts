import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientBasePerformanceIndexes1777000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable pg_trgm extension for fuzzy text search
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    // Multi-tenant filtering + status (most common query pattern)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clientbase_org_statut
      ON clientbases (keycloak_group_id, statut)
    `);

    // Trigram index for LIKE %...% search on name
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clientbase_nom_trgm
      ON clientbases USING gin (nom gin_trgm_ops)
    `);

    // Trigram index for phone search
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clientbase_phone_trgm
      ON clientbases USING gin (telephone gin_trgm_ops)
    `);

    // Sorting by creation date (dashboard, recent clients)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clientbase_org_created
      ON clientbases (keycloak_group_id, created_at DESC)
    `);

    // Duplicate detection (phone + name within org)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clientbase_phone_nom_org
      ON clientbases (keycloak_group_id, telephone, nom)
    `);

    // Email search (partial index for non-null emails)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clientbase_email
      ON clientbases (email) WHERE email IS NOT NULL
    `);

    // Partner filtering
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clientbase_partenaire
      ON clientbases (partenaire_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_clientbase_partenaire`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_clientbase_email`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_clientbase_phone_nom_org`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_clientbase_org_created`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_clientbase_phone_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_clientbase_nom_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_clientbase_org_statut`);
  }
}
