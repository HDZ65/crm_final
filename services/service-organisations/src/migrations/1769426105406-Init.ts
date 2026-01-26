import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1769426105406 implements MigrationInterface {
    name = 'Init1769426105406'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "thememarques" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "logo_url" text NOT NULL, "couleur_primaire" character varying(20) NOT NULL, "couleur_secondaire" character varying(20) NOT NULL, "favicon_url" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_68e56e822143502ae632db5e438" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "statutpartenaires" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(50) NOT NULL, "nom" character varying(100) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fac79aa3f822de9958c163e7d3e" UNIQUE ("code"), CONSTRAINT "PK_4564ca356cd21962f3a0d4aea25" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "organisations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nom" character varying(255) NOT NULL, "description" text, "siret" character varying(20), "adresse" text, "telephone" character varying(50), "email" character varying(255), "actif" boolean NOT NULL DEFAULT true, "etat" character varying(50) NOT NULL DEFAULT 'actif', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7bf54cba378d5b2f1d4c10ef4df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "societes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "raison_sociale" character varying(255) NOT NULL, "siren" character varying(20) NOT NULL, "numero_tva" character varying(50) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_921c542107c1bcf5a3d92979ffd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5db0cb771ff3aec0b9aa8fdbde" ON "societes" ("organisation_id") `);
        await queryRunner.query(`CREATE TABLE "rolepartenaires" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(50) NOT NULL, "nom" character varying(100) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c779e2dea76f42fe2226fdc47ed" UNIQUE ("code"), CONSTRAINT "PK_078c517c8966f84ed359d8c2236" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "membrepartenaires" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "utilisateur_id" uuid NOT NULL, "partenaire_marque_blanche_id" uuid NOT NULL, "role_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b5cf300149a9e066e272e6c7dab" UNIQUE ("utilisateur_id", "partenaire_marque_blanche_id"), CONSTRAINT "PK_b2de4ea1c36630b1c6fddb32d92" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "partenairemarqueblanches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "denomination" character varying(255) NOT NULL, "siren" character varying(20) NOT NULL, "numero_tva" character varying(50) NOT NULL, "contact_support_email" character varying(255) NOT NULL, "telephone" character varying(50) NOT NULL, "statut_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e2d1c4f4599f219134173d3ffc3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "invitationorganisations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" character varying NOT NULL, "email_invite" character varying NOT NULL, "role_id" character varying NOT NULL, "token" character varying NOT NULL, "expire_at" TIMESTAMP WITH TIME ZONE NOT NULL, "etat" character varying NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c7b4e1630dadb1c12942958a8fb" UNIQUE ("token"), CONSTRAINT "PK_f3f26cbb350f01338894f1e38d2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "societes" ADD CONSTRAINT "FK_5db0cb771ff3aec0b9aa8fdbded" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "membrepartenaires" ADD CONSTRAINT "FK_a48ac4440ef688968cbd1af2d4a" FOREIGN KEY ("partenaire_marque_blanche_id") REFERENCES "partenairemarqueblanches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "membrepartenaires" ADD CONSTRAINT "FK_711835508b94ae6ccc67ed986db" FOREIGN KEY ("role_id") REFERENCES "rolepartenaires"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "partenairemarqueblanches" ADD CONSTRAINT "FK_2bf5606a862cb48193bd668194e" FOREIGN KEY ("statut_id") REFERENCES "statutpartenaires"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "partenairemarqueblanches" DROP CONSTRAINT "FK_2bf5606a862cb48193bd668194e"`);
        await queryRunner.query(`ALTER TABLE "membrepartenaires" DROP CONSTRAINT "FK_711835508b94ae6ccc67ed986db"`);
        await queryRunner.query(`ALTER TABLE "membrepartenaires" DROP CONSTRAINT "FK_a48ac4440ef688968cbd1af2d4a"`);
        await queryRunner.query(`ALTER TABLE "societes" DROP CONSTRAINT "FK_5db0cb771ff3aec0b9aa8fdbded"`);
        await queryRunner.query(`DROP TABLE "invitationorganisations"`);
        await queryRunner.query(`DROP TABLE "partenairemarqueblanches"`);
        await queryRunner.query(`DROP TABLE "membrepartenaires"`);
        await queryRunner.query(`DROP TABLE "rolepartenaires"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5db0cb771ff3aec0b9aa8fdbde"`);
        await queryRunner.query(`DROP TABLE "societes"`);
        await queryRunner.query(`DROP TABLE "organisations"`);
        await queryRunner.query(`DROP TABLE "statutpartenaires"`);
        await queryRunner.query(`DROP TABLE "thememarques"`);
    }

}
