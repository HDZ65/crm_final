import { MigrationInterface, QueryRunner } from "typeorm";

export class InitCommerciaux1737799000000 implements MigrationInterface {
    name = 'InitCommerciaux1737799000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "baremes_commission" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "code" character varying(50) NOT NULL, "nom" character varying(255) NOT NULL, "description" text, "type_calcul" character varying(20) NOT NULL DEFAULT 'fixe', "base_calcul" character varying(20) NOT NULL DEFAULT 'forfait', "montant_fixe" numeric(10,2), "taux_pourcentage" numeric(5,2), "precomptee" boolean NOT NULL DEFAULT false, "recurrence_active" boolean NOT NULL DEFAULT false, "taux_recurrence" numeric(5,2), "duree_recurrence_mois" integer, "duree_reprises_mois" integer NOT NULL DEFAULT '3', "taux_reprise" numeric(5,2) NOT NULL DEFAULT '100', "type_produit" character varying(50), "profil_remuneration" character varying(50), "societe_id" uuid, "canal_vente" character varying(20), "repartition_commercial" numeric(5,2) NOT NULL DEFAULT '100', "repartition_manager" numeric(5,2) NOT NULL DEFAULT '0', "repartition_agence" numeric(5,2) NOT NULL DEFAULT '0', "repartition_entreprise" numeric(5,2) NOT NULL DEFAULT '0', "version" integer NOT NULL DEFAULT '1', "date_effet" date NOT NULL, "date_fin" date, "actif" boolean NOT NULL DEFAULT true, "cree_par" character varying, "modifie_par" character varying, "motif_modification" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_32d8c4d6dd59af845617f3224e5" UNIQUE ("code"), CONSTRAINT "PK_3c25c6812c15e94ebef4b4c4998" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "paliers_commission" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "bareme_id" uuid NOT NULL, "code" character varying(50) NOT NULL, "nom" character varying(255) NOT NULL, "description" text, "type_palier" character varying(20) NOT NULL DEFAULT 'volume', "seuil_min" numeric(12,2) NOT NULL, "seuil_max" numeric(12,2), "montant_prime" numeric(10,2) NOT NULL, "taux_bonus" numeric(5,2), "cumulable" boolean NOT NULL DEFAULT true, "par_periode" boolean NOT NULL DEFAULT true, "type_produit" character varying(50), "ordre" integer NOT NULL DEFAULT '0', "actif" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_eafbe6742b4a37253ee660cb081" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "apporteurs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" character varying NOT NULL, "utilisateur_id" uuid, "nom" character varying NOT NULL, "prenom" character varying NOT NULL, "type_apporteur" character varying NOT NULL, "email" character varying, "telephone" character varying, "societe_id" uuid, "actif" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3a0c9141a4b9c818d2468e631ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "modeledistributions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "nom" character varying NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_24c8f9924997ef72c5c77e29b66" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "paliers_commission" ADD CONSTRAINT "FK_5c19bf5fb423e7c0660fbac55b0" FOREIGN KEY ("bareme_id") REFERENCES "baremes_commission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "paliers_commission" DROP CONSTRAINT "FK_5c19bf5fb423e7c0660fbac55b0"`);
        await queryRunner.query(`DROP TABLE "modeledistributions"`);
        await queryRunner.query(`DROP TABLE "apporteurs"`);
        await queryRunner.query(`DROP TABLE "paliers_commission"`);
        await queryRunner.query(`DROP TABLE "baremes_commission"`);
    }

}
