import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WebhookEventHandler } from './webhook-event-handler.interface';

@Injectable()
export class CommissionReportEventHandler implements WebhookEventHandler {
  private readonly logger = new Logger(CommissionReportEventHandler.name);

  constructor(private readonly dataSource: DataSource) {}

  async handle(payload: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
    const keycloakGroupId = this.readString(payload, [
      'partnerId',
      'partner_id',
      'keycloakGroupId',
      'organisationId',
      'organisation_id',
    ]);
    const apporteurId = this.readString(payload, ['apporteurId', 'apporteur_id', 'brokerId']);
    const periode = this.normalizePeriode(this.readString(payload, ['periode', 'reportPeriod', 'report_period']) || '');

    if (!keycloakGroupId || !apporteurId || !periode) {
      return {
        success: false,
        error: 'Missing required commission report identifiers (partner, apporteur, periode)',
      };
    }

    const reference =
      this.readString(payload, ['reference', 'bordereauReference', 'bordereau_reference']) ||
      `BR-${periode}-${apporteurId.slice(0, 8)}`;

    const statut = this.normalizeStatut(this.readString(payload, ['statut', 'status', 'statutBordereau']));
    const totalBrut = this.readNumber(payload, ['totalBrut', 'total_brut'], 0);
    const totalReprises = this.readNumber(payload, ['totalReprises', 'total_reprises'], 0);
    const totalAcomptes = this.readNumber(payload, ['totalAcomptes', 'total_acomptes'], 0);
    const totalNetAPayer = this.readNumber(payload, ['totalNetAPayer', 'total_net_a_payer'], 0);
    const nombreLignes = this.readInteger(payload, ['nombreLignes', 'nombre_lignes'], 0);
    const commentaire = this.readString(payload, ['commentaire', 'comment']);

    try {
      const existing = await this.dataSource.query(
        `SELECT id FROM bordereaux_commission WHERE reference = $1 AND keycloak_group_id = $2 LIMIT 1`,
        [reference, keycloakGroupId],
      ) as { id: string }[];

      if (existing.length > 0) {
        await this.dataSource.query(
          `UPDATE bordereaux_commission
           SET total_brut = $1, total_reprises = $2, total_acomptes = $3,
               total_net_a_payer = $4, nombre_lignes = $5, statut_bordereau = $6,
               commentaire = COALESCE($7, commentaire), updated_at = NOW()
           WHERE id = $8`,
          [totalBrut, totalReprises, totalAcomptes, totalNetAPayer, nombreLignes, statut, commentaire, existing[0]!.id],
        );
        this.logger.log(`Updated bordereau ${reference} from commission report webhook`);
      } else {
        const creePar = this.readString(payload, ['createdBy', 'created_by', 'source']) || 'webhook_commission';
        await this.dataSource.query(
          `INSERT INTO bordereaux_commission
           (keycloak_group_id, apporteur_id, periode, reference, total_brut, total_reprises,
            total_acomptes, total_net_a_payer, nombre_lignes, statut_bordereau, commentaire,
            cree_par, date_validation, validateur_id, date_export, fichier_pdf_url,
            fichier_excel_url, hash_sha256, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NULL,NULL,NULL,NULL,NULL,NULL,NOW(),NOW())`,
          [keycloakGroupId, apporteurId, periode, reference, totalBrut, totalReprises,
           totalAcomptes, totalNetAPayer, nombreLignes, statut, commentaire, creePar],
        );
        this.logger.log(`Imported new bordereau ${reference} from commission report webhook`);
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`CommissionReportEventHandler failed: ${message}`);
      return { success: false, error: message };
    }
  }

  private normalizePeriode(value: string): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}$/.test(trimmed)) return trimmed;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed.slice(0, 7);
    return null;
  }

  private normalizeStatut(value: string | null): string {
    if (!value) return 'brouillon';
    const normalized = value.trim().toLowerCase();
    if (['brouillon', 'valide', 'exporte', 'archive'].includes(normalized)) return normalized;
    return 'brouillon';
  }

  private readString(payload: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    }
    return null;
  }

  private readNumber(payload: Record<string, unknown>, keys: string[], fallback: number): number {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
    return fallback;
  }

  private readInteger(payload: Record<string, unknown>, keys: string[], fallback: number): number {
    return Math.max(0, Math.floor(this.readNumber(payload, keys, fallback)));
  }
}
