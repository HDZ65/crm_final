import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCataloguePartnerColumns1770797639000 implements MigrationInterface {
  name = 'AddCataloguePartnerColumns1770797639000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 8 new columns for partner catalogue synchronization
    await queryRunner.query(`
      ALTER TABLE "produit"
        ADD COLUMN "popular" BOOLEAN DEFAULT false,
        ADD COLUMN "rating" DECIMAL(3,2) DEFAULT NULL,
        ADD COLUMN "logo_url" TEXT DEFAULT NULL,
        ADD COLUMN "features_data" JSONB DEFAULT NULL,
        ADD COLUMN "formules_data" JSONB DEFAULT NULL,
        ADD COLUMN "categorie_partenaire" VARCHAR(100) DEFAULT NULL,
        ADD COLUMN "source_derniere_modif" VARCHAR(50) DEFAULT NULL,
        ADD COLUMN "fournisseur" VARCHAR(200) DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all 8 columns with IF EXISTS
    await queryRunner.query(`
      ALTER TABLE "produit"
        DROP COLUMN IF EXISTS "fournisseur",
        DROP COLUMN IF EXISTS "source_derniere_modif",
        DROP COLUMN IF EXISTS "categorie_partenaire",
        DROP COLUMN IF EXISTS "formules_data",
        DROP COLUMN IF EXISTS "features_data",
        DROP COLUMN IF EXISTS "logo_url",
        DROP COLUMN IF EXISTS "rating",
        DROP COLUMN IF EXISTS "popular"
    `);
  }
}
