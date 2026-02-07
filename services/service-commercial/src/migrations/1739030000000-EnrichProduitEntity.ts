import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnrichProduitEntity1739030000000 implements MigrationInterface {
  name = 'EnrichProduitEntity1739030000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create TypeTarification enum
    await queryRunner.query(`
      CREATE TYPE "type_tarification_enum" AS ENUM (
        'FIXE', 'PALIER', 'RECURRENT', 'USAGE', 'BUNDLE', 'NEGOCIE', 'INDEXE'
      )
    `);

    // Contractual terms
    await queryRunner.query(`
      ALTER TABLE "produit"
        ADD COLUMN "duree_engagement_mois" INT NULL,
        ADD COLUMN "frequence_renouvellement" VARCHAR(50) NULL,
        ADD COLUMN "conditions_resiliation" TEXT NULL,
        ADD COLUMN "unite_vente" VARCHAR(50) NOT NULL DEFAULT 'UNITE'
    `);

    // Accounting mapping
    await queryRunner.query(`
      ALTER TABLE "produit"
        ADD COLUMN "code_comptable" VARCHAR(20) NULL,
        ADD COLUMN "compte_produit" VARCHAR(20) NULL,
        ADD COLUMN "journal_vente" VARCHAR(20) NULL
    `);

    // Partner & distribution FK columns
    await queryRunner.query(`
      ALTER TABLE "produit"
        ADD COLUMN "partenaire_commercial_id" UUID NULL,
        ADD COLUMN "modele_distribution_id" UUID NULL
    `);

    // Tarification model
    await queryRunner.query(`
      ALTER TABLE "produit"
        ADD COLUMN "type_tarification" "type_tarification_enum" NOT NULL DEFAULT 'FIXE',
        ADD COLUMN "config_tarification" JSONB NULL
    `);

    // Indexes on FK columns
    await queryRunner.query(`
      CREATE INDEX "IDX_produit_partenaire_commercial_id" ON "produit" ("partenaire_commercial_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_produit_modele_distribution_id" ON "produit" ("modele_distribution_id")
    `);

    // Foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "produit"
        ADD CONSTRAINT "FK_produit_partenaire_commercial"
        FOREIGN KEY ("partenaire_commercial_id")
        REFERENCES "partenaire_commercial" ("id")
        ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "produit"
        ADD CONSTRAINT "FK_produit_modele_distribution"
        FOREIGN KEY ("modele_distribution_id")
        REFERENCES "modeledistributions" ("id")
        ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "produit" DROP CONSTRAINT IF EXISTS "FK_produit_modele_distribution"
    `);
    await queryRunner.query(`
      ALTER TABLE "produit" DROP CONSTRAINT IF EXISTS "FK_produit_partenaire_commercial"
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_produit_modele_distribution_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_produit_partenaire_commercial_id"`);

    // Drop columns in reverse order
    await queryRunner.query(`
      ALTER TABLE "produit"
        DROP COLUMN IF EXISTS "config_tarification",
        DROP COLUMN IF EXISTS "type_tarification",
        DROP COLUMN IF EXISTS "modele_distribution_id",
        DROP COLUMN IF EXISTS "partenaire_commercial_id",
        DROP COLUMN IF EXISTS "journal_vente",
        DROP COLUMN IF EXISTS "compte_produit",
        DROP COLUMN IF EXISTS "code_comptable",
        DROP COLUMN IF EXISTS "unite_vente",
        DROP COLUMN IF EXISTS "conditions_resiliation",
        DROP COLUMN IF EXISTS "frequence_renouvellement",
        DROP COLUMN IF EXISTS "duree_engagement_mois"
    `);

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "type_tarification_enum"`);
  }
}
