import { MigrationInterface, QueryRunner } from 'typeorm';
import { EncryptedColumnTransformer } from '../infrastructure/security/encrypted-column.transformer';
import { EncryptionService } from '../infrastructure/security/encryption.service';

type InformationPaiementBancaireRow = {
  id: string;
  iban: string | null;
  bic: string | null;
};

export class EncryptInformationPaiementBancaireIbanBicToText1772810001000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_information_paiement_bancaire_iban"');
    await queryRunner.query('ALTER TABLE "information_paiement_bancaire" ALTER COLUMN "iban" TYPE TEXT');
    await queryRunner.query('ALTER TABLE "information_paiement_bancaire" ALTER COLUMN "bic" TYPE TEXT');

    // Existing rows are still plaintext. Rewriting values applies the transformer encryption.
    const encryptionService = new EncryptionService();
    const transformer = new EncryptedColumnTransformer(encryptionService);
    const rows = (await queryRunner.query(
      'SELECT "id", "iban", "bic" FROM "information_paiement_bancaire" WHERE "iban" IS NOT NULL OR "bic" IS NOT NULL',
    )) as InformationPaiementBancaireRow[];

    for (const row of rows) {
      await queryRunner.query(
        'UPDATE "information_paiement_bancaire" SET "iban" = $1, "bic" = $2 WHERE "id" = $3',
        [transformer.to(row.iban), transformer.to(row.bic), row.id],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const encryptionService = new EncryptionService();
    const transformer = new EncryptedColumnTransformer(encryptionService);
    const rows = (await queryRunner.query(
      'SELECT "id", "iban", "bic" FROM "information_paiement_bancaire" WHERE "iban" IS NOT NULL OR "bic" IS NOT NULL',
    )) as InformationPaiementBancaireRow[];

    for (const row of rows) {
      await queryRunner.query(
        'UPDATE "information_paiement_bancaire" SET "iban" = $1, "bic" = $2 WHERE "id" = $3',
        [transformer.from(row.iban), transformer.from(row.bic), row.id],
      );
    }

    await queryRunner.query('ALTER TABLE "information_paiement_bancaire" ALTER COLUMN "iban" TYPE VARCHAR(34)');
    await queryRunner.query('ALTER TABLE "information_paiement_bancaire" ALTER COLUMN "bic" TYPE VARCHAR(11)');
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_information_paiement_bancaire_iban" ON "information_paiement_bancaire" ("iban")',
    );
  }
}
