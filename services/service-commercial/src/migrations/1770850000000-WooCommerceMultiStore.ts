import { MigrationInterface, QueryRunner } from 'typeorm';

export class WooCommerceMultiStore1770850000000 implements MigrationInterface {
  name = 'WooCommerceMultiStore1770850000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove unique constraint on organisation_id in woocommerce_configs
    await queryRunner.query(`
      ALTER TABLE "woocommerce_configs"
        DROP CONSTRAINT IF EXISTS "UQ_93617bf86e0a20ea2803a0fd3a2"
    `);

    // Add societe_id column (nullable to avoid breaking existing rows)
    await queryRunner.query(`
      ALTER TABLE "woocommerce_configs"
        ADD COLUMN "societe_id" UUID NULL
    `);

    // Create index on societe_id
    await queryRunner.query(`
      CREATE INDEX "IDX_woocommerce_configs_societe_id" ON "woocommerce_configs" ("societe_id")
    `);

    // Add label column
    await queryRunner.query(`
      ALTER TABLE "woocommerce_configs"
        ADD COLUMN "label" CHARACTER VARYING(100) NOT NULL DEFAULT ''
    `);

    // Add config_id column to woocommerce_mappings (nullable)
    await queryRunner.query(`
      ALTER TABLE "woocommerce_mappings"
        ADD COLUMN "config_id" UUID NULL
    `);

    // Create index on config_id
    await queryRunner.query(`
      CREATE INDEX "IDX_woocommerce_mappings_config_id" ON "woocommerce_mappings" ("config_id")
    `);

    // Add PRODUCT to woocommerce_entity_type_enum
    await queryRunner.query(`
      ALTER TYPE "woocommerce_mappings_entity_type_enum" ADD VALUE IF NOT EXISTS 'PRODUCT'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index on config_id
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_woocommerce_mappings_config_id"
    `);

    // Drop config_id column
    await queryRunner.query(`
      ALTER TABLE "woocommerce_mappings"
        DROP COLUMN IF EXISTS "config_id"
    `);

    // Drop label column
    await queryRunner.query(`
      ALTER TABLE "woocommerce_configs"
        DROP COLUMN IF EXISTS "label"
    `);

    // Drop index on societe_id
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_woocommerce_configs_societe_id"
    `);

    // Drop societe_id column
    await queryRunner.query(`
      ALTER TABLE "woocommerce_configs"
        DROP COLUMN IF EXISTS "societe_id"
    `);

    // Re-add unique constraint on organisation_id
    await queryRunner.query(`
      ALTER TABLE "woocommerce_configs"
        ADD CONSTRAINT "woocommerce_configs_organisation_id_key" UNIQUE ("organisation_id")
    `);

    // NOTE: Cannot remove enum values in PostgreSQL, so PRODUCT enum value cannot be undone
  }
}
