import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePartenaireCommercial1739020000000 implements MigrationInterface {
  name = 'CreatePartenaireCommercial1739020000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM types
    await queryRunner.query(`
      CREATE TYPE "type_partenaire_enum" AS ENUM (
        'ASSUREUR', 'FAI', 'ENERGIE', 'OTT', 'MARKETPLACE', 'COURTIER', 'FOURNISSEUR', 'AUTRE'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "statut_partenaire_enum" AS ENUM (
        'PROSPECT', 'EN_COURS_INTEGRATION', 'ACTIF', 'SUSPENDU', 'RESILIE'
      )
    `);

    // Create partenaire_commercial table
    await queryRunner.query(`
      CREATE TABLE "partenaire_commercial" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organisation_id" uuid NOT NULL,
        "denomination" varchar(255) NOT NULL,
        "type" "type_partenaire_enum" NOT NULL,
        "siren" varchar(14),
        "siret" varchar(17),
        "numero_tva" varchar(20),
        "adresses" jsonb,
        "iban" varchar(34),
        "bic" varchar(11),
        "code_extranet" varchar(100),
        "api_base_url" varchar(500),
        "api_credentials" jsonb,
        "sla_delai_traitement_heures" int,
        "sla_taux_disponibilite" decimal(5,2),
        "sla_contact_urgence" varchar(255),
        "contacts" jsonb,
        "statut" "statut_partenaire_enum" NOT NULL DEFAULT 'PROSPECT',
        "date_debut_contrat" date,
        "date_fin_contrat" date,
        "notes" text,
        "metadata" jsonb,
        "created_by" varchar(255),
        "modified_by" varchar(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_partenaire_commercial" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_partenaire_commercial_org_denomination" UNIQUE ("organisation_id", "denomination")
      )
    `);

    // Create indexes on partenaire_commercial
    await queryRunner.query(`
      CREATE INDEX "IDX_partenaire_commercial_organisation_id" ON "partenaire_commercial" ("organisation_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_partenaire_commercial_org_type" ON "partenaire_commercial" ("organisation_id", "type")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_partenaire_commercial_org_statut" ON "partenaire_commercial" ("organisation_id", "statut")
    `);

    // Create partenaire_commercial_societes join table
    await queryRunner.query(`
      CREATE TABLE "partenaire_commercial_societes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "partenaire_id" uuid NOT NULL,
        "societe_id" uuid NOT NULL,
        "actif" boolean NOT NULL DEFAULT true,
        "date_activation" TIMESTAMP WITH TIME ZONE,
        "date_desactivation" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_partenaire_commercial_societes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_partenaire_societe" UNIQUE ("partenaire_id", "societe_id"),
        CONSTRAINT "FK_partenaire_commercial_societes_partenaire" FOREIGN KEY ("partenaire_id")
          REFERENCES "partenaire_commercial"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes on join table
    await queryRunner.query(`
      CREATE INDEX "IDX_partenaire_commercial_societes_societe_id" ON "partenaire_commercial_societes" ("societe_id")
    `);

    // Add comment on api_credentials for future encryption
    await queryRunner.query(`
      COMMENT ON COLUMN "partenaire_commercial"."api_credentials" IS 'JSONB - TODO: Encrypt with pgcrypto in future task'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop join table first (has FK)
    await queryRunner.query(`DROP TABLE IF EXISTS "partenaire_commercial_societes"`);

    // Drop main table
    await queryRunner.query(`DROP TABLE IF EXISTS "partenaire_commercial"`);

    // Drop ENUM types
    await queryRunner.query(`DROP TYPE IF EXISTS "statut_partenaire_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "type_partenaire_enum"`);
  }
}
