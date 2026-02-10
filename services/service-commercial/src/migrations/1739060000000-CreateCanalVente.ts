import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCanalVente1739060000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM type for CanalVente
    await queryRunner.query(`
      CREATE TYPE canal_vente_enum AS ENUM (
        'TERRAIN',
        'TELEPHONE',
        'WEB',
        'MARQUE_BLANCHE',
        'MARKETPLACE'
      )
    `);

    // Create canal_vente_produit table
    await queryRunner.query(`
      CREATE TABLE canal_vente_produit (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        produit_id UUID NOT NULL,
        canal canal_vente_enum NOT NULL,
        actif BOOLEAN NOT NULL DEFAULT true,
        config JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_canal_vente_produit_produit FOREIGN KEY (produit_id)
          REFERENCES produit(id) ON DELETE CASCADE,
        CONSTRAINT uk_canal_vente_produit_unique UNIQUE (produit_id, canal)
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_canal_vente_produit_produit_id ON canal_vente_produit(produit_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_canal_vente_produit_canal ON canal_vente_produit(canal)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_canal_vente_produit_actif ON canal_vente_produit(actif)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_canal_vente_produit_actif`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_canal_vente_produit_canal`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_canal_vente_produit_produit_id`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS canal_vente_produit`);

    // Drop ENUM type
    await queryRunner.query(`DROP TYPE IF EXISTS canal_vente_enum`);
  }
}
