import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateDebitBatchToLotFk1772697600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO debit_lot (
        id,
        organisation_id,
        societe_id,
        name,
        start_day,
        end_day,
        description,
        is_active,
        display_order,
        created_at,
        updated_at
      )
      SELECT
        uuid_generate_v4(),
        src.organisation_id,
        src.societe_id,
        lot_def.name,
        lot_def.start_day,
        lot_def.end_day,
        NULL,
        TRUE,
        lot_def.display_order,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM (
        SELECT DISTINCT organisation_id, societe_id
        FROM planned_debit
        WHERE batch IN ('L1', 'L2', 'L3', 'L4')
        UNION
        SELECT DISTINCT organisation_id, societe_id
        FROM volume_forecast
        WHERE batch IN ('L1', 'L2', 'L3', 'L4')
        UNION
        SELECT DISTINCT organisation_id, societe_id
        FROM system_debit_configuration
        WHERE batch IN ('L1', 'L2', 'L3', 'L4')
        UNION
        SELECT DISTINCT organisation_id, societe_id
        FROM company_debit_configuration
        WHERE batch IN ('L1', 'L2', 'L3', 'L4')
        UNION
        SELECT DISTINCT organisation_id, societe_id
        FROM client_debit_configuration
        WHERE batch IN ('L1', 'L2', 'L3', 'L4')
        UNION
        SELECT DISTINCT organisation_id, societe_id
        FROM contract_debit_configuration
        WHERE batch IN ('L1', 'L2', 'L3', 'L4')
      ) AS src
      CROSS JOIN (
        VALUES
          ('Lot 1', 1, 7, 1),
          ('Lot 2', 8, 14, 2),
          ('Lot 3', 15, 21, 3),
          ('Lot 4', 22, 28, 4)
      ) AS lot_def(name, start_day, end_day, display_order)
      WHERE src.societe_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM debit_lot dl
          WHERE dl.organisation_id = src.organisation_id
            AND dl.societe_id = src.societe_id
        );
    `);

    await this.backfillLotIdFromBatch(queryRunner, 'planned_debit');
    await this.backfillLotIdFromBatch(queryRunner, 'volume_forecast');
    await this.backfillLotIdFromBatch(queryRunner, 'system_debit_configuration');
    await this.backfillLotIdFromBatch(queryRunner, 'company_debit_configuration');
    await this.backfillLotIdFromBatch(queryRunner, 'client_debit_configuration');
    await this.backfillLotIdFromBatch(queryRunner, 'contract_debit_configuration');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE planned_debit SET lot_id = NULL;`);
    await queryRunner.query(`UPDATE volume_forecast SET lot_id = NULL;`);
    await queryRunner.query(`UPDATE system_debit_configuration SET lot_id = NULL;`);
    await queryRunner.query(`UPDATE company_debit_configuration SET lot_id = NULL;`);
    await queryRunner.query(`UPDATE client_debit_configuration SET lot_id = NULL;`);
    await queryRunner.query(`UPDATE contract_debit_configuration SET lot_id = NULL;`);

    await queryRunner.query(`
      DELETE FROM debit_lot
      WHERE name IN ('Lot 1', 'Lot 2', 'Lot 3', 'Lot 4')
        AND display_order IN (1, 2, 3, 4);
    `);
  }

  private async backfillLotIdFromBatch(queryRunner: QueryRunner, tableName: string): Promise<void> {
    await queryRunner.query(`
      UPDATE ${tableName} t
      SET lot_id = (
        SELECT dl.id
        FROM debit_lot dl
        WHERE dl.organisation_id = t.organisation_id
          AND dl.societe_id = t.societe_id
          AND dl.start_day = 1
          AND dl.end_day = 7
        LIMIT 1
      )
      WHERE t.batch = 'L1';
    `);

    await queryRunner.query(`
      UPDATE ${tableName} t
      SET lot_id = (
        SELECT dl.id
        FROM debit_lot dl
        WHERE dl.organisation_id = t.organisation_id
          AND dl.societe_id = t.societe_id
          AND dl.start_day = 8
          AND dl.end_day = 14
        LIMIT 1
      )
      WHERE t.batch = 'L2';
    `);

    await queryRunner.query(`
      UPDATE ${tableName} t
      SET lot_id = (
        SELECT dl.id
        FROM debit_lot dl
        WHERE dl.organisation_id = t.organisation_id
          AND dl.societe_id = t.societe_id
          AND dl.start_day = 15
          AND dl.end_day = 21
        LIMIT 1
      )
      WHERE t.batch = 'L3';
    `);

    await queryRunner.query(`
      UPDATE ${tableName} t
      SET lot_id = (
        SELECT dl.id
        FROM debit_lot dl
        WHERE dl.organisation_id = t.organisation_id
          AND dl.societe_id = t.societe_id
          AND dl.start_day = 22
          AND dl.end_day = 28
        LIMIT 1
      )
      WHERE t.batch = 'L4';
    `);
  }
}
