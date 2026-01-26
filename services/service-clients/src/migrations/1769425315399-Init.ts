import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1769425315399 implements MigrationInterface {
    name = 'Init1769425315399'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "statutclients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(50) NOT NULL, "nom" character varying(100) NOT NULL, "description" text, "ordre_affichage" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f27727108b98cf005cb2da82e0a" UNIQUE ("code"), CONSTRAINT "PK_8db69d22b050bc64b8460742aa1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "clientbases" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "type_client" character varying(50) NOT NULL, "nom" character varying(100) NOT NULL, "prenom" character varying(100) NOT NULL, "date_naissance" date, "compte_code" character varying(50) NOT NULL, "partenaire_id" uuid NOT NULL, "date_creation" TIMESTAMP WITH TIME ZONE NOT NULL, "telephone" character varying(20) NOT NULL, "email" character varying(255), "statut" character varying(50) NOT NULL DEFAULT 'ACTIF', "societe_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7acbee0513671648d32482268bf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "adresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "client_base_id" uuid NOT NULL, "ligne1" character varying(255) NOT NULL, "ligne2" character varying(255), "code_postal" character varying(20) NOT NULL, "ville" character varying(100) NOT NULL, "pays" character varying(100) NOT NULL DEFAULT 'France', "type" character varying(50) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2787c84f7433e390ff8961d552d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "clientpartenaires" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "client_base_id" uuid NOT NULL, "partenaire_id" uuid NOT NULL, "role_partenaire_id" uuid NOT NULL, "valid_from" date NOT NULL, "valid_to" date, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e425fcc54c5ba87036e81b696f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cliententreprises" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "raison_sociale" character varying(255) NOT NULL, "numero_tva" character varying(50) NOT NULL, "siren" character varying(20) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a1a72c93802bad389ec3196774a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "adresses" ADD CONSTRAINT "FK_d87f0d3c4a7d887b1afa824e629" FOREIGN KEY ("client_base_id") REFERENCES "clientbases"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "adresses" DROP CONSTRAINT "FK_d87f0d3c4a7d887b1afa824e629"`);
        await queryRunner.query(`DROP TABLE "cliententreprises"`);
        await queryRunner.query(`DROP TABLE "clientpartenaires"`);
        await queryRunner.query(`DROP TABLE "adresses"`);
        await queryRunner.query(`DROP TABLE "clientbases"`);
        await queryRunner.query(`DROP TABLE "statutclients"`);
    }

}
