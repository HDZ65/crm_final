import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGedFieldsAndAuditLog1774300000000 implements MigrationInterface {
  name = 'AddGedFieldsAndAuditLog1774300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 5 new columns to piecejointes table
    await queryRunner.query(`
      ALTER TABLE piecejointes
        ADD COLUMN IF NOT EXISTS type_document INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS parent_id UUID,
        ADD COLUMN IF NOT EXISTS hash_sha256 VARCHAR(64),
        ADD COLUMN IF NOT EXISTS organisation_id UUID
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_piecejointes_parent_id ON piecejointes(parent_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_piecejointes_organisation_id ON piecejointes(organisation_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_piecejointes_type_document ON piecejointes(type_document)`);

    // Create document_audit_logs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS document_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL,
        organisation_id UUID NOT NULL,
        action VARCHAR(50) NOT NULL,
        user_id VARCHAR(255),
        user_name VARCHAR(255),
        ip_address VARCHAR(45),
        "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_doc_audit_document_id ON document_audit_logs(document_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_doc_audit_organisation_id ON document_audit_logs(organisation_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_doc_audit_org_timestamp ON document_audit_logs(organisation_id, "timestamp")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_doc_audit_doc_timestamp ON document_audit_logs(document_id, "timestamp")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_doc_audit_doc_timestamp`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_doc_audit_org_timestamp`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_doc_audit_organisation_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_doc_audit_document_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS document_audit_logs`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_piecejointes_type_document`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_piecejointes_organisation_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_piecejointes_parent_id`);

    await queryRunner.query(`
      ALTER TABLE piecejointes
        DROP COLUMN IF EXISTS type_document,
        DROP COLUMN IF EXISTS version,
        DROP COLUMN IF EXISTS parent_id,
        DROP COLUMN IF EXISTS hash_sha256,
        DROP COLUMN IF EXISTS organisation_id
    `);
  }
}
