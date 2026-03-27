import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

// ============================================================================
// WINCASH TYPES
// ============================================================================

export interface WincashCustomer {
  externalId: string;
  email: string;
  firstName: string;
  lastName: string;
  loyaltyPoints: number;
  tier: string;
  metadata?: Record<string, any>;
}

export interface WincashSubscription {
  externalId: string;
  customerId: string;
  programId: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  startDate: string;
  endDate?: string;
  metadata?: Record<string, any>;
}

export interface WincashCashbackOperation {
  externalId: string;
  customerId: string;
  contratId: string;
  type: 'gain' | 'utilisation' | 'ajustement' | 'expiration' | 'bonus';
  montant: number;
  devise: string;
  description: string;
  dateOperation: string;
  metadata?: Record<string, any>;
}

export interface WincashSyncResult {
  operationsCreees: number;
  operationsMisesAJour: number;
  operationsIgnorees: number;
  erreurs: number;
  errors: Array<{ referenceExterne: string; message: string; code: string }>;
  syncId: string;
  syncedAt: Date;
}

// ============================================================================
// WINCASH SERVICE (avec toggle mock)
// ============================================================================

@Injectable()
export class WincashService {
  private readonly logger = new Logger(WincashService.name);
  private readonly useMock: boolean;
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.useMock = this.configService.get<string>('WINCASH_USE_MOCK', 'true') === 'true';
    this.apiUrl = this.configService.get<string>('WINCASH_API_URL', 'https://api.wincash.fr/v1');
    this.apiKey = this.configService.get<string>('WINCASH_API_KEY', '');

    if (!this.apiKey && !this.useMock) {
      this.logger.warn('WinCash API key not configured. Service will use mock data.');
    }

    this.logger.log(`WincashService initialized (mock=${this.useMock})`);
  }

  // ========== CUSTOMER ==========

  async getCustomer(externalId: string): Promise<WincashCustomer | null> {
    if (this.useMock) {
      return this.getMockCustomer(externalId);
    }

    try {
      this.logger.debug(`Fetching customer ${externalId} from WinCash API`);
      // TODO: Implement real API call
      return this.getMockCustomer(externalId);
    } catch (error: any) {
      this.logger.error(`Failed to fetch customer ${externalId}`, error.message);
      throw error;
    }
  }

  async syncCustomer(externalId: string): Promise<WincashCustomer> {
    if (this.useMock) {
      return this.getMockCustomer(externalId);
    }

    try {
      this.logger.debug(`Syncing customer ${externalId} from WinCash`);
      // TODO: Implement real API call
      return this.getMockCustomer(externalId);
    } catch (error: any) {
      this.logger.error(`Failed to sync customer ${externalId}`, error.message);
      throw error;
    }
  }

  // ========== SUBSCRIPTION ==========

  async getSubscription(externalId: string): Promise<WincashSubscription | null> {
    if (this.useMock) {
      return this.getMockSubscription(externalId);
    }

    try {
      this.logger.debug(`Fetching subscription ${externalId} from WinCash API`);
      // TODO: Implement real API call
      return this.getMockSubscription(externalId);
    } catch (error: any) {
      this.logger.error(`Failed to fetch subscription ${externalId}`, error.message);
      throw error;
    }
  }

  async syncSubscription(externalId: string): Promise<WincashSubscription> {
    if (this.useMock) {
      return this.getMockSubscription(externalId);
    }

    try {
      this.logger.debug(`Syncing subscription ${externalId} from WinCash`);
      // TODO: Implement real API call
      return this.getMockSubscription(externalId);
    } catch (error: any) {
      this.logger.error(`Failed to sync subscription ${externalId}`, error.message);
      throw error;
    }
  }

  // ========== CASHBACK ==========

  async syncCashbackOperations(
    organisationId: string,
    clientId?: string,
    since?: string,
    forceFullSync = false,
  ): Promise<WincashSyncResult> {
    if (this.useMock) {
      return this.getMockSyncResult();
    }

    try {
      this.logger.debug(`Syncing cashback operations for org=${organisationId}, client=${clientId || 'all'}`);
      // TODO: Implement real API call
      return this.getMockSyncResult();
    } catch (error: any) {
      this.logger.error('Failed to sync cashback operations', error.message);
      throw error;
    }
  }

  async getCashbackOperation(externalId: string): Promise<WincashCashbackOperation | null> {
    if (this.useMock) {
      return this.getMockCashbackOperation(externalId);
    }

    try {
      this.logger.debug(`Fetching cashback operation ${externalId} from WinCash API`);
      // TODO: Implement real API call
      return this.getMockCashbackOperation(externalId);
    } catch (error: any) {
      this.logger.error(`Failed to fetch cashback operation ${externalId}`, error.message);
      throw error;
    }
  }

  // ========== MOCK DATA ==========

  private getMockCustomer(externalId: string): WincashCustomer {
    return {
      externalId,
      email: `customer-${externalId}@mock.wincash.fr`,
      firstName: 'Jean',
      lastName: 'Dupont',
      loyaltyPoints: 1250,
      tier: 'gold',
      metadata: { source: 'mock' },
    };
  }

  private getMockSubscription(externalId: string): WincashSubscription {
    return {
      externalId,
      customerId: `cust-${randomUUID().slice(0, 8)}`,
      programId: 'cashback-prevoyance',
      status: 'active',
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: { source: 'mock' },
    };
  }

  private getMockCashbackOperation(externalId: string): WincashCashbackOperation {
    return {
      externalId,
      customerId: `cust-${randomUUID().slice(0, 8)}`,
      contratId: `contrat-${randomUUID().slice(0, 8)}`,
      type: 'gain',
      montant: 25.50,
      devise: 'EUR',
      description: 'Cashback sur contrat prévoyance - Mock',
      dateOperation: new Date().toISOString(),
      metadata: { source: 'mock' },
    };
  }

  private getMockSyncResult(): WincashSyncResult {
    return {
      operationsCreees: 3,
      operationsMisesAJour: 1,
      operationsIgnorees: 0,
      erreurs: 0,
      errors: [],
      syncId: `sync-${randomUUID().slice(0, 8)}`,
      syncedAt: new Date(),
    };
  }
}
