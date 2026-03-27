import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditRecurrenceReportTables1737800000000 implements MigrationInterface {
  name = 'CreateAuditRecurrenceReportTables1737800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ===== ENUMS =====
    await queryRunner.query(`
      CREATE TYPE commission_audit_action_enum AS ENUM (
        'commission_calculated', 'commission_created', 'commission_updated', 'commission_deleted', 'commission_status_changed',
        'recurrence_generated', 'recurrence_stopped',
        'reprise_created', 'reprise_applied', 'reprise_cancelled', 'reprise_regularized',
        'report_negatif_created', 'report_negatif_applied', 'report_negatif_cleared',
        'bordereau_created', 'bordereau_validated', 'bordereau_exported', 'bordereau_archived',
        'ligne_selected', 'ligne_deselected', 'ligne_validated', 'ligne_rejected',
        'bareme_created', 'bareme_updated', 'bareme_activated', 'bareme_deactivated', 'bareme_version_created',
        'palier_created', 'palier_updated', 'palier_deleted'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE commission_audit_scope_enum AS ENUM (
        'commission', 'recurrence', 'reprise', 'report', 'bordereau', 'ligne', 'bareme', 'palier', 'engine'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE commission_statut_recurrence_enum AS ENUM (
        'active', 'suspendue', 'terminee', 'annulee'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE commission_statut_report_enum AS ENUM (
        'en_cours', 'apure', 'annule'
      )
    `);

    // ===== COMMISSION AUDIT LOGS TABLE =====
    await queryRunner.query(`
      CREATE TABLE commission_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        scope commission_audit_scope_enum NOT NULL,
        ref_id UUID,
        action commission_audit_action_enum NOT NULL,
        before_data JSONB,
        after_data JSONB,
        metadata JSONB,
        user_id VARCHAR(255),
        user_name VARCHAR(255),
        ip_address VARCHAR(45),
        motif TEXT,
        bareme_id UUID,
        bareme_version INTEGER,
        contrat_id UUID,
        apporteur_id UUID,
        periode VARCHAR(7),
        montant_calcule DECIMAL(12, 2),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Indexes for audit logs
    await queryRunner.query(`
      CREATE INDEX idx_commission_audit_org_created ON commission_audit_logs(organisation_id, created_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_commission_audit_scope_ref ON commission_audit_logs(scope, ref_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_commission_audit_action_created ON commission_audit_logs(action, created_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_commission_audit_org ON commission_audit_logs(organisation_id)
    `);

    // Immutability rules for audit (no updates, no deletes)
    await queryRunner.query(`
      CREATE RULE commission_audit_no_update AS ON UPDATE TO commission_audit_logs DO INSTEAD NOTHING
    `);
    await queryRunner.query(`
      CREATE RULE commission_audit_no_delete AS ON DELETE TO commission_audit_logs DO INSTEAD NOTHING
    `);

    // ===== COMMISSIONS RECURRENTES TABLE =====
    await queryRunner.query(`
      CREATE TABLE commissions_recurrentes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        commission_initiale_id UUID NOT NULL,
        contrat_id UUID NOT NULL,
        echeance_id UUID,
        apporteur_id UUID NOT NULL,
        bareme_id UUID NOT NULL,
        bareme_version INTEGER NOT NULL,
        periode VARCHAR(7) NOT NULL,
        numero_mois INTEGER NOT NULL,
        montant_base DECIMAL(12, 2) NOT NULL,
        taux_recurrence DECIMAL(5, 2) NOT NULL,
        montant_calcule DECIMAL(12, 2) NOT NULL,
        statut_recurrence commission_statut_recurrence_enum NOT NULL DEFAULT 'active',
        bordereau_id UUID,
        date_encaissement DATE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Indexes for recurrences
    await queryRunner.query(`
      CREATE INDEX idx_recurrence_org_contrat ON commissions_recurrentes(organisation_id, contrat_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_recurrence_apporteur_statut ON commissions_recurrentes(apporteur_id, statut_recurrence)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_recurrence_periode ON commissions_recurrentes(periode)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_recurrence_org ON commissions_recurrentes(organisation_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_recurrence_contrat ON commissions_recurrentes(contrat_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_recurrence_apporteur ON commissions_recurrentes(apporteur_id)
    `);

    // Unique constraint: one recurrence per contract per period
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_recurrence_unique_contrat_periode ON commissions_recurrentes(contrat_id, periode)
      WHERE statut_recurrence = 'active'
    `);

    // ===== REPORTS NEGATIFS TABLE =====
    await queryRunner.query(`
      CREATE TABLE reports_negatifs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        apporteur_id UUID NOT NULL,
        periode_origine VARCHAR(7) NOT NULL,
        montant_initial DECIMAL(12, 2) NOT NULL,
        montant_restant DECIMAL(12, 2) NOT NULL,
        statut_report commission_statut_report_enum NOT NULL DEFAULT 'en_cours',
        bordereau_origine_id UUID,
        derniere_periode_application VARCHAR(7),
        motif TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Indexes for reports negatifs
    await queryRunner.query(`
      CREATE INDEX idx_report_org_apporteur_statut ON reports_negatifs(organisation_id, apporteur_id, statut_report)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_report_periode_origine ON reports_negatifs(periode_origine)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_report_org ON reports_negatifs(organisation_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_report_apporteur ON reports_negatifs(apporteur_id)
    `);

    // ===== UPDATE TRIGGERS =====
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_commission_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_recurrence_updated_at
      BEFORE UPDATE ON commissions_recurrentes
      FOR EACH ROW
      EXECUTE FUNCTION update_commission_updated_at()
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_report_updated_at
      BEFORE UPDATE ON reports_negatifs
      FOR EACH ROW
      EXECUTE FUNCTION update_commission_updated_at()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_report_updated_at ON reports_negatifs`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_recurrence_updated_at ON commissions_recurrentes`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_commission_updated_at`);

    // Drop reports_negatifs
    await queryRunner.query(`DROP INDEX IF EXISTS idx_report_apporteur`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_report_org`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_report_periode_origine`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_report_org_apporteur_statut`);
    await queryRunner.query(`DROP TABLE IF EXISTS reports_negatifs`);

    // Drop commissions_recurrentes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_recurrence_unique_contrat_periode`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_recurrence_apporteur`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_recurrence_contrat`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_recurrence_org`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_recurrence_periode`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_recurrence_apporteur_statut`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_recurrence_org_contrat`);
    await queryRunner.query(`DROP TABLE IF EXISTS commissions_recurrentes`);

    // Drop commission_audit_logs
    await queryRunner.query(`DROP RULE IF EXISTS commission_audit_no_delete ON commission_audit_logs`);
    await queryRunner.query(`DROP RULE IF EXISTS commission_audit_no_update ON commission_audit_logs`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_commission_audit_org`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_commission_audit_action_created`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_commission_audit_scope_ref`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_commission_audit_org_created`);
    await queryRunner.query(`DROP TABLE IF EXISTS commission_audit_logs`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS commission_statut_report_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS commission_statut_recurrence_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS commission_audit_scope_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS commission_audit_action_enum`);
  }
}
