import { Injectable, Logger } from '@nestjs/common';
import { CfastConfigEntity } from '../../../domain/cfast/entities/cfast-config.entity';
import {
  CfastBillingSession,
  CfastInvoice,
  CfastInvoiceDetail,
  CfastOAuthTokenResponse,
  CfastPaginatedResponse,
} from '../../../domain/cfast/types/cfast-api.types';
import { EncryptionService } from '../../security/encryption.service';

@Injectable()
export class CfastApiClient {
  private readonly logger = new Logger(CfastApiClient.name);

  private readonly tokenCache: Map<string, { token: string; expiresAt: number }> = new Map();
  private readonly tokenToOrganisationId: Map<string, string> = new Map();
  private readonly configCache: Map<string, CfastConfigEntity> = new Map();
  private readonly defaultBaseUrl = 'https://v2.cfast.fr';

  private lastCallTime = 0;

  constructor(private readonly encryptionService: EncryptionService) {}

  async authenticate(config: CfastConfigEntity): Promise<string> {
    this.configCache.set(config.organisationId, config);

    const cachedToken = this.tokenCache.get(config.organisationId);
    if (cachedToken && cachedToken.expiresAt - 60_000 > Date.now()) {
      return cachedToken.token;
    }

    const clientId = this.encryptionService.decrypt(config.clientIdEncrypted);
    const clientSecret = this.encryptionService.decrypt(config.clientSecretEncrypted);
    const username = this.encryptionService.decrypt(config.usernameEncrypted);
    const password = this.encryptionService.decrypt(config.passwordEncrypted);

    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: clientId,
      client_secret: clientSecret,
      username,
      password,
      scope: config.scopes || 'openid identity bill',
    });

    const tokenUrl = `${this.getBaseUrl(config.baseUrl)}/auth/connect/token`;
    const response = await this.fetchWithRateLimit(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorBody = await this.safeReadBody(response);
      this.logger.warn(
        `CFAST authentication failed for organisation ${config.organisationId} (status=${response.status})`,
      );
      throw new Error(`CFAST authentication failed (${response.status}): ${errorBody}`);
    }

    const payload = (await response.json()) as CfastOAuthTokenResponse;
    if (!payload?.access_token) {
      throw new Error('CFAST authentication response does not contain access_token');
    }

    const expiresInSeconds = Number(payload.expires_in || 36000);
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    this.tokenCache.set(config.organisationId, {
      token: payload.access_token,
      expiresAt,
    });
    this.tokenToOrganisationId.set(payload.access_token, config.organisationId);

    return payload.access_token;
  }

  async listBillingSessions(token: string): Promise<CfastBillingSession[]> {
    const response = await this.fetchBillingApi(token, {
      method: 'GET',
      path: '/api/billing/billing-sessions',
    });

    const payload = (await response.json()) as unknown;
    return this.extractList<CfastBillingSession>(payload);
  }

  async listInvoices(token: string, billingSessionId?: string): Promise<CfastInvoice[]> {
    const endpoint = new URL('/api/billing/bills/paginated', this.defaultBaseUrl);
    endpoint.searchParams.set('page', '1');
    endpoint.searchParams.set('pageSize', '1000');
    if (billingSessionId) {
      endpoint.searchParams.set('billingSessionId', billingSessionId);
    }

    const response = await this.fetchBillingApi(token, {
      method: 'GET',
      path: `${endpoint.pathname}${endpoint.search}`,
    });

    const payload = (await response.json()) as CfastPaginatedResponse<CfastInvoice> | CfastInvoice[];
    return this.extractList<CfastInvoice>(payload);
  }

  async getInvoice(token: string, invoiceId: string): Promise<CfastInvoiceDetail> {
    const response = await this.fetchBillingApi(token, {
      method: 'GET',
      path: `/api/billing/bills/${encodeURIComponent(invoiceId)}`,
    });

    return (await response.json()) as CfastInvoiceDetail;
  }

  async downloadInvoicePdf(token: string, invoiceId: string): Promise<Buffer> {
    const response = await this.fetchBillingApi(token, {
      method: 'GET',
      path: `/api/billing/bills/${encodeURIComponent(invoiceId)}/render`,
    });

    const file = await response.arrayBuffer();
    return Buffer.from(file);
  }

  private async fetchBillingApi(
    token: string,
    options: {
      method: string;
      path: string;
      body?: string;
      headers?: Record<string, string>;
    },
  ): Promise<Response> {
    let currentToken = token;
    let retried401 = false;
    let retried429 = false;
    let retried5xx = false;

    for (;;) {
      const response = await this.fetchWithRateLimit(`${this.defaultBaseUrl}${options.path}`, {
        method: options.method,
        headers: {
          Authorization: `Bearer ${currentToken}`,
          Accept: 'application/json',
          ...options.headers,
        },
        body: options.body,
      });

      if (response.ok) {
        return response;
      }

      if (response.status === 401 && !retried401) {
        retried401 = true;
        const refreshedToken = await this.reauthenticateFromToken(currentToken);
        if (refreshedToken) {
          currentToken = refreshedToken;
          continue;
        }
      }

      if (response.status === 429 && !retried429) {
        retried429 = true;
        const retryAfterMs = this.getRetryAfterMs(response);
        await this.sleep(retryAfterMs);
        continue;
      }

      if (response.status >= 500 && response.status < 600 && !retried5xx) {
        retried5xx = true;
        await this.sleep(1_000);
        continue;
      }

      const errorBody = await this.safeReadBody(response);
      throw new Error(`CFAST API request failed (${response.status}): ${errorBody}`);
    }
  }

  private async reauthenticateFromToken(token: string): Promise<string | null> {
    const organisationId = this.tokenToOrganisationId.get(token);
    if (!organisationId) {
      return null;
    }

    this.tokenToOrganisationId.delete(token);
    this.tokenCache.delete(organisationId);

    const config = this.configCache.get(organisationId);
    if (!config) {
      return null;
    }

    return this.authenticate(config);
  }

  private async fetchWithRateLimit(url: string, init: RequestInit): Promise<Response> {
    const now = Date.now();
    const wait = 500 - (now - this.lastCallTime);
    if (wait > 0) {
      await this.sleep(wait);
    }
    this.lastCallTime = Date.now();

    return fetch(url, init);
  }

  private getBaseUrl(baseUrl: string | null | undefined): string {
    const candidate = (baseUrl || this.defaultBaseUrl).trim();
    return candidate.replace(/\/$/, '');
  }

  private getRetryAfterMs(response: Response): number {
    const retryAfterSeconds = Number(response.headers.get('Retry-After'));
    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
      return retryAfterSeconds * 1000;
    }

    const cfastRetryAfterMs = Number(response.headers.get('X-RateLimit-Retry-After'));
    if (Number.isFinite(cfastRetryAfterMs) && cfastRetryAfterMs > 0) {
      return cfastRetryAfterMs;
    }

    return 1_000;
  }

  private extractList<T>(payload: unknown): T[] {
    if (Array.isArray(payload)) {
      return payload as T[];
    }

    if (payload && typeof payload === 'object') {
      const candidate = payload as CfastPaginatedResponse<T>;
      const possibleArrays = [candidate.data, candidate.items, candidate.results, candidate.rows];
      for (const entry of possibleArrays) {
        if (Array.isArray(entry)) {
          return entry;
        }
      }
    }

    return [];
  }

  private async safeReadBody(response: Response): Promise<string> {
    try {
      return await response.text();
    } catch {
      return '';
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
