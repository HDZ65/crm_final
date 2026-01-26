import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1769426108400 implements MigrationInterface {
    name = 'Init1769426108400'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."regle_relance_declencheur_enum" AS ENUM('IMPAYE', 'CONTRAT_BIENTOT_EXPIRE', 'CONTRAT_EXPIRE', 'NOUVEAU_CLIENT', 'INACTIVITE_CLIENT')`);
        await queryRunner.query(`CREATE TYPE "public"."regle_relance_action_type_enum" AS ENUM('CREER_TACHE', 'ENVOYER_EMAIL', 'NOTIFICATION', 'TACHE_ET_EMAIL')`);
        await queryRunner.query(`CREATE TYPE "public"."regle_relance_priorite_tache_enum" AS ENUM('HAUTE', 'MOYENNE', 'BASSE')`);
        await queryRunner.query(`CREATE TABLE "regle_relance" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "nom" character varying(100) NOT NULL, "description" text, "declencheur" "public"."regle_relance_declencheur_enum" NOT NULL, "delai_jours" integer NOT NULL, "action_type" "public"."regle_relance_action_type_enum" NOT NULL, "priorite_tache" "public"."regle_relance_priorite_tache_enum" NOT NULL DEFAULT 'MOYENNE', "template_email_id" uuid, "template_titre_tache" text, "template_description_tache" text, "assigne_par_defaut" uuid, "actif" boolean NOT NULL DEFAULT true, "ordre" integer NOT NULL DEFAULT '1', "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_74d46382f39cbd4aa504d82a15e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_405b5f142c38dff810356675a3" ON "regle_relance" ("organisation_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_86d83a8012e085b1e1da0ba941" ON "regle_relance" ("organisation_id", "actif") `);
        await queryRunner.query(`CREATE INDEX "IDX_24682aa521ebd54127a58b0a40" ON "regle_relance" ("organisation_id", "declencheur") `);
        await queryRunner.query(`CREATE TYPE "public"."historique_relance_resultat_enum" AS ENUM('SUCCES', 'ECHEC', 'IGNORE')`);
        await queryRunner.query(`CREATE TABLE "historique_relance" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "regle_relance_id" uuid NOT NULL, "client_id" uuid, "contrat_id" uuid, "facture_id" uuid, "tache_creee_id" uuid, "date_execution" TIMESTAMP NOT NULL, "resultat" "public"."historique_relance_resultat_enum" NOT NULL, "message_erreur" text, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7a603363363050a6cea14a51e2d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c9e73e3f12ecb103d948f97d9a" ON "historique_relance" ("organisation_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e7f8847697fdff48b8d95ffa77" ON "historique_relance" ("regle_relance_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_fc26b6de5d6676dda76ef7ef38" ON "historique_relance" ("client_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ed0b54ddfbcfb7133857dbbdad" ON "historique_relance" ("contrat_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c65448159e890276e32024ab61" ON "historique_relance" ("facture_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_4fff43c47741a43c7b6d886245" ON "historique_relance" ("date_execution") `);
        await queryRunner.query(`CREATE INDEX "IDX_f53353c7816c18da8bc24567b4" ON "historique_relance" ("regle_relance_id", "date_execution") `);
        await queryRunner.query(`CREATE INDEX "IDX_84a99e06656cd9834063e2add9" ON "historique_relance" ("organisation_id", "date_execution") `);
        await queryRunner.query(`ALTER TABLE "historique_relance" ADD CONSTRAINT "FK_e7f8847697fdff48b8d95ffa77b" FOREIGN KEY ("regle_relance_id") REFERENCES "regle_relance"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "historique_relance" DROP CONSTRAINT "FK_e7f8847697fdff48b8d95ffa77b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_84a99e06656cd9834063e2add9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f53353c7816c18da8bc24567b4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4fff43c47741a43c7b6d886245"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c65448159e890276e32024ab61"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ed0b54ddfbcfb7133857dbbdad"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fc26b6de5d6676dda76ef7ef38"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e7f8847697fdff48b8d95ffa77"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c9e73e3f12ecb103d948f97d9a"`);
        await queryRunner.query(`DROP TABLE "historique_relance"`);
        await queryRunner.query(`DROP TYPE "public"."historique_relance_resultat_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_24682aa521ebd54127a58b0a40"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_86d83a8012e085b1e1da0ba941"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_405b5f142c38dff810356675a3"`);
        await queryRunner.query(`DROP TABLE "regle_relance"`);
        await queryRunner.query(`DROP TYPE "public"."regle_relance_priorite_tache_enum"`);
        await queryRunner.query(`DROP TYPE "public"."regle_relance_action_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."regle_relance_declencheur_enum"`);
    }

}
