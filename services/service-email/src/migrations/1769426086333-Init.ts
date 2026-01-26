import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1769426086333 implements MigrationInterface {
    name = 'Init1769426086333'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."mailboxes_fournisseur_enum" AS ENUM('gmail', 'outlook', 'exchange', 'smtp', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."mailboxes_type_connexion_enum" AS ENUM('oauth2', 'smtp_imap')`);
        await queryRunner.query(`CREATE TABLE "mailboxes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "societe_id" uuid, "user_id" uuid, "nom" character varying(255) NOT NULL, "adresse_email" character varying(255) NOT NULL, "fournisseur" "public"."mailboxes_fournisseur_enum" NOT NULL DEFAULT 'smtp', "type_connexion" "public"."mailboxes_type_connexion_enum" NOT NULL DEFAULT 'smtp_imap', "smtp_host" character varying(255), "smtp_port" integer, "smtp_secure" boolean NOT NULL DEFAULT true, "imap_host" character varying(255), "imap_port" integer, "imap_secure" boolean NOT NULL DEFAULT true, "username" character varying(255), "password" text, "access_token" text, "refresh_token" text, "token_expiry" TIMESTAMP WITH TIME ZONE, "id_token" text, "signature" text, "is_default" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "last_sync_at" TIMESTAMP WITH TIME ZONE, "sync_error" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1471bf7ef6d7f1279fbbdf89a1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_887780c38b8c55dc36d3542de7" ON "mailboxes" ("organisation_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c1f669670cedb8c0398d5f9fe7" ON "mailboxes" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_5d5874b5c7f41a02741e4b3194" ON "mailboxes" ("organisation_id", "societe_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_5d5874b5c7f41a02741e4b3194"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c1f669670cedb8c0398d5f9fe7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_887780c38b8c55dc36d3542de7"`);
        await queryRunner.query(`DROP TABLE "mailboxes"`);
        await queryRunner.query(`DROP TYPE "public"."mailboxes_type_connexion_enum"`);
        await queryRunner.query(`DROP TYPE "public"."mailboxes_fournisseur_enum"`);
    }

}
