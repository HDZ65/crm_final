import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1769426068073 implements MigrationInterface {
    name = 'Init1769426068073'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "type_activite" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "nom" character varying NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ca813cff03bffe2c16a18e54863" UNIQUE ("code"), CONSTRAINT "PK_21bc3629692428cb721a17dae6c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."tache_type_enum" AS ENUM('relance', 'rappel', 'suivi', 'autre')`);
        await queryRunner.query(`CREATE TYPE "public"."tache_priorite_enum" AS ENUM('basse', 'normale', 'haute', 'urgente')`);
        await queryRunner.query(`CREATE TYPE "public"."tache_statut_enum" AS ENUM('a_faire', 'en_cours', 'terminee', 'annulee')`);
        await queryRunner.query(`CREATE TABLE "tache" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" character varying NOT NULL, "titre" character varying NOT NULL, "description" text, "type" "public"."tache_type_enum" NOT NULL DEFAULT 'autre', "priorite" "public"."tache_priorite_enum" NOT NULL DEFAULT 'normale', "statut" "public"."tache_statut_enum" NOT NULL DEFAULT 'a_faire', "date_echeance" TIMESTAMP, "date_completion" TIMESTAMP, "assigne_a" character varying, "cree_par" character varying, "client_id" character varying, "contrat_id" character varying, "facture_id" character varying, "regle_relance_id" character varying, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b30257544654cce39dd9c49c49c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "evenement_suivi" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "expedition_id" character varying NOT NULL, "code" character varying NOT NULL, "label" character varying NOT NULL, "date_evenement" TIMESTAMP NOT NULL, "lieu" character varying, "raw" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3285dc90ebd2a4bf22bfbae4c14" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "activite" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type_id" uuid NOT NULL, "date_activite" TIMESTAMP NOT NULL, "sujet" character varying NOT NULL, "commentaire" text, "echeance" TIMESTAMP, "client_base_id" character varying, "contrat_id" character varying, "client_partenaire_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c4f04c4217a4a990c0b0a762e61" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "activite" ADD CONSTRAINT "FK_d43b9145f8edbe6948afe470a61" FOREIGN KEY ("type_id") REFERENCES "type_activite"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activite" DROP CONSTRAINT "FK_d43b9145f8edbe6948afe470a61"`);
        await queryRunner.query(`DROP TABLE "activite"`);
        await queryRunner.query(`DROP TABLE "evenement_suivi"`);
        await queryRunner.query(`DROP TABLE "tache"`);
        await queryRunner.query(`DROP TYPE "public"."tache_statut_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tache_priorite_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tache_type_enum"`);
        await queryRunner.query(`DROP TABLE "type_activite"`);
    }

}
