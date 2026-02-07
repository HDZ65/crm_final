import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditColumnsToAllTables1739000000000 implements MigrationInterface {
    name = 'AddAuditColumnsToAllTables1739000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Organisations domain tables
        await queryRunner.query(`ALTER TABLE "organisations" ADD COLUMN "created_by" VARCHAR(255) NULL`);
        await queryRunner.query(`ALTER TABLE "organisations" ADD COLUMN "modified_by" VARCHAR(255) NULL`);

        await queryRunner.query(`ALTER TABLE "societes" ADD COLUMN "created_by" VARCHAR(255) NULL`);
        await queryRunner.query(`ALTER TABLE "societes" ADD COLUMN "modified_by" VARCHAR(255) NULL`);

        await queryRunner.query(`ALTER TABLE "partenairemarqueblanches" ADD COLUMN "created_by" VARCHAR(255) NULL`);
        await queryRunner.query(`ALTER TABLE "partenairemarqueblanches" ADD COLUMN "modified_by" VARCHAR(255) NULL`);

        // Clients domain tables
        await queryRunner.query(`ALTER TABLE "clientbases" ADD COLUMN "created_by" VARCHAR(255) NULL`);
        await queryRunner.query(`ALTER TABLE "clientbases" ADD COLUMN "modified_by" VARCHAR(255) NULL`);

        await queryRunner.query(`ALTER TABLE "cliententreprises" ADD COLUMN "created_by" VARCHAR(255) NULL`);
        await queryRunner.query(`ALTER TABLE "cliententreprises" ADD COLUMN "modified_by" VARCHAR(255) NULL`);

        await queryRunner.query(`ALTER TABLE "clientpartenaires" ADD COLUMN "created_by" VARCHAR(255) NULL`);
        await queryRunner.query(`ALTER TABLE "clientpartenaires" ADD COLUMN "modified_by" VARCHAR(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Organisations domain tables
        await queryRunner.query(`ALTER TABLE "organisations" DROP COLUMN "modified_by"`);
        await queryRunner.query(`ALTER TABLE "organisations" DROP COLUMN "created_by"`);

        await queryRunner.query(`ALTER TABLE "societes" DROP COLUMN "modified_by"`);
        await queryRunner.query(`ALTER TABLE "societes" DROP COLUMN "created_by"`);

        await queryRunner.query(`ALTER TABLE "partenairemarqueblanches" DROP COLUMN "modified_by"`);
        await queryRunner.query(`ALTER TABLE "partenairemarqueblanches" DROP COLUMN "created_by"`);

        // Clients domain tables
        await queryRunner.query(`ALTER TABLE "clientbases" DROP COLUMN "modified_by"`);
        await queryRunner.query(`ALTER TABLE "clientbases" DROP COLUMN "created_by"`);

        await queryRunner.query(`ALTER TABLE "cliententreprises" DROP COLUMN "modified_by"`);
        await queryRunner.query(`ALTER TABLE "cliententreprises" DROP COLUMN "created_by"`);

        await queryRunner.query(`ALTER TABLE "clientpartenaires" DROP COLUMN "modified_by"`);
        await queryRunner.query(`ALTER TABLE "clientpartenaires" DROP COLUMN "created_by"`);
    }

}
