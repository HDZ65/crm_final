import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1769426103853 implements MigrationInterface {
    name = 'Init1769426103853'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "evenementsuivis" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "expedition_id" character varying NOT NULL, "code" character varying NOT NULL, "label" character varying NOT NULL, "date_evenement" character varying NOT NULL, "lieu" character varying, "raw" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_daeaa1225468a2a7fc4d4e430f1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_035e05dadd15adab84d54006f9" ON "evenementsuivis" ("expedition_id") `);
        await queryRunner.query(`CREATE TABLE "expeditions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" character varying NOT NULL, "client_base_id" character varying NOT NULL, "contrat_id" uuid, "transporteur_compte_id" character varying NOT NULL, "tracking_number" character varying NOT NULL, "etat" character varying NOT NULL, "date_creation" TIMESTAMP WITH TIME ZONE NOT NULL, "date_dernier_statut" TIMESTAMP WITH TIME ZONE NOT NULL, "label_url" character varying NOT NULL, "reference_commande" character varying NOT NULL, "produit_id" uuid, "nom_produit" character varying, "poids" numeric(10,3), "adresse_destination" character varying, "ville_destination" character varying, "code_postal_destination" character varying, "date_expedition" TIMESTAMP WITH TIME ZONE, "date_livraison_estimee" TIMESTAMP WITH TIME ZONE, "date_livraison" TIMESTAMP WITH TIME ZONE, "lieu_actuel" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fab8971fe361e512664402b2c1e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_63bc208d845a6b133ee2ded00b" ON "expeditions" ("organisation_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a0a0391be0c54edf9c87d69525" ON "expeditions" ("client_base_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a65569932b0eeba5267e7bed0f" ON "expeditions" ("transporteur_compte_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_169fd7cc065794087613fe7b8f" ON "expeditions" ("tracking_number") `);
        await queryRunner.query(`CREATE TABLE "colis" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "expedition_id" character varying NOT NULL, "poids_gr" integer NOT NULL, "long_cm" integer NOT NULL, "larg_cm" integer NOT NULL, "haut_cm" integer NOT NULL, "valeur_declaree" numeric(10,2) NOT NULL, "contenu" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6e648f6420f7e8a6eb80f93e6e7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5ca6c0a7366a57740d686ac9aa" ON "colis" ("expedition_id") `);
        await queryRunner.query(`CREATE TABLE "transporteurorganisations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" character varying NOT NULL, "type" character varying NOT NULL, "contract_number" character varying NOT NULL, "password" character varying NOT NULL, "label_format" character varying NOT NULL, "actif" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_59c1efd483468f8156ce2958391" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6e81f8511d4d644129cd28fe31" ON "transporteurorganisations" ("organisation_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_6e81f8511d4d644129cd28fe31"`);
        await queryRunner.query(`DROP TABLE "transporteurorganisations"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5ca6c0a7366a57740d686ac9aa"`);
        await queryRunner.query(`DROP TABLE "colis"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_169fd7cc065794087613fe7b8f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a65569932b0eeba5267e7bed0f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a0a0391be0c54edf9c87d69525"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_63bc208d845a6b133ee2ded00b"`);
        await queryRunner.query(`DROP TABLE "expeditions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_035e05dadd15adab84d54006f9"`);
        await queryRunner.query(`DROP TABLE "evenementsuivis"`);
    }

}
