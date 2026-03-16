import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEnergieRaccordement1774500000000
  implements MigrationInterface
{
  name = 'CreateEnergieRaccordement1774500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "partenaire_energie_enum" AS ENUM ('PLENITUDE', 'OHM')
    `);

    await queryRunner.query(`
      CREATE TYPE "statut_raccordement_enum" AS ENUM (
        'DEMANDE_ENVOYEE', 'EN_COURS', 'RACCORDE', 'ACTIVE', 'SUSPENDU', 'RESILIE', 'ERREUR'
      )
    `);

    // Create raccordement_energie table
    await queryRunner.query(`
      CREATE TABLE "raccordement_energie" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "client_id" uuid NOT NULL,
        "contrat_id" uuid NOT NULL,
        "partenaire" "partenaire_energie_enum" NOT NULL,
        "statut_raccordement" "statut_raccordement_enum" NOT NULL DEFAULT 'DEMANDE_ENVOYEE',
        "statut_activation" varchar(120),
        "adresse" varchar(500),
        "pdl_pce" varchar(120),
        "date_demande" TIMESTAMP WITH TIME ZONE NOT NULL,
        "date_activation" TIMESTAMP WITH TIME ZONE,
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_raccordement_energie" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_raccordement_energie_client_id"
      ON "raccordement_energie" ("client_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_raccordement_energie_contrat_id"
      ON "raccordement_energie" ("contrat_id")
    `);

    // Create energie_status_history table
    await queryRunner.query(`
      CREATE TABLE "energie_status_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "raccordement_id" uuid NOT NULL,
        "previous_status" varchar(60) NOT NULL,
        "new_status" varchar(60) NOT NULL,
        "source" varchar(120),
        "changed_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_energie_status_history" PRIMARY KEY ("id"),
        CONSTRAINT "FK_energie_status_history_raccordement"
          FOREIGN KEY ("raccordement_id") REFERENCES "raccordement_energie"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_energie_status_history_raccordement_id"
      ON "energie_status_history" ("raccordement_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "energie_status_history"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "raccordement_energie"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "statut_raccordement_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "partenaire_energie_enum"`);
  }
}
