import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1769426107743 implements MigrationInterface {
    name = 'Init1769426107743'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "transporteurorganisations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying NOT NULL, "organisation_id" character varying NOT NULL, "contract_number" character varying NOT NULL, "password" character varying NOT NULL, "label_format" character varying NOT NULL, "actif" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_59c1efd483468f8156ce2958391" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "periodefacturations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "nom" character varying NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c11889219f470c4f614756c567d" UNIQUE ("code"), CONSTRAINT "PK_39e3e2fe81bff3f6590e40847bd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "statutclients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "nom" character varying NOT NULL, "description" text, "ordre_affichage" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f27727108b98cf005cb2da82e0a" UNIQUE ("code"), CONSTRAINT "PK_8db69d22b050bc64b8460742aa1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "emissionfactures" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "nom" character varying NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e4987b5f002f1617aef412fda91" UNIQUE ("code"), CONSTRAINT "PK_dc9bc541f9ca48e2c9d9cae3b94" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "conditionpaiements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "nom" character varying NOT NULL, "description" text, "delai_jours" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7b38f7c19eb654444d1f86989e9" UNIQUE ("code"), CONSTRAINT "PK_7a70dc4e069bbdfb7677e1aa36d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "facturationpars" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "nom" character varying NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4e1713268a70bab57f98e85329f" UNIQUE ("code"), CONSTRAINT "PK_2051046191556db736b11fb1377" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "facturationpars"`);
        await queryRunner.query(`DROP TABLE "conditionpaiements"`);
        await queryRunner.query(`DROP TABLE "emissionfactures"`);
        await queryRunner.query(`DROP TABLE "statutclients"`);
        await queryRunner.query(`DROP TABLE "periodefacturations"`);
        await queryRunner.query(`DROP TABLE "transporteurorganisations"`);
    }

}
