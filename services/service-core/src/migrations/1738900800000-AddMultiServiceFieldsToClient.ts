import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMultiServiceFieldsToClient1738900800000
  implements MigrationInterface
{
  name = 'AddMultiServiceFieldsToClient1738900800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clientbases" ADD "has_conciergerie" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "clientbases" ADD "has_justi_plus" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "clientbases" ADD "has_wincash" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "clientbases" ADD "uuid_wincash" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "clientbases" ADD "uuid_justi_plus" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "clientbases" ADD "date_premiere_souscription" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "clientbases" ADD "canal_acquisition" character varying(100)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clientbases" DROP COLUMN "canal_acquisition"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clientbases" DROP COLUMN "date_premiere_souscription"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clientbases" DROP COLUMN "uuid_justi_plus"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clientbases" DROP COLUMN "uuid_wincash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clientbases" DROP COLUMN "has_wincash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clientbases" DROP COLUMN "has_justi_plus"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clientbases" DROP COLUMN "has_conciergerie"`,
    );
  }
}
