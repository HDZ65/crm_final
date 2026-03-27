import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTacheTable1770680000000 implements MigrationInterface {
    name = 'AddTacheTable1770680000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types (UPPERCASE to match @crm/shared-kernel)
        await queryRunner.query(`CREATE TYPE "public"."tache_type_enum" AS ENUM('APPEL', 'EMAIL', 'RDV', 'RELANCE_IMPAYE', 'RELANCE_CONTRAT', 'RENOUVELLEMENT', 'SUIVI', 'AUTRE')`);
        await queryRunner.query(`CREATE TYPE "public"."tache_priorite_enum" AS ENUM('BASSE', 'MOYENNE', 'HAUTE', 'URGENTE')`);
        await queryRunner.query(`CREATE TYPE "public"."tache_statut_enum" AS ENUM('A_FAIRE', 'EN_COURS', 'TERMINEE', 'ANNULEE')`);

        // Create tache table
        await queryRunner.query(`CREATE TABLE "tache" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "organisation_id" character varying NOT NULL,
            "titre" character varying NOT NULL,
            "description" text,
            "type" "public"."tache_type_enum" NOT NULL DEFAULT 'AUTRE',
            "priorite" "public"."tache_priorite_enum" NOT NULL DEFAULT 'MOYENNE',
            "statut" "public"."tache_statut_enum" NOT NULL DEFAULT 'A_FAIRE',
            "date_echeance" TIMESTAMP,
            "date_completion" TIMESTAMP,
            "assigne_a" character varying,
            "cree_par" character varying,
            "client_id" character varying,
            "contrat_id" character varying,
            "facture_id" character varying,
            "regle_relance_id" character varying,
            "metadata" jsonb,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_tache" PRIMARY KEY ("id")
        )`);

        // Create indexes for common query patterns
        await queryRunner.query(`CREATE INDEX "IDX_tache_organisation_id" ON "tache" ("organisation_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_tache_assigne_a" ON "tache" ("assigne_a")`);
        await queryRunner.query(`CREATE INDEX "IDX_tache_client_id" ON "tache" ("client_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_tache_contrat_id" ON "tache" ("contrat_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_tache_facture_id" ON "tache" ("facture_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_tache_statut" ON "tache" ("statut")`);
        await queryRunner.query(`CREATE INDEX "IDX_tache_date_echeance" ON "tache" ("date_echeance")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_tache_date_echeance"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tache_statut"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tache_facture_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tache_contrat_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tache_client_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tache_assigne_a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tache_organisation_id"`);

        // Drop table
        await queryRunner.query(`DROP TABLE "tache"`);

        // Drop enum types
        await queryRunner.query(`DROP TYPE "public"."tache_statut_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tache_priorite_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tache_type_enum"`);
    }
}
