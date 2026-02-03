import { MigrationInterface, QueryRunner } from "typeorm";

export class InitIdentity1769426200000 implements MigrationInterface {
    name = 'InitIdentity1769426200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Users tables (from service-users)
        await queryRunner.query(`CREATE TABLE "utilisateurs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "keycloak_id" character varying(255) NOT NULL, "nom" character varying(100) NOT NULL, "prenom" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "telephone" character varying(50), "actif" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_dd8cd9d9b0f5e7f083663e71b9b" UNIQUE ("keycloak_id"), CONSTRAINT "UQ_6b14325a486fe68d16aa889e4dc" UNIQUE ("email"), CONSTRAINT "PK_d3c39b551c51a0bdc76e07b9197" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dd8cd9d9b0f5e7f083663e71b9" ON "utilisateurs" ("keycloak_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6b14325a486fe68d16aa889e4d" ON "utilisateurs" ("email") `);
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(50) NOT NULL, "nom" character varying(100) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f6d54f95c31b73fb1bdd8e91d0c" UNIQUE ("code"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(100) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8dad765629e83229da6feda1c1d" UNIQUE ("code"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rolepermissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role_id" uuid NOT NULL, "permission_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_3bbfa30af4ecdb0bb10baa75f5c" UNIQUE ("role_id", "permission_id"), CONSTRAINT "PK_7513e607f47d8b9b7b095586179" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "membreorganisations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "utilisateur_id" uuid NOT NULL, "role_id" uuid NOT NULL, "etat" character varying(50) NOT NULL DEFAULT 'actif', "date_invitation" TIMESTAMP, "date_activation" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ea864276c11f564c9920509606b" UNIQUE ("organisation_id", "utilisateur_id"), CONSTRAINT "PK_10d361504897b1422cdd8c6e7a0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "comptes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nom" character varying(255) NOT NULL, "etat" character varying(50) NOT NULL DEFAULT 'actif', "date_creation" TIMESTAMP NOT NULL DEFAULT now(), "created_by_user_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f1e9bf900b9220f91b487aeeefd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "invitationorganisations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "email_invite" character varying(255) NOT NULL, "role_id" uuid NOT NULL, "token" character varying(255) NOT NULL, "expire_at" TIMESTAMP NOT NULL, "etat" character varying(50) NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c7b4e1630dadb1c12942958a8fb" UNIQUE ("token"), CONSTRAINT "PK_f3f26cbb350f01338894f1e38d2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c7b4e1630dadb1c12942958a8f" ON "invitationorganisations" ("token") `);

        // Organisations tables (from service-organisations)
        await queryRunner.query(`CREATE TABLE "thememarques" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "logo_url" text NOT NULL, "couleur_primaire" character varying(20) NOT NULL, "couleur_secondaire" character varying(20) NOT NULL, "favicon_url" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_68e56e822143502ae632db5e438" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "statutpartenaires" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(50) NOT NULL, "nom" character varying(100) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fac79aa3f822de9958c163e7d3e" UNIQUE ("code"), CONSTRAINT "PK_4564ca356cd21962f3a0d4aea25" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "organisations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nom" character varying(255) NOT NULL, "description" text, "siret" character varying(20), "adresse" text, "telephone" character varying(50), "email" character varying(255), "actif" boolean NOT NULL DEFAULT true, "etat" character varying(50) NOT NULL DEFAULT 'actif', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7bf54cba378d5b2f1d4c10ef4df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "societes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "raison_sociale" character varying(255) NOT NULL, "siren" character varying(20) NOT NULL, "numero_tva" character varying(50) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_921c542107c1bcf5a3d92979ffd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5db0cb771ff3aec0b9aa8fdbde" ON "societes" ("organisation_id") `);
        await queryRunner.query(`CREATE TABLE "rolepartenaires" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(50) NOT NULL, "nom" character varying(100) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c779e2dea76f42fe2226fdc47ed" UNIQUE ("code"), CONSTRAINT "PK_078c517c8966f84ed359d8c2236" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "membrepartenaires" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "utilisateur_id" uuid NOT NULL, "partenaire_marque_blanche_id" uuid NOT NULL, "role_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b5cf300149a9e066e272e6c7dab" UNIQUE ("utilisateur_id", "partenaire_marque_blanche_id"), CONSTRAINT "PK_b2de4ea1c36630b1c6fddb32d92" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "partenairemarqueblanches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "denomination" character varying(255) NOT NULL, "siren" character varying(20) NOT NULL, "numero_tva" character varying(50) NOT NULL, "contact_support_email" character varying(255) NOT NULL, "telephone" character varying(50) NOT NULL, "statut_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e2d1c4f4599f219134173d3ffc3" PRIMARY KEY ("id"))`);

        // Foreign keys for users tables
        await queryRunner.query(`ALTER TABLE "rolepermissions" ADD CONSTRAINT "FK_fa1f534ccf664d0de263bc2e1fd" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rolepermissions" ADD CONSTRAINT "FK_9c252b5dcf64bd27984f53b2beb" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "membreorganisations" ADD CONSTRAINT "FK_011e4e19667c4cd400dd41a411e" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "membreorganisations" ADD CONSTRAINT "FK_bc05c900a08d65f0fab37e85763" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invitationorganisations" ADD CONSTRAINT "FK_ee52095c0a2bf566bb4c5b8d9cd" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Foreign keys for organisations tables
        await queryRunner.query(`ALTER TABLE "societes" ADD CONSTRAINT "FK_5db0cb771ff3aec0b9aa8fdbded" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "membrepartenaires" ADD CONSTRAINT "FK_a48ac4440ef688968cbd1af2d4a" FOREIGN KEY ("partenaire_marque_blanche_id") REFERENCES "partenairemarqueblanches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "membrepartenaires" ADD CONSTRAINT "FK_711835508b94ae6ccc67ed986db" FOREIGN KEY ("role_id") REFERENCES "rolepartenaires"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "partenairemarqueblanches" ADD CONSTRAINT "FK_2bf5606a862cb48193bd668194e" FOREIGN KEY ("statut_id") REFERENCES "statutpartenaires"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys for organisations tables
        await queryRunner.query(`ALTER TABLE "partenairemarqueblanches" DROP CONSTRAINT "FK_2bf5606a862cb48193bd668194e"`);
        await queryRunner.query(`ALTER TABLE "membrepartenaires" DROP CONSTRAINT "FK_711835508b94ae6ccc67ed986db"`);
        await queryRunner.query(`ALTER TABLE "membrepartenaires" DROP CONSTRAINT "FK_a48ac4440ef688968cbd1af2d4a"`);
        await queryRunner.query(`ALTER TABLE "societes" DROP CONSTRAINT "FK_5db0cb771ff3aec0b9aa8fdbded"`);

        // Drop foreign keys for users tables
        await queryRunner.query(`ALTER TABLE "invitationorganisations" DROP CONSTRAINT "FK_ee52095c0a2bf566bb4c5b8d9cd"`);
        await queryRunner.query(`ALTER TABLE "membreorganisations" DROP CONSTRAINT "FK_bc05c900a08d65f0fab37e85763"`);
        await queryRunner.query(`ALTER TABLE "membreorganisations" DROP CONSTRAINT "FK_011e4e19667c4cd400dd41a411e"`);
        await queryRunner.query(`ALTER TABLE "rolepermissions" DROP CONSTRAINT "FK_9c252b5dcf64bd27984f53b2beb"`);
        await queryRunner.query(`ALTER TABLE "rolepermissions" DROP CONSTRAINT "FK_fa1f534ccf664d0de263bc2e1fd"`);

        // Drop organisations tables
        await queryRunner.query(`DROP TABLE "partenairemarqueblanches"`);
        await queryRunner.query(`DROP TABLE "membrepartenaires"`);
        await queryRunner.query(`DROP TABLE "rolepartenaires"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5db0cb771ff3aec0b9aa8fdbde"`);
        await queryRunner.query(`DROP TABLE "societes"`);
        await queryRunner.query(`DROP TABLE "organisations"`);
        await queryRunner.query(`DROP TABLE "statutpartenaires"`);
        await queryRunner.query(`DROP TABLE "thememarques"`);

        // Drop users tables
        await queryRunner.query(`DROP INDEX "public"."IDX_c7b4e1630dadb1c12942958a8f"`);
        await queryRunner.query(`DROP TABLE "invitationorganisations"`);
        await queryRunner.query(`DROP TABLE "comptes"`);
        await queryRunner.query(`DROP TABLE "membreorganisations"`);
        await queryRunner.query(`DROP TABLE "rolepermissions"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6b14325a486fe68d16aa889e4d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dd8cd9d9b0f5e7f083663e71b9"`);
        await queryRunner.query(`DROP TABLE "utilisateurs"`);
    }
}
