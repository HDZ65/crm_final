import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePasswordResetTokensTable1773848741000 implements MigrationInterface {
  name = 'CreatePasswordResetTokensTable1773848741000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "password_reset_tokens" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "keycloak_user_id" character varying(255) NOT NULL, "token" character varying(255) NOT NULL, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_password_reset_tokens_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_password_reset_tokens_token" UNIQUE ("token"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_password_reset_tokens_keycloak_user_id" ON "password_reset_tokens" ("keycloak_user_id")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_password_reset_tokens_token" ON "password_reset_tokens" ("token")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_password_reset_tokens_token"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_password_reset_tokens_keycloak_user_id"`);
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
  }
}
