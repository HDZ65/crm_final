import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1769426106473 implements MigrationInterface {
    name = 'Init1769426106473'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "gamme" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "nom" character varying(100) NOT NULL, "description" text, "icone" character varying(50), "code" character varying(50) NOT NULL, "ordre" integer NOT NULL DEFAULT '0', "actif" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e7467eac5c1af14b65bcdf94794" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_49ba175b1ac214579efe1918e7" ON "gamme" ("organisation_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_58e9197b0a7a570a6098a725e8" ON "gamme" ("organisation_id", "code") `);
        await queryRunner.query(`CREATE TABLE "grille_tarifaire" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "nom" character varying(100) NOT NULL, "description" text, "date_debut" date, "date_fin" date, "est_par_defaut" boolean NOT NULL DEFAULT false, "actif" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5737f6aa7d9c1eeaa1a26e5e435" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dc5cdb545977f7206d2ef5adad" ON "grille_tarifaire" ("organisation_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f3c752f74b677b7550e755cfd2" ON "grille_tarifaire" ("organisation_id", "est_par_defaut") `);
        await queryRunner.query(`CREATE TABLE "prix_produit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "grille_tarifaire_id" uuid NOT NULL, "produit_id" uuid NOT NULL, "prix_unitaire" numeric(12,2) NOT NULL, "remise_pourcent" numeric(5,2) NOT NULL DEFAULT '0', "prix_minimum" numeric(12,2), "prix_maximum" numeric(12,2), "actif" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a3cb574088610dc4b71c8225288" UNIQUE ("grille_tarifaire_id", "produit_id"), CONSTRAINT "PK_00697118e1ba6a632b8e5e5428e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d8739fb9ea73a5604afd8bcfbf" ON "prix_produit" ("produit_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_262fe5eaf352cb7efc1053d172" ON "prix_produit" ("grille_tarifaire_id") `);
        await queryRunner.query(`CREATE TYPE "public"."produit_categorie_enum" AS ENUM('ASSURANCE', 'PREVOYANCE', 'EPARGNE', 'SERVICE', 'ACCESSOIRE')`);
        await queryRunner.query(`CREATE TYPE "public"."produit_type_enum" AS ENUM('INTERNE', 'PARTENAIRE')`);
        await queryRunner.query(`CREATE TYPE "public"."produit_statut_cycle_enum" AS ENUM('BROUILLON', 'TEST', 'ACTIF', 'GELE', 'RETIRE')`);
        await queryRunner.query(`CREATE TABLE "produit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "gamme_id" uuid, "sku" character varying(50) NOT NULL, "nom" character varying(200) NOT NULL, "description" text, "categorie" "public"."produit_categorie_enum" NOT NULL DEFAULT 'SERVICE', "type" "public"."produit_type_enum" NOT NULL DEFAULT 'INTERNE', "prix" numeric(12,2) NOT NULL DEFAULT '0', "taux_tva" numeric(5,2) NOT NULL DEFAULT '20', "devise" character varying(3) NOT NULL DEFAULT 'EUR', "actif" boolean NOT NULL DEFAULT true, "statut_cycle" "public"."produit_statut_cycle_enum" NOT NULL DEFAULT 'ACTIF', "promotion_active" boolean NOT NULL DEFAULT false, "prix_promotion" numeric(12,2), "date_debut_promotion" TIMESTAMP, "date_fin_promotion" TIMESTAMP, "image_url" text, "code_externe" character varying(100), "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_279f55d8788586d6d2b5bc83c4d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cb371c70f77ac8836a94e0153a" ON "produit" ("organisation_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3247696b351b940f2ff01eea98" ON "produit" ("organisation_id", "sku") `);
        await queryRunner.query(`CREATE TABLE "produit_versions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "produit_id" uuid NOT NULL, "version" integer NOT NULL, "effective_from" TIMESTAMP NOT NULL, "effective_to" TIMESTAMP, "notes" text, "breaking_changes" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_171c27cd2838e0e3d41d11df347" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7872d7e4401e04648c7d65042d" ON "produit_versions" ("produit_id", "version") `);
        await queryRunner.query(`CREATE TYPE "public"."produit_publications_visibilite_enum" AS ENUM('CACHE', 'INTERNE', 'PUBLIC')`);
        await queryRunner.query(`CREATE TABLE "produit_publications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version_produit_id" uuid NOT NULL, "societe_id" uuid NOT NULL, "channels" jsonb NOT NULL, "visibilite" "public"."produit_publications_visibilite_enum" NOT NULL DEFAULT 'INTERNE', "start_at" TIMESTAMP NOT NULL, "end_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4e0bee6ce0d6eb61e49969abc4a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bd306c0cfea8c267f1a3506fba" ON "produit_publications" ("version_produit_id", "societe_id") `);
        await queryRunner.query(`CREATE TYPE "public"."produit_documents_type_enum" AS ENUM('DIPA', 'CG', 'CP', 'TARIF', 'SCRIPT', 'MEDIA')`);
        await queryRunner.query(`CREATE TABLE "produit_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version_produit_id" uuid NOT NULL, "type" "public"."produit_documents_type_enum" NOT NULL, "title" character varying(160) NOT NULL, "file_url" text NOT NULL, "file_hash" character varying(96) NOT NULL, "mandatory" boolean NOT NULL DEFAULT false, "published_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_135f60f292b7ec4bc32c1794f20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2c4edb52858e21bab0e075b4d0" ON "produit_documents" ("version_produit_id", "type") `);
        await queryRunner.query(`ALTER TABLE "prix_produit" ADD CONSTRAINT "FK_d8739fb9ea73a5604afd8bcfbf0" FOREIGN KEY ("produit_id") REFERENCES "produit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "prix_produit" ADD CONSTRAINT "FK_262fe5eaf352cb7efc1053d172e" FOREIGN KEY ("grille_tarifaire_id") REFERENCES "grille_tarifaire"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "produit" ADD CONSTRAINT "FK_0a2d283c86e351f845e0d04b7ed" FOREIGN KEY ("gamme_id") REFERENCES "gamme"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "produit_versions" ADD CONSTRAINT "FK_601048c753b847f3f242ecab8ef" FOREIGN KEY ("produit_id") REFERENCES "produit"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "produit_publications" ADD CONSTRAINT "FK_d1d3a5df5979cacf3d5dd677a26" FOREIGN KEY ("version_produit_id") REFERENCES "produit_versions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "produit_documents" ADD CONSTRAINT "FK_b8d52b1ab9171d21f1b4375d7c8" FOREIGN KEY ("version_produit_id") REFERENCES "produit_versions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "produit_documents" DROP CONSTRAINT "FK_b8d52b1ab9171d21f1b4375d7c8"`);
        await queryRunner.query(`ALTER TABLE "produit_publications" DROP CONSTRAINT "FK_d1d3a5df5979cacf3d5dd677a26"`);
        await queryRunner.query(`ALTER TABLE "produit_versions" DROP CONSTRAINT "FK_601048c753b847f3f242ecab8ef"`);
        await queryRunner.query(`ALTER TABLE "produit" DROP CONSTRAINT "FK_0a2d283c86e351f845e0d04b7ed"`);
        await queryRunner.query(`ALTER TABLE "prix_produit" DROP CONSTRAINT "FK_262fe5eaf352cb7efc1053d172e"`);
        await queryRunner.query(`ALTER TABLE "prix_produit" DROP CONSTRAINT "FK_d8739fb9ea73a5604afd8bcfbf0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2c4edb52858e21bab0e075b4d0"`);
        await queryRunner.query(`DROP TABLE "produit_documents"`);
        await queryRunner.query(`DROP TYPE "public"."produit_documents_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bd306c0cfea8c267f1a3506fba"`);
        await queryRunner.query(`DROP TABLE "produit_publications"`);
        await queryRunner.query(`DROP TYPE "public"."produit_publications_visibilite_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7872d7e4401e04648c7d65042d"`);
        await queryRunner.query(`DROP TABLE "produit_versions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3247696b351b940f2ff01eea98"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cb371c70f77ac8836a94e0153a"`);
        await queryRunner.query(`DROP TABLE "produit"`);
        await queryRunner.query(`DROP TYPE "public"."produit_statut_cycle_enum"`);
        await queryRunner.query(`DROP TYPE "public"."produit_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."produit_categorie_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_262fe5eaf352cb7efc1053d172"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d8739fb9ea73a5604afd8bcfbf"`);
        await queryRunner.query(`DROP TABLE "prix_produit"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f3c752f74b677b7550e755cfd2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dc5cdb545977f7206d2ef5adad"`);
        await queryRunner.query(`DROP TABLE "grille_tarifaire"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_58e9197b0a7a570a6098a725e8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_49ba175b1ac214579efe1918e7"`);
        await queryRunner.query(`DROP TABLE "gamme"`);
    }

}
