import { Injectable, Logger } from '@nestjs/common';
import type { CfastConfigEntity } from '../../../domain/cfast/entities/cfast-config.entity';
import type {
  CfastAddressDto,
  CfastAddressResponse,
  CfastBillingSession,
  CfastContactDto,
  CfastContactResponse,
  CfastCreateBillingPointDto,
  CfastCreateBillingPointResponse,
  CfastCreateContractDto,
  CfastCreateContractResponse,
  CfastCreateCustomerDto,
  CfastCreateCustomerResponse,
  CfastCreateServiceDto,
  CfastCreateServiceResponse,
  CfastCreateSiteDto,
  CfastCreateSiteResponse,
  CfastInvoice,
  CfastMarkPaidDto,
  CfastMarkPaidResponse,
  CfastOAuthTokenResponse,
} from '../../../domain/cfast/types/cfast-api.types';

@Injectable()
export class CfastApiClient {
  private readonly logger = new Logger(CfastApiClient.name);

  async authenticate(config: CfastConfigEntity): Promise<string> {
    const tokenUrl = `${config.baseUrl}/oauth/token`;

    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: config.clientIdEncrypted,
      client_secret: config.clientSecretEncrypted,
      username: config.usernameEncrypted,
      password: config.passwordEncrypted,
      scope: config.scopes || 'openid identity bill',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`CFAST authentication failed: HTTP ${response.status}`);
    }

    const data = (await response.json()) as CfastOAuthTokenResponse;
    return data.access_token;
  }

  async listBillingSessions(token: string): Promise<CfastBillingSession[]> {
    return this.getList<CfastBillingSession>(token, '/api/billing-sessions');
  }

  async listInvoices(token: string, billingSessionId?: string): Promise<CfastInvoice[]> {
    const path = billingSessionId
      ? `/api/billing-sessions/${billingSessionId}/invoices`
      : '/api/invoices';
    return this.getList<CfastInvoice>(token, path);
  }

  async createCustomer(token: string, dto: CfastCreateCustomerDto): Promise<CfastCreateCustomerResponse> {
    return this.post<CfastCreateCustomerResponse>(token, '/api/customers', dto);
  }

  async createCustomerAddress(
    token: string,
    customerId: string,
    dto: CfastAddressDto,
  ): Promise<CfastAddressResponse> {
    return this.post<CfastAddressResponse>(token, `/api/customers/${customerId}/addresses`, dto);
  }

  async createCustomerContact(
    token: string,
    customerId: string,
    dto: CfastContactDto,
  ): Promise<CfastContactResponse> {
    return this.post<CfastContactResponse>(token, `/api/customers/${customerId}/contacts`, dto);
  }

  async createBillingPoint(
    token: string,
    customerId: string,
    dto: CfastCreateBillingPointDto,
  ): Promise<CfastCreateBillingPointResponse> {
    return this.post<CfastCreateBillingPointResponse>(token, `/api/customers/${customerId}/billing-points`, dto);
  }

  async createSite(
    token: string,
    billingPointId: string,
    dto: CfastCreateSiteDto,
  ): Promise<CfastCreateSiteResponse> {
    return this.post<CfastCreateSiteResponse>(token, `/api/billing-points/${billingPointId}/sites`, dto);
  }

  async createContract(
    token: string,
    customerId: string,
    dto: CfastCreateContractDto,
  ): Promise<CfastCreateContractResponse> {
    return this.post<CfastCreateContractResponse>(token, `/api/customers/${customerId}/contracts`, dto);
  }

  async uploadContractFile(
    token: string,
    contractId: string,
    fileBuffer: Buffer,
    fileName: string,
  ): Promise<void> {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'application/pdf' });
    formData.append('file', blob, fileName);

    const response = await fetch(`/api/contracts/${contractId}/files`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      this.logger.warn(`CFAST uploadContractFile failed: HTTP ${response.status} for contract ${contractId}`);
    }
  }

  async createService(
    token: string,
    siteId: string,
    dto: CfastCreateServiceDto,
  ): Promise<CfastCreateServiceResponse> {
    return this.post<CfastCreateServiceResponse>(token, `/api/sites/${siteId}/services`, dto);
  }

  async markInvoicePaid(
    token: string,
    invoiceId: string,
    dto: CfastMarkPaidDto,
  ): Promise<CfastMarkPaidResponse> {
    return this.post<CfastMarkPaidResponse>(token, `/api/invoices/${invoiceId}/mark-paid`, dto);
  }

  private async getList<T>(token: string, path: string): Promise<T[]> {
    const response = await fetch(path, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CFAST GET ${path} failed: HTTP ${response.status}`);
    }

    const data = (await response.json()) as unknown;

    if (Array.isArray(data)) return data as T[];

    if (data && typeof data === 'object') {
      const candidate = data as Record<string, unknown>;
      for (const key of ['data', 'items', 'results', 'rows']) {
        if (Array.isArray(candidate[key])) return candidate[key] as T[];
      }
    }

    return [];
  }

  private async post<T>(token: string, path: string, body: unknown): Promise<T> {
    const response = await fetch(path, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`CFAST POST ${path} failed: HTTP ${response.status} - ${text}`);
    }

    return response.json() as Promise<T>;
  }
}
