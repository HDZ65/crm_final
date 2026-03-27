import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNumOrganismeToClientBase1776300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE clientbases ADD COLUMN IF NOT EXISTS num_organisme VARCHAR(20) DEFAULT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE clientbases DROP COLUMN IF EXISTS num_organisme`);
  }
}
