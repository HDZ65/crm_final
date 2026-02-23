import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWinLeadPlusFieldsToClientBase1770822000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'clientbases',
      new TableColumn({ name: 'iban', type: 'varchar', length: '34', isNullable: true, default: null }),
    );
    await queryRunner.addColumn(
      'clientbases',
      new TableColumn({ name: 'bic', type: 'varchar', length: '11', isNullable: true, default: null }),
    );
    await queryRunner.addColumn(
      'clientbases',
      new TableColumn({ name: 'mandat_sepa', type: 'boolean', isNullable: true, default: null }),
    );
    await queryRunner.addColumn(
      'clientbases',
      new TableColumn({ name: 'csp', type: 'varchar', length: '100', isNullable: true, default: null }),
    );
    await queryRunner.addColumn(
      'clientbases',
      new TableColumn({ name: 'regime_social', type: 'varchar', length: '100', isNullable: true, default: null }),
    );
    await queryRunner.addColumn(
      'clientbases',
      new TableColumn({ name: 'lieu_naissance', type: 'varchar', length: '100', isNullable: true, default: null }),
    );
    await queryRunner.addColumn(
      'clientbases',
      new TableColumn({ name: 'pays_naissance', type: 'varchar', length: '100', isNullable: true, default: null }),
    );
    await queryRunner.addColumn(
      'clientbases',
      new TableColumn({ name: 'etape_courante', type: 'varchar', length: '100', isNullable: true, default: null }),
    );
    await queryRunner.addColumn(
      'clientbases',
      new TableColumn({ name: 'is_politically_exposed', type: 'boolean', isNullable: true, default: null }),
    );
    await queryRunner.addColumn(
      'clientbases',
      new TableColumn({ name: 'numss', type: 'varchar', length: '20', isNullable: true, default: null }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('clientbases', 'iban');
    await queryRunner.dropColumn('clientbases', 'bic');
    await queryRunner.dropColumn('clientbases', 'mandat_sepa');
    await queryRunner.dropColumn('clientbases', 'csp');
    await queryRunner.dropColumn('clientbases', 'regime_social');
    await queryRunner.dropColumn('clientbases', 'lieu_naissance');
    await queryRunner.dropColumn('clientbases', 'pays_naissance');
    await queryRunner.dropColumn('clientbases', 'etape_courante');
    await queryRunner.dropColumn('clientbases', 'is_politically_exposed');
    await queryRunner.dropColumn('clientbases', 'numss');
  }
}
