import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Ajoute le soft delete (deleted_at) à toutes les tables du service core
 */
export class AddSoftDeleteToCoreTables1778000000000 implements MigrationInterface {
  name = 'AddSoftDeleteToCoreTables1778000000000';

  private readonly tables = [
    // Domaine Clients
    'clientbases',
    'client_entreprise',
    'client_partenaire',
    'adresse',
    'condition_paiement',
    'emission_facture',
    'facturation_par',
    'periode_facturation',
    'statut_client',
    'transporteur_compte',
    // Domaine Organisations
    'societe',
    'statut_partenaire',
    'role_partenaire',
    'membre_partenaire',
    'partenaire_marque_blanche',
    'theme_marque',
    'acces_societe',
    // Domaine Depanssur
    'abonnement_depanssur',
    'historique_statut_abonnement',
    'option_abonnement',
    'compteur_plafond',
    'dossier_declaratif',
    'historique_statut_dossier',
    'consentement',
    'webhook_event_log',
    // Domaine Documents
    'piece_jointe',
    'boite_mail',
    'document_audit_log',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      const tableExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = '${table}'
        )
      `);

      if (tableExists[0]?.exists) {
        await queryRunner.query(`
          ALTER TABLE ${table}
          ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL
        `);

        await queryRunner.query(`
          CREATE INDEX IF NOT EXISTS idx_${table}_not_deleted
          ON ${table} (id) WHERE deleted_at IS NULL
        `);
      }
    }

    // Index multi-tenant pour clients
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clientbases_org_active
      ON clientbases (partenaire_id) WHERE deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_clientbases_org_active`);

    for (const table of this.tables) {
      const tableExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = '${table}'
        )
      `);

      if (tableExists[0]?.exists) {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_${table}_not_deleted`);
        await queryRunner.query(`ALTER TABLE ${table} DROP COLUMN IF EXISTS deleted_at`);
      }
    }
  }
}
