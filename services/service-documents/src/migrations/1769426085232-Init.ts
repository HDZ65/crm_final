import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1769426085232 implements MigrationInterface {
    name = 'Init1769426085232'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "piecejointes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nom_fichier" character varying NOT NULL, "url" character varying NOT NULL, "type_mime" character varying, "taille" bigint, "entite_type" character varying, "entite_id" character varying, "date_upload" TIMESTAMP NOT NULL DEFAULT now(), "uploaded_by" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e9cf8edc8a2b48121b367225db4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."boites_mail_fournisseur_enum" AS ENUM('gmail', 'outlook', 'exchange', 'smtp', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."boites_mail_type_connexion_enum" AS ENUM('oauth2', 'smtp_imap')`);
        await queryRunner.query(`CREATE TABLE "boites_mail" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nom" character varying NOT NULL, "adresse_email" character varying NOT NULL, "fournisseur" "public"."boites_mail_fournisseur_enum" NOT NULL DEFAULT 'smtp', "type_connexion" "public"."boites_mail_type_connexion_enum" NOT NULL DEFAULT 'smtp_imap', "serveur_smtp" character varying, "port_smtp" integer, "serveur_imap" character varying, "port_imap" integer, "utilise_ssl" boolean NOT NULL DEFAULT false, "utilise_tls" boolean NOT NULL DEFAULT false, "username" character varying, "mot_de_passe" character varying, "client_id" character varying, "client_secret" character varying, "refresh_token" text, "access_token" text, "token_expiration" TIMESTAMP, "signature_html" text, "signature_texte" text, "est_par_defaut" boolean NOT NULL DEFAULT false, "actif" boolean NOT NULL DEFAULT true, "utilisateur_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d4fec795fae6339f7b6d106b35f" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "boites_mail"`);
        await queryRunner.query(`DROP TYPE "public"."boites_mail_type_connexion_enum"`);
        await queryRunner.query(`DROP TYPE "public"."boites_mail_fournisseur_enum"`);
        await queryRunner.query(`DROP TABLE "piecejointes"`);
    }

}
