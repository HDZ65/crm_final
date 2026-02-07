import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormuleProduit1739040000000 implements MigrationInterface {
  name = 'CreateFormuleProduit1739040000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM types
    await queryRunner.query(`
      CREATE TYPE "franchise_type_enum" AS ENUM ('FIXE', 'POURCENTAGE', 'JOURS')
    `);

    await queryRunner.query(`
      CREATE TYPE "type_ajustement_prix_enum" AS ENUM ('ABSOLU', 'RELATIF')
    `);

    // Create produit_formules table
    await queryRunner.query(`
      CREATE TABLE "produit_formules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "produit_id" uuid NOT NULL,
        "code" varchar(50) NOT NULL,
        "nom" varchar(200) NOT NULL,
        "description" text,
        "ordre" int NOT NULL DEFAULT 0,
        "garanties" jsonb,
        "options" jsonb,
        "franchise_montant" decimal(12,2),
        "franchise_type" "franchise_type_enum",
        "prix_formule" decimal(12,2),
        "type_ajustement_prix" "type_ajustement_prix_enum",
        "actif" boolean NOT NULL DEFAULT true,
        "version_produit_id" uuid,
        "metadata" jsonb,
        "created_by" varchar(255),
        "modified_by" varchar(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_produit_formules" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_produit_formules_produit_code" UNIQUE ("produit_id", "code")
      )
    `);

    // Create index on produit_id
    await queryRunner.query(`
      CREATE INDEX "IDX_produit_formules_produit_id" ON "produit_formules" ("produit_id")
    `);

    // Add FK to produit
    await queryRunner.query(`
      ALTER TABLE "produit_formules"
        ADD CONSTRAINT "FK_produit_formules_produit"
        FOREIGN KEY ("produit_id") REFERENCES "produit"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Add FK to produit_versions (optional)
    await queryRunner.query(`
      ALTER TABLE "produit_formules"
        ADD CONSTRAINT "FK_produit_formules_version"
        FOREIGN KEY ("version_produit_id") REFERENCES "produit_versions"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Add comments for JSONB structure documentation
    await queryRunner.query(`
      COMMENT ON COLUMN "produit_formules"."garanties" IS 'JSON array: [{nom, description, plafond, franchise, actif}]'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "produit_formules"."options" IS 'JSON array: [{nom, prix_supplement, description, obligatoire}]'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop FKs
    await queryRunner.query(`ALTER TABLE "produit_formules" DROP CONSTRAINT "FK_produit_formules_version"`);
    await queryRunner.query(`ALTER TABLE "produit_formules" DROP CONSTRAINT "FK_produit_formules_produit"`);

    // Drop index
    await queryRunner.query(`DROP INDEX "IDX_produit_formules_produit_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "produit_formules"`);

    // Drop ENUMs
    await queryRunner.query(`DROP TYPE "type_ajustement_prix_enum"`);
    await queryRunner.query(`DROP TYPE "franchise_type_enum"`);
  }
}
