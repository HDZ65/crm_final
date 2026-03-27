import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WebhookEventType } from '../enums/webhook-event-type.enum';
import { WebhookEventHandler } from './webhook-event-handler.interface';

const EMPTY_UUID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class PolicyEventHandler implements WebhookEventHandler {
  private readonly logger = new Logger(PolicyEventHandler.name);

  constructor(private readonly dataSource: DataSource) {}

  async handle(payload: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
    const keycloakGroupId = this.readString(payload, [
      'partnerId',
      'partner_id',
      'keycloakGroupId',
      'organisationId',
      'organisation_id',
    ]);
    const reference = this.readString(payload, [
      'policyReference',
      'policy_reference',
      'contractReference',
      'contract_reference',
      'reference',
    ]);

    if (!keycloakGroupId || !reference) {
      return {
        success: false,
        error: 'Missing required policy identifiers (partner and/or reference)',
      };
    }

    const rawEventType = this.readString(payload, ['__eventType']) || WebhookEventType.ISSUE_POLICY;
    const eventType = this.normalizeEventType(rawEventType);

    try {
      const existing = await this.dataSource.query(
        `SELECT id, statut, date_debut, date_fin, date_signature, montant, renewal_status, renewal_date
         FROM contrat WHERE keycloak_group_id = $1 AND reference = $2 LIMIT 1`,
        [keycloakGroupId, reference],
      ) as Record<string, unknown>[];

      if (eventType === WebhookEventType.CANCEL) {
        if (!existing.length) {
          return { success: false, error: `Contrat ${reference} not found for cancellation` };
        }
        const dateFin = this.readString(payload, ['dateFin', 'date_fin', 'cancelledAt']) || existing[0]!.date_fin as string;
        await this.dataSource.query(
          `UPDATE contrat SET statut = 'cancelled', date_fin = $1, updated_at = NOW() WHERE id = $2`,
          [dateFin, existing[0]!.id],
        );
        this.logger.log(`Cancelled contrat ${reference}`);
        return { success: true };
      }

      if (eventType === WebhookEventType.RENEWAL) {
        if (!existing.length) {
          return { success: false, error: `Contrat ${reference} not found for renewal` };
        }
        const renewalDateValue = this.readString(payload, ['renewalDate', 'renewal_date']);
        const renewalDate = renewalDateValue ? new Date(renewalDateValue).toISOString() : new Date().toISOString();
        await this.dataSource.query(
          `UPDATE contrat SET statut = 'renewed', renewal_status = 'renewed', renewal_date = $1, updated_at = NOW() WHERE id = $2`,
          [renewalDate, existing[0]!.id],
        );
        this.logger.log(`Renewed contrat ${reference}`);
        return { success: true };
      }

      const statut = this.readString(payload, ['status', 'statut']) || 'active';
      const dateDebut = this.readString(payload, ['dateDebut', 'date_debut', 'startDate']);
      const dateSignature = this.readString(payload, ['dateSignature', 'date_signature', 'signedAt']);
      const montant = this.readNumber(payload, ['amount', 'montant'], null);

      if (existing.length) {
        await this.dataSource.query(
          `UPDATE contrat
           SET statut = $1,
               date_debut = COALESCE($2, date_debut),
               date_signature = COALESCE($3, date_signature),
               montant = COALESCE($4, montant),
               updated_at = NOW()
           WHERE id = $5`,
          [statut, dateDebut, dateSignature, montant, existing[0]!.id],
        );
        this.logger.log(`Updated contrat ${reference} from issuePolicy webhook`);
        return { success: true };
      }

      const today = new Date().toISOString().slice(0, 10);
      await this.dataSource.query(
        `INSERT INTO contrat
         (keycloak_group_id, reference, statut, date_debut, date_fin, date_signature,
          montant, devise, client_id, commercial_id, societe_id, titre, description,
          type, fournisseur, document_url, notes, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW(),NOW())`,
        [
          keycloakGroupId,
          reference,
          statut,
          dateDebut || today,
          this.readString(payload, ['dateFin', 'date_fin']),
          dateSignature || today,
          montant,
          this.readString(payload, ['currency', 'devise']) || 'EUR',
          this.readString(payload, ['clientId', 'client_id']) || EMPTY_UUID,
          this.readString(payload, ['commercialId', 'commercial_id']) || EMPTY_UUID,
          this.readString(payload, ['societeId', 'societe_id']),
          this.readString(payload, ['title', 'titre']),
          this.readString(payload, ['description']),
          this.readString(payload, ['type']),
          this.readString(payload, ['provider', 'fournisseur']),
          this.readString(payload, ['documentUrl', 'document_url']),
          this.readString(payload, ['notes']),
        ],
      );
      this.logger.log(`Created contrat ${reference} from issuePolicy webhook`);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`PolicyEventHandler failed: ${message}`);
      return { success: false, error: message };
    }
  }

  private normalizeEventType(value: string): WebhookEventType {
    const canonical = value.replace(/[_\-\s]/g, '').toLowerCase();
    if (canonical === 'cancel') return WebhookEventType.CANCEL;
    if (canonical === 'renewal') return WebhookEventType.RENEWAL;
    return WebhookEventType.ISSUE_POLICY;
  }

  private readString(payload: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    }
    return null;
  }

  private readNumber(payload: Record<string, unknown>, keys: string[], fallback: number | null): number | null {
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
}
