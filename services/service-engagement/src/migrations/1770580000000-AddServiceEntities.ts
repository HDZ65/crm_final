import { MigrationInterface, QueryRunner } from "typeorm";

export class AddServiceEntities1770580000000 implements MigrationInterface {
    name = 'AddServiceEntities1770580000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types
        await queryRunner.query(`CREATE TYPE "public"."demande_conciergerie_categorie_enum" AS ENUM('administrative', 'technique', 'commerciale', 'juridique', 'financiere', 'autre')`);
        await queryRunner.query(`CREATE TYPE "public"."demande_conciergerie_canal_enum" AS ENUM('email', 'telephone', 'chat', 'portail', 'en_personne')`);
        await queryRunner.query(`CREATE TYPE "public"."demande_conciergerie_priorite_enum" AS ENUM('basse', 'normale', 'haute', 'urgente')`);
        await queryRunner.query(`CREATE TYPE "public"."demande_conciergerie_statut_enum" AS ENUM('nouvelle', 'en_cours', 'en_attente', 'resolue', 'fermee', 'annulee')`);
        await queryRunner.query(`CREATE TYPE "public"."commentaire_demande_type_enum" AS ENUM('interne', 'client', 'systeme')`);
        await queryRunner.query(`CREATE TYPE "public"."cas_juridique_type_enum" AS ENUM('litige', 'contentieux', 'conseil', 'mediation', 'arbitrage', 'autre')`);
        await queryRunner.query(`CREATE TYPE "public"."cas_juridique_statut_enum" AS ENUM('ouvert', 'en_cours', 'en_attente', 'clos_gagne', 'clos_perdu', 'clos_accord', 'annule')`);
        await queryRunner.query(`CREATE TYPE "public"."cas_juridique_priorite_enum" AS ENUM('basse', 'normale', 'haute', 'critique')`);
        await queryRunner.query(`CREATE TYPE "public"."operation_cashback_type_enum" AS ENUM('achat', 'parrainage', 'fidelite', 'promotion', 'autre')`);
        await queryRunner.query(`CREATE TYPE "public"."operation_cashback_statut_enum" AS ENUM('en_attente', 'validee', 'rejetee', 'versee', 'annulee')`);

