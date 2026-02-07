import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnrichSocieteEntity1770487050000 implements MigrationInterface {
  name = 'EnrichSocieteEntity1770487050000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add logo_url column
    await queryRunner.query(
      `ALTER TABLE "societes" ADD "logo_url" text NULL`,
    );

    // Add devise column with default 'EUR'
    await queryRunner.query(
      `ALTER TABLE "societes" ADD "devise" character varying(3) NOT NULL DEFAULT 'EUR'`,
    );

    // Add ics column (SEPA Creditor Identifier)
    await queryRunner.query(
      `ALTER TABLE "societes" ADD "ics" character varying(50) NULL`,
    );

    // Add journal_vente column
    await queryRunner.query(
      `ALTER TABLE "societes" ADD "journal_vente" character varying(20) NULL`,
    );

    // Add compte_produit_defaut column
    await queryRunner.query(
      `ALTER TABLE "societes" ADD "compte_produit_defaut" character varying(20) NULL`,
    );

    // Add plan_comptable column (JSONB)
    await queryRunner.query(
      `ALTER TABLE "societes" ADD "plan_comptable" jsonb NULL`,
    );

    // Add adresse_siege column
    await queryRunner.query(
      `ALTER TABLE "societes" ADD "adresse_siege" text NULL`,
    );

    // Add telephone column
    await queryRunner.query(
      `ALTER TABLE "societes" ADD "telephone" character varying(50) NULL`,
    );

    // Add email_contact column
    await queryRunner.query(
      `ALTER TABLE "societes" ADD "email_contact" character varying(255) NULL`,
    );

    // Add parametres_fiscaux column (JSONB)
    await queryRunner.query(
      `ALTER TABLE "societes" ADD "parametres_fiscaux" jsonb NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop columns in reverse order
    await queryRunner.query(
      `ALTER TABLE "societes" DROP COLUMN "parametres_fiscaux"`,
    );

    await queryRunner.query(
      `ALTER TABLE "societes" DROP COLUMN "email_contact"`,
    );

    await queryRunner.query(
      `ALTER TABLE "societes" DROP COLUMN "telephone"`,
    );

    await queryRunner.query(
      `ALTER TABLE "societes" DROP COLUMN "adresse_siege"`,
    );

    await queryRunner.query(
      `ALTER TABLE "societes" DROP COLUMN "plan_comptable"`,
    );

    await queryRunner.query(
      `ALTER TABLE "societes" DROP COLUMN "compte_produit_defaut"`,
    );

    await queryRunner.query(
      `ALTER TABLE "societes" DROP COLUMN "journal_vente"`,
    );

    await queryRunner.query(
      `ALTER TABLE "societes" DROP COLUMN "ics"`,
    );

    await queryRunner.query(
      `ALTER TABLE "societes" DROP COLUMN "devise"`,
    );

    await queryRunner.query(
      `ALTER TABLE "societes" DROP COLUMN "logo_url"`,
    );
  }
}
