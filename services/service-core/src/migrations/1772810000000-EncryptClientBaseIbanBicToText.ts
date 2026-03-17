import { MigrationInterface, QueryRunner } from 'typeorm';
import { EncryptedColumnTransformer } from '../infrastructure/security/encrypted-column.transformer';
import { EncryptionService } from '../infrastructure/security/encryption.service';

type ClientBaseBankRow = {
  id: string;
  iban: string | null;
  bic: string | null;
};

export class EncryptClientBaseIbanBicToText1772810000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "clientbases" ALTER COLUMN "iban" TYPE TEXT');
    await queryRunner.query('ALTER TABLE "clientbases" ALTER COLUMN "bic" TYPE TEXT');

    // Existing rows are still plaintext. Rewriting values applies the transformer encryption.
    const encryptionService = new EncryptionService();
    const transformer = new EncryptedColumnTransformer(encryptionService);
    const rows = (await queryRunner.query(
      'SELECT "id", "iban", "bic" FROM "clientbases" WHERE "iban" IS NOT NULL OR "bic" IS NOT NULL',
    )) as ClientBaseBankRow[];

    for (const row of rows) {
      await queryRunner.query(
        'UPDATE "clientbases" SET "iban" = $1, "bic" = $2 WHERE "id" = $3',
        [transformer.to(row.iban), transformer.to(row.bic), row.id],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const encryptionService = new EncryptionService();
    const transformer = new EncryptedColumnTransformer(encryptionService);
    const rows = (await queryRunner.query(
      'SELECT "id", "iban", "bic" FROM "clientbases" WHERE "iban" IS NOT NULL OR "bic" IS NOT NULL',
    )) as ClientBaseBankRow[];

    for (const row of rows) {
      await queryRunner.query(
        'UPDATE "clientbases" SET "iban" = $1, "bic" = $2 WHERE "id" = $3',
        [transformer.from(row.iban), transformer.from(row.bic), row.id],
      );
    }

    await queryRunner.query('ALTER TABLE "clientbases" ALTER COLUMN "iban" TYPE VARCHAR(34)');
    await queryRunner.query('ALTER TABLE "clientbases" ALTER COLUMN "bic" TYPE VARCHAR(11)');
  }
}
