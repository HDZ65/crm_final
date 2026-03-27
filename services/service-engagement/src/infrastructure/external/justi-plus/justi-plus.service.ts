import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID as uuid } from 'crypto';

// ========== Types for Justi+ API ==========

export interface JustiPlusCustomer {
  externalId: string;
  clientId: string;
  organisationId: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  status: string;
}

export interface JustiPlusSubscription {
  externalId: string;
  clientId: string;
  contratId: string;
  organisationId: string;
  plan: string;
  status: 'active' | 'suspended' | 'cancelled';
  startDate: string;
  endDate?: string;
}

export interface JustiPlusCase {
  externalId: string;
  clientId: string;
  contratId: string;
  organisationId: string;
  titre: string;
  description: string;
  type: string;
  statut: string;
  domaineJuridique: string;
  avocatAssigne: string;
  dateOuverture: string;
  dateCloture?: string;
  montantCouvert: number;
  montantFranchise: number;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface JustiPlusSyncResult {
  cases: JustiPlusCase[];
  totalFetched: number;
  syncTimestamp: string;
}

export interface JustiPlusActionResponse {
  success: boolean;
  externalId: string;
  action: string;
  message: string;
  timestamp: string;
}

@Injectable()
export class JustiPlusService {
  private readonly logger = new Logger(JustiPlusService.name);
  private readonly useMock: boolean;
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.useMock = this.configService.get<string>('JUSTI_PLUS_USE_MOCK', 'true') === 'true';
    this.apiUrl = this.configService.get<string>('JUSTI_PLUS_API_URL', 'https://api.justi-plus.fr/v1');
    this.apiKey = this.configService.get<string>('JUSTI_PLUS_API_KEY', '');

    if (!this.apiKey && !this.useMock) {
      this.logger.warn('Justi+ API key not configured. Service will use mock data.');
    }

    if (this.useMock) {
      this.logger.log('Justi+ service running in MOCK mode (JUSTI_PLUS_USE_MOCK=true)');
    }
  }

  // ========== Sync Operations ==========

  async fetchCases(
    organisationId: string,
    clientId?: string,
    since?: string,
  ): Promise<JustiPlusSyncResult> {
    this.logger.debug('Fetching cases from Justi+', { organisationId, clientId, since });

    if (this.useMock) {
      return this.getMockSyncResult(organisationId, clientId);
    }

    // Real API call would go here
    this.logger.warn('Real Justi+ API not yet implemented, returning empty result');
    return { cases: [], totalFetched: 0, syncTimestamp: new Date().toISOString() };
  }

  // ========== Outgoing API (suspend/resume/cancel) ==========

  async suspendSubscription(externalId: string): Promise<JustiPlusActionResponse> {
    this.logger.debug('Suspending subscription on Justi+', { externalId });

    if (this.useMock) {
      return this.getMockActionResponse(externalId, 'suspend');
    }

    // Real API call would go here
    this.logger.warn('Real Justi+ API not yet implemented');
    return this.getMockActionResponse(externalId, 'suspend');
  }

  async resumeSubscription(externalId: string): Promise<JustiPlusActionResponse> {
    this.logger.debug('Resuming subscription on Justi+', { externalId });

    if (this.useMock) {
      return this.getMockActionResponse(externalId, 'resume');
    }

    // Real API call would go here
    this.logger.warn('Real Justi+ API not yet implemented');
    return this.getMockActionResponse(externalId, 'resume');
  }

  async cancelSubscription(externalId: string): Promise<JustiPlusActionResponse> {
    this.logger.debug('Cancelling subscription on Justi+', { externalId });

    if (this.useMock) {
      return this.getMockActionResponse(externalId, 'cancel');
    }

    // Real API call would go here
    this.logger.warn('Real Justi+ API not yet implemented');
    return this.getMockActionResponse(externalId, 'cancel');
  }

  // ========== Mock Data ==========

  private getMockSyncResult(organisationId: string, clientId?: string): JustiPlusSyncResult {
    this.logger.debug('Using mock data for Justi+ sync');

    const now = new Date();
    const cases: JustiPlusCase[] = [
      {
        externalId: `JP-${uuid().slice(0, 8)}`,
        clientId: clientId || uuid(),
        contratId: uuid(),
        organisationId,
        titre: 'Litige bail commercial',
        description: 'Contestation des charges locatives par le bailleur.',
        type: 'litige',
        statut: 'en_cours',
        domaineJuridique: 'droit immobilier',
        avocatAssigne: 'Me. Dupont',
        dateOuverture: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        montantCouvert: 5000,
        montantFranchise: 250,
        notes: 'Dossier en cours de traitement',
        metadata: { urgence: false },
      },
      {
        externalId: `JP-${uuid().slice(0, 8)}`,
        clientId: clientId || uuid(),
        contratId: uuid(),
        organisationId,
        titre: 'Conseil droit du travail',
        description: 'Consultation relative au licenciement contesté.',
        type: 'conseil',
        statut: 'ouvert',
        domaineJuridique: 'droit du travail',
        avocatAssigne: 'Me. Martin',
        dateOuverture: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        montantCouvert: 2000,
        montantFranchise: 100,
        metadata: { urgence: true },
      },
    ];

    return {
      cases,
      totalFetched: cases.length,
      syncTimestamp: now.toISOString(),
    };
  }

  private getMockActionResponse(externalId: string, action: string): JustiPlusActionResponse {
    this.logger.debug(`Using mock response for Justi+ ${action}`, { externalId });

    return {
      success: true,
      externalId,
      action,
      message: `Subscription ${action} successfully (mock)`,
      timestamp: new Date().toISOString(),
    };
  }
}
