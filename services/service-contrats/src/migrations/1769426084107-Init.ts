import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1769426084107 implements MigrationInterface {
    name = 'Init1769426084107'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "statut_contrat" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(50) NOT NULL, "nom" character varying(100) NOT NULL, "description" text, "ordre_affichage" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8f8533993f7ba5f4f282650726f" UNIQUE ("code"), CONSTRAINT "PK_9fc1ea0bb89f2e3cb7a60018a73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "contract_orchestration_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "contract_id" uuid NOT NULL, "operation" character varying(50) NOT NULL, "status" character varying(20) NOT NULL, "payload" jsonb, "response_payload" jsonb, "error_message" text, "started_at" TIMESTAMP NOT NULL, "finished_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_152ce3f990a92c0c37b8604291f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b2bd6d943256a22fd7f4555c5e" ON "contract_orchestration_history" ("contract_id") `);
        await queryRunner.query(`CREATE TABLE "historique_statut_contrat" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "contrat_id" uuid NOT NULL, "ancien_statut_id" uuid NOT NULL, "nouveau_statut_id" uuid NOT NULL, "date_changement" character varying(50) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6ea0822747081f435942ca0e89b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "contrat" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "reference" character varying(100) NOT NULL, "titre" character varying(255), "description" text, "type" character varying(50), "statut" character varying(50) NOT NULL, "date_debut" character varying(50) NOT NULL, "date_fin" character varying(50), "date_signature" character varying(50), "montant" numeric(15,2), "devise" character varying(10) NOT NULL DEFAULT 'EUR', "frequence_facturation" character varying(50), "document_url" text, "fournisseur" character varying(255), "client_id" uuid NOT NULL, "commercial_id" uuid NOT NULL, "societe_id" uuid, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e65df73275cdfefef0c9d2b85f3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5f09d40022e91cd496aa9be21b" ON "contrat" ("organisation_id", "reference") `);
        await queryRunner.query(`CREATE TABLE "ligne_contrat" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "contrat_id" uuid NOT NULL, "produit_id" uuid NOT NULL, "periode_facturation_id" uuid NOT NULL, "quantite" integer NOT NULL, "prix_unitaire" numeric(15,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_45671eb741d6f966cba22edb94b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "historique_statut_contrat" ADD CONSTRAINT "FK_07fe12c026f012321c52b7a9daf" FOREIGN KEY ("contrat_id") REFERENCES "contrat"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ligne_contrat" ADD CONSTRAINT "FK_73b0b48059e921e18972ee5278f" FOREIGN KEY ("contrat_id") REFERENCES "contrat"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ligne_contrat" DROP CONSTRAINT "FK_73b0b48059e921e18972ee5278f"`);
        await queryRunner.query(`ALTER TABLE "historique_statut_contrat" DROP CONSTRAINT "FK_07fe12c026f012321c52b7a9daf"`);
        await queryRunner.query(`DROP TABLE "ligne_contrat"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5f09d40022e91cd496aa9be21b"`);
        await queryRunner.query(`DROP TABLE "contrat"`);
        await queryRunner.query(`DROP TABLE "historique_statut_contrat"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b2bd6d943256a22fd7f4555c5e"`);
        await queryRunner.query(`DROP TABLE "contract_orchestration_history"`);
        await queryRunner.query(`DROP TABLE "statut_contrat"`);
    }

}
