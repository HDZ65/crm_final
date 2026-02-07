import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePreferenceTables1770520000000 implements MigrationInterface {
  name = 'CreatePreferenceTables1770520000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for preference value types
    await queryRunner.query(`
      CREATE TYPE preference_value_type_enum AS ENUM ('STRING', 'NUMBER', 'ENUM', 'BOOLEAN')
    `);

    // Create enum type for applied cycle
    await queryRunner.query(`
      CREATE TYPE applied_cycle_enum AS ENUM ('N', 'N+1')
    `);

    // Create subscription_preference_schemas table
    await queryRunner.query(`
      CREATE TABLE subscription_preference_schemas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        code VARCHAR(100) NOT NULL,
        label VARCHAR(255) NOT NULL,
        value_type preference_value_type_enum NOT NULL DEFAULT 'STRING',
        allowed_values JSONB,
        is_required BOOLEAN NOT NULL DEFAULT false,
        default_value VARCHAR(500),
        sort_order INT NOT NULL DEFAULT 0,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_pref_schema_org_code UNIQUE (organisation_id, code)
      )
    `);

    // Create subscription_preferences table
    await queryRunner.query(`
      CREATE TABLE subscription_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        subscription_id UUID NOT NULL,
        schema_id UUID NOT NULL,
        value TEXT NOT NULL,
        effective_from TIMESTAMPTZ NOT NULL,
        effective_to TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_pref_schema FOREIGN KEY (schema_id) REFERENCES subscription_preference_schemas(id) ON DELETE CASCADE,
        CONSTRAINT uq_pref_org_sub_schema UNIQUE (organisation_id, subscription_id, schema_id)
      )
    `);

    // Create subscription_preference_history table
    await queryRunner.query(`
      CREATE TABLE subscription_preference_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        preference_id UUID NOT NULL,
        old_value TEXT,
        new_value TEXT NOT NULL,
        changed_at TIMESTAMPTZ NOT NULL,
        changed_by VARCHAR(255) NOT NULL,
        applied_cycle applied_cycle_enum NOT NULL DEFAULT 'N',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_pref_history_preference FOREIGN KEY (preference_id) REFERENCES subscription_preferences(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_pref_schemas_org ON subscription_preference_schemas(organisation_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_pref_org ON subscription_preferences(organisation_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_pref_subscription ON subscription_preferences(subscription_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_pref_history_preference ON subscription_preference_history(preference_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_pref_history_preference_changed ON subscription_preference_history(preference_id, changed_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pref_history_preference_changed`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pref_history_preference`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pref_subscription`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pref_org`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pref_schemas_org`);

    // Drop tables (reverse order due to FK)
    await queryRunner.query(`DROP TABLE IF EXISTS subscription_preference_history`);
    await queryRunner.query(`DROP TABLE IF EXISTS subscription_preferences`);
    await queryRunner.query(`DROP TABLE IF EXISTS subscription_preference_schemas`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS applied_cycle_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS preference_value_type_enum`);
  }
}
