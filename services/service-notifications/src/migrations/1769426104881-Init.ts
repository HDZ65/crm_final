import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1769426104881 implements MigrationInterface {
    name = 'Init1769426104881'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('CONTRAT_EXPIRE', 'CONTRAT_BIENTOT_EXPIRE', 'IMPAYE', 'NOUVEAU_CLIENT', 'NOUVEAU_CONTRAT', 'TACHE_ASSIGNEE', 'RAPPEL', 'ALERTE', 'INFO', 'SYSTEME')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "utilisateur_id" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL DEFAULT 'INFO', "titre" character varying(255) NOT NULL, "message" text NOT NULL, "lu" boolean NOT NULL DEFAULT false, "metadata" jsonb, "lien_url" character varying(500), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c075d9ce655d67bbec46ff5631" ON "notifications" ("organisation_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ac86d3ab7a1928851fb24416c6" ON "notifications" ("utilisateur_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2d50bbf345eb8c01771992d7ca" ON "notifications" ("organisation_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_eccf573823adee3fe12430decb" ON "notifications" ("utilisateur_id", "lu") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_eccf573823adee3fe12430decb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2d50bbf345eb8c01771992d7ca"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ac86d3ab7a1928851fb24416c6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c075d9ce655d67bbec46ff5631"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    }

}
