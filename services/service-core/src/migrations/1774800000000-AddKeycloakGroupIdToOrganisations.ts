import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKeycloakGroupIdToOrganisations1774800000000 implements MigrationInterface {
  name = 'AddKeycloakGroupIdToOrganisations1774800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organisations" ADD COLUMN IF NOT EXISTS "keycloak_group_id" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "organisations" DROP COLUMN IF EXISTS "keycloak_group_id"`);
  }
}
