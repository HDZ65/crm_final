import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditColumnsToAllTables1739000000000 implements MigrationInterface {
    name = 'AddAuditColumnsToAllTables1739000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Products domain tables
        await queryRunner.query(`ALTER TABLE "produit" ADD COLUMN "created_by" VARCHAR(255) NULL`);
        await queryRunner.query(`ALTER TABLE "produit" ADD COLUMN "modified_by" VARCHAR(255) NULL`);

        await queryRunner.query(`ALTER TABLE "gamme" ADD COLUMN "created_by" VARCHAR(255) NULL`);
        await queryRunner.query(`ALTER TABLE "gamme" ADD COLUMN "modified_by" VARCHAR(255) NULL`);

        await queryRunner.query(`ALTER TABLE "grille_tarifaire" ADD COLUMN "created_by" VARCHAR(255) NULL`);
        await queryRunner.query(`ALTER TABLE "grille_tarifaire" ADD COLUMN "modified_by" VARCHAR(255) NULL`);

        await queryRunner.query(`ALTER TABLE "prix_produit" ADD COLUMN "created_by" VARCHAR(255) NULL`);
        await queryRunner.query(`ALTER TABLE "prix_produit" ADD COLUMN "modified_by" VARCHAR(255) NULL`);

        await queryRunner.query(`ALTER TABLE "produit_versions" ADD COLUMN "created_by" VARCHAR(255) NULL`);
        await queryRunner.query(`ALTER TABLE "produit_versions" ADD COLUMN "modified_by" VARCHAR(255) NULL`);

        await queryRunner.query(`ALTER TABLE "produit_documents" ADD COLUMN "created_by" VARCHAR(255) NULL`);
        await queryRunner.query(`ALTER TABLE "produit_documents" ADD COLUMN "modified_by" VARCHAR(255) NULL`);

        await queryRunner.query(`ALTER TABLE "produit_publications" ADD COLUMN "created_by" VARCHAR(255) NULL`);
        await queryRunner.query(`ALTER TABLE "produit_publications" ADD COLUMN "modified_by" VARCHAR(255) NULL`);

        // Commercial domain tables
        await queryRunner.query(`ALTER TABLE "modeledistributions" ADD COLUMN "created_by" VARCHAR(255) NULL`);
        await queryRunner.query(`ALTER TABLE "modeledistributions" ADD COLUMN "modified_by" VARCHAR(255) NULL`);

        await queryRunner.query(`ALTER TABLE "apporteurs" ADD COLUMN "created_by" VARCHAR(255) NULL`);
        await queryRunner.query(`ALTER TABLE "apporteurs" ADD COLUMN "modified_by" VARCHAR(255) NULL`);

        await queryRunner.query(`ALTER TABLE "baremes_commission" ADD COLUMN "created_by" VARCHAR(255) NULL`);
        await queryRunner.query(`ALTER TABLE "baremes_commission" ADD COLUMN "modified_by" VARCHAR(255) NULL`);

        await queryRunner.query(`ALTER TABLE "paliers_commission" ADD COLUMN "created_by" VARCHAR(255) NULL`);
        await queryRunner.query(`ALTER TABLE "paliers_commission" ADD COLUMN "modified_by" VARCHAR(255) NULL`);

        // Contrats domain tables
        await queryRunner.query(`ALTER TABLE "contrat" ADD COLUMN "created_by" VARCHAR(255) NULL`);
        await queryRunner.query(`ALTER TABLE "contrat" ADD COLUMN "modified_by" VARCHAR(255) NULL`);

        await queryRunner.query(`ALTER TABLE "ligne_contrat" ADD COLUMN "created_by" VARCHAR(255) NULL`);
        await queryRunner.query(`ALTER TABLE "ligne_contrat" ADD COLUMN "modified_by" VARCHAR(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Products domain tables
        await queryRunner.query(`ALTER TABLE "produit" DROP COLUMN "modified_by"`);
        await queryRunner.query(`ALTER TABLE "produit" DROP COLUMN "created_by"`);

        await queryRunner.query(`ALTER TABLE "gamme" DROP COLUMN "modified_by"`);
        await queryRunner.query(`ALTER TABLE "gamme" DROP COLUMN "created_by"`);

        await queryRunner.query(`ALTER TABLE "grille_tarifaire" DROP COLUMN "modified_by"`);
        await queryRunner.query(`ALTER TABLE "grille_tarifaire" DROP COLUMN "created_by"`);

        await queryRunner.query(`ALTER TABLE "prix_produit" DROP COLUMN "modified_by"`);
        await queryRunner.query(`ALTER TABLE "prix_produit" DROP COLUMN "created_by"`);

        await queryRunner.query(`ALTER TABLE "produit_versions" DROP COLUMN "modified_by"`);
        await queryRunner.query(`ALTER TABLE "produit_versions" DROP COLUMN "created_by"`);

        await queryRunner.query(`ALTER TABLE "produit_documents" DROP COLUMN "modified_by"`);
        await queryRunner.query(`ALTER TABLE "produit_documents" DROP COLUMN "created_by"`);

        await queryRunner.query(`ALTER TABLE "produit_publications" DROP COLUMN "modified_by"`);
        await queryRunner.query(`ALTER TABLE "produit_publications" DROP COLUMN "created_by"`);

        // Commercial domain tables
        await queryRunner.query(`ALTER TABLE "modeledistributions" DROP COLUMN "modified_by"`);
        await queryRunner.query(`ALTER TABLE "modeledistributions" DROP COLUMN "created_by"`);

        await queryRunner.query(`ALTER TABLE "apporteurs" DROP COLUMN "modified_by"`);
        await queryRunner.query(`ALTER TABLE "apporteurs" DROP COLUMN "created_by"`);

        await queryRunner.query(`ALTER TABLE "baremes_commission" DROP COLUMN "modified_by"`);
        await queryRunner.query(`ALTER TABLE "baremes_commission" DROP COLUMN "created_by"`);

        await queryRunner.query(`ALTER TABLE "paliers_commission" DROP COLUMN "modified_by"`);
        await queryRunner.query(`ALTER TABLE "paliers_commission" DROP COLUMN "created_by"`);

        // Contrats domain tables
        await queryRunner.query(`ALTER TABLE "contrat" DROP COLUMN "modified_by"`);
        await queryRunner.query(`ALTER TABLE "contrat" DROP COLUMN "created_by"`);

        await queryRunner.query(`ALTER TABLE "ligne_contrat" DROP COLUMN "modified_by"`);
        await queryRunner.query(`ALTER TABLE "ligne_contrat" DROP COLUMN "created_by"`);
    }

}
