import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptionTables1737804000000 implements MigrationInterface {
  name = 'CreateSubscriptionTables1737804000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE subscription_status_enum AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'PAST_DUE', 'CANCELED', 'EXPIRED')
    `);

    await queryRunner.query(`
      CREATE TYPE billing_interval_enum AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')
    `);

    // Create subscription_plans table
    await queryRunner.query(`
      CREATE TABLE subscription_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        billing_interval VARCHAR(50) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
        trial_days INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Create subscriptions table
    await queryRunner.query(`
      CREATE TABLE subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        client_id UUID NOT NULL,
        plan_id UUID,
        contrat_id UUID,
        external_id VARCHAR(255),
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        start_date TIMESTAMPTZ NOT NULL,
        end_date TIMESTAMPTZ,
        next_charge_at TIMESTAMPTZ,
        paused_at TIMESTAMPTZ,
        canceled_at TIMESTAMPTZ,
        cancel_reason TEXT,
        current_cycle_start TIMESTAMPTZ,
        current_cycle_end TIMESTAMPTZ,
        billing_interval VARCHAR(50) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
        CONSTRAINT uq_subscriptions_org_external_id UNIQUE (organisation_id, external_id)
      )
    `);

    // Create subscription_cycles table
    await queryRunner.query(`
      CREATE TABLE subscription_cycles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscription_id UUID NOT NULL,
        cycle_number INT NOT NULL,
        period_start TIMESTAMPTZ NOT NULL,
        period_end TIMESTAMPTZ NOT NULL,
        charge_date TIMESTAMPTZ,
        charge_status VARCHAR(50),
        amount DECIMAL(15, 2) NOT NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_subscription_cycles_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
      )
    `);

    // Create subscription_status_history table
    await queryRunner.query(`
      CREATE TABLE subscription_status_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscription_id UUID NOT NULL,
        previous_status VARCHAR(50),
        new_status VARCHAR(50) NOT NULL,
        reason TEXT,
        changed_by VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_subscription_status_history_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_subscription_plans_org ON subscription_plans(organisation_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_subscriptions_org ON subscriptions(organisation_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_subscriptions_client ON subscriptions(client_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_subscriptions_status ON subscriptions(status)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_subscriptions_next_charge ON subscriptions(next_charge_at)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_subscription_cycles_subscription ON subscription_cycles(subscription_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_subscription_status_history_subscription ON subscription_status_history(subscription_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_subscription_status_history_subscription`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_subscription_cycles_subscription`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_subscriptions_next_charge`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_subscriptions_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_subscriptions_plan`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_subscriptions_client`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_subscriptions_org`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_subscription_plans_org`);

    // Drop tables (reverse order)
    await queryRunner.query(`DROP TABLE IF EXISTS subscription_status_history`);
    await queryRunner.query(`DROP TABLE IF EXISTS subscription_cycles`);
    await queryRunner.query(`DROP TABLE IF EXISTS subscriptions`);
    await queryRunner.query(`DROP TABLE IF EXISTS subscription_plans`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS billing_interval_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS subscription_status_enum`);
  }
}