        // Create demande_conciergerie table
        await queryRunner.query(`CREATE TABLE "demande_conciergerie" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "organisation_id" character varying NOT NULL,
            "client_id" character varying NOT NULL,
            "reference" character varying NOT NULL,
            "objet" character varying NOT NULL,
            "description" text,
            "categorie" "public"."demande_conciergerie_categorie_enum" NOT NULL DEFAULT 'autre',
            "canal" "public"."demande_conciergerie_canal_enum" NOT NULL DEFAULT 'portail',
            "priorite" "public"."demande_conciergerie_priorite_enum" NOT NULL DEFAULT 'normale',
            "statut" "public"."demande_conciergerie_statut_enum" NOT NULL DEFAULT 'nouvelle',
            "assigne_a" character varying,
            "cree_par" character varying,
            "date_limite" TIMESTAMP WITH TIME ZONE,
            "date_resolution" TIMESTAMP WITH TIME ZONE,
            "sla_respected" boolean,
            "satisfaction_score" integer,
            "metadata" jsonb,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_demande_conciergerie_reference" UNIQUE ("reference"),
            CONSTRAINT "PK_demande_conciergerie" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`CREATE INDEX "IDX_demande_conciergerie_organisation_id" ON "demande_conciergerie" ("organisation_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_demande_conciergerie_client_id" ON "demande_conciergerie" ("client_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_demande_conciergerie_statut" ON "demande_conciergerie" ("statut")`);

        // Create commentaire_demande table
        await queryRunner.query(`CREATE TABLE "commentaire_demande" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "demande_id" character varying NOT NULL,
            "auteur_id" character varying NOT NULL,
            "contenu" text NOT NULL,
            "type" "public"."commentaire_demande_type_enum" NOT NULL DEFAULT 'interne',
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            CONSTRAINT "PK_commentaire_demande" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`CREATE INDEX "IDX_commentaire_demande_demande_id" ON "commentaire_demande" ("demande_id")`);

        // Create cas_juridique table
        await queryRunner.query(`CREATE TABLE "cas_juridique" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "organisation_id" character varying NOT NULL,
            "client_id" character varying NOT NULL,
            "reference" character varying NOT NULL,
            "titre" character varying NOT NULL,
            "description" text,
            "type" "public"."cas_juridique_type_enum" NOT NULL DEFAULT 'autre',
            "statut" "public"."cas_juridique_statut_enum" NOT NULL DEFAULT 'ouvert',
            "priorite" "public"."cas_juridique_priorite_enum" NOT NULL DEFAULT 'normale',
            "avocat_id" character varying,
            "assigne_a" character varying,
            "cree_par" character varying,
            "montant_enjeu" numeric(12,2),
            "montant_provision" numeric(12,2),
            "date_ouverture" TIMESTAMP WITH TIME ZONE,
            "date_audience" TIMESTAMP WITH TIME ZONE,
            "date_cloture" TIMESTAMP WITH TIME ZONE,
            "metadata" jsonb,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_cas_juridique_reference" UNIQUE ("reference"),
            CONSTRAINT "PK_cas_juridique" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`CREATE INDEX "IDX_cas_juridique_organisation_id" ON "cas_juridique" ("organisation_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_cas_juridique_client_id" ON "cas_juridique" ("client_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_cas_juridique_statut" ON "cas_juridique" ("statut")`);

        // Create operation_cashback table
        await queryRunner.query(`CREATE TABLE "operation_cashback" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "organisation_id" character varying NOT NULL,
            "client_id" character varying NOT NULL,
            "reference" character varying NOT NULL,
            "type" "public"."operation_cashback_type_enum" NOT NULL DEFAULT 'achat',
            "statut" "public"."operation_cashback_statut_enum" NOT NULL DEFAULT 'en_attente',
            "montant_achat" numeric(12,2) NOT NULL,
            "taux_cashback" numeric(5,2) NOT NULL,
            "montant_cashback" numeric(12,2) NOT NULL,
            "date_achat" TIMESTAMP WITH TIME ZONE,
            "date_validation" TIMESTAMP WITH TIME ZONE,
            "date_versement" TIMESTAMP WITH TIME ZONE,
            "valide_par" character varying,
            "cree_par" character varying,
            "partenaire_id" character varying,
            "description" text,
            "metadata" jsonb,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_operation_cashback_reference" UNIQUE ("reference"),
            CONSTRAINT "PK_operation_cashback" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`CREATE INDEX "IDX_operation_cashback_organisation_id" ON "operation_cashback" ("organisation_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_operation_cashback_client_id" ON "operation_cashback" ("client_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_operation_cashback_statut" ON "operation_cashback" ("statut")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order
        await queryRunner.query(`DROP INDEX "public"."IDX_operation_cashback_statut"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_operation_cashback_client_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_operation_cashback_organisation_id"`);
        await queryRunner.query(`DROP TABLE "operation_cashback"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_cas_juridique_statut"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cas_juridique_client_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cas_juridique_organisation_id"`);
        await queryRunner.query(`DROP TABLE "cas_juridique"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_commentaire_demande_demande_id"`);
        await queryRunner.query(`DROP TABLE "commentaire_demande"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_demande_conciergerie_statut"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_demande_conciergerie_client_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_demande_conciergerie_organisation_id"`);
        await queryRunner.query(`DROP TABLE "demande_conciergerie"`);

        // Drop enum types in reverse order
        await queryRunner.query(`DROP TYPE "public"."operation_cashback_statut_enum"`);
        await queryRunner.query(`DROP TYPE "public"."operation_cashback_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cas_juridique_priorite_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cas_juridique_statut_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cas_juridique_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."commentaire_demande_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."demande_conciergerie_statut_enum"`);
        await queryRunner.query(`DROP TYPE "public"."demande_conciergerie_priorite_enum"`);
        await queryRunner.query(`DROP TYPE "public"."demande_conciergerie_canal_enum"`);
        await queryRunner.query(`DROP TYPE "public"."demande_conciergerie_categorie_enum"`);
    }
}
