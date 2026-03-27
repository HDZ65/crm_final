import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReducBoxAccessTables1774400000000 implements MigrationInterface {
  name = 'CreateReducBoxAccessTables1774400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum for ReducBox access status
    await queryRunner.query(`
      CREATE TYPE reducbox_access_status_enum AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'CANCELLED')
    `);

    // Create reducbox_access table
    await queryRunner.query(`
      CREATE TABLE reducbox_access (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL,
        contrat_id UUID NOT NULL,
        status reducbox_access_status_enum NOT NULL DEFAULT 'PENDING',
        external_access_id VARCHAR(255),
        suspended_at TIMESTAMPTZ,
        restored_at TIMESTAMPTZ,
        cancelled_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes for reducbox_access
    await queryRunner.query(`
      CREATE INDEX idx_reducbox_access_client_id ON reducbox_access(client_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_reducbox_access_contrat_id ON reducbox_access(contrat_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_reducbox_access_status ON reducbox_access(status)
    `);

    // Create reducbox_access_history table
    await queryRunner.query(`
      CREATE TABLE reducbox_access_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        access_id UUID NOT NULL REFERENCES reducbox_access(id) ON DELETE CASCADE,
        previous_status VARCHAR(50) NOT NULL,
        new_status VARCHAR(50) NOT NULL,
        reason TEXT,
        changed_by VARCHAR(255),
        changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Create index for history lookups by access_id
    await queryRunner.query(`
      CREATE INDEX idx_reducbox_access_history_access_id ON reducbox_access_history(access_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_reducbox_access_history_access_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS reducbox_access_history`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_reducbox_access_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_reducbox_access_contrat_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_reducbox_access_client_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS reducbox_access`);
    await queryRunner.query(`DROP TYPE IF EXISTS reducbox_access_status_enum`);
  }
}
