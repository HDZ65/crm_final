import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoCardlessAccountEntity } from './entities/gocardless-account.entity.js';
import { GoCardlessMandateEntity, MandateStatus } from './entities/gocardless-mandate.entity.js';
import { RumGeneratorService } from './rum-generator.service.js';
import type { GoCardlessConfig } from '@proto/payments/payment';

@Injectable()
export class GoCardlessService {
  private readonly logger = new Logger(GoCardlessService.name);

  constructor(
    @InjectRepository(GoCardlessAccountEntity)
    private readonly accountRepository: Repository<GoCardlessAccountEntity>,
    @InjectRepository(GoCardlessMandateEntity)
    private readonly mandateRepository: Repository<GoCardlessMandateEntity>,
    private readonly rumGeneratorService: RumGeneratorService,
  ) {}

  private getBaseUrl(isSandbox: boolean): string {
    return isSandbox
      ? 'https://api-sandbox.gocardless.com'
      : 'https://api.gocardless.com';
  }

  async getAccountBySocieteId(societeId: string): Promise<GoCardlessAccountEntity | null> {
    return this.accountRepository.findOne({
      where: { societeId, actif: true },
    });
  }

  private async makeRequest<T>(
    config: GoCardlessConfig,
    method: string,
    path: string,
    body?: any,
  ): Promise<T> {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'GoCardless-Version': '2015-07-06',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`GoCardless API error: ${error}`);
      throw new Error(`GoCardless API error: ${response.status}`);
    }

    return response.json();
  }

  async createBillingRequest(
    societeId: string,
    params: {
      clientId: string;
      description?: string;
      redirectUri: string;
      exitUri?: string;
    },
  ): Promise<{ billingRequestId: string; authorisationUrl: string }> {
    const account = await this.getAccountBySocieteId(societeId);
    if (!account || !account.isConfigured()) {
      throw new NotFoundException('GoCardless account not configured');
    }

    const config: GoCardlessConfig = {
      accessToken: account.accessToken,
      baseUrl: this.getBaseUrl(account.isSandbox),
    };

    // Create billing request
    const billingRequest = await this.makeRequest<any>(config, 'POST', '/billing_requests', {
      billing_requests: {
        mandate_request: {
          scheme: 'sepa_core',
        },
      },
    });

    // Create billing request flow
    const flow = await this.makeRequest<any>(config, 'POST', '/billing_request_flows', {
      billing_request_flows: {
        redirect_uri: params.redirectUri,
        exit_uri: params.exitUri || params.redirectUri,
        links: {
          billing_request: billingRequest.billing_requests.id,
        },
      },
    });

    return {
      billingRequestId: billingRequest.billing_requests.id,
      authorisationUrl: flow.billing_request_flows.authorisation_url,
    };
  }

  async completeBillingRequest(
    societeId: string,
    billingRequestId: string,
    clientId: string,
  ): Promise<GoCardlessMandateEntity> {
    const account = await this.getAccountBySocieteId(societeId);
    if (!account || !account.isConfigured()) {
      throw new NotFoundException('GoCardless account not configured');
    }

    const config: GoCardlessConfig = {
      accessToken: account.accessToken,
      baseUrl: this.getBaseUrl(account.isSandbox),
    };

    // Get billing request details
    const billingRequest = await this.makeRequest<any>(
      config,
      'GET',
      `/billing_requests/${billingRequestId}`,
    );

    const mandateId = billingRequest.billing_requests.links?.mandate;
    const customerId = billingRequest.billing_requests.links?.customer;

    if (!mandateId) {
      throw new Error('Mandate not yet created');
    }

    // Get mandate details
    const mandateResponse = await this.makeRequest<any>(
      config,
      'GET',
      `/mandates/${mandateId}`,
    );

    const mandate = mandateResponse.mandates;

    const rum = await this.rumGeneratorService.generate(societeId);

    const mandateEntity = this.mandateRepository.create({
      clientId,
      societeId,
      mandateId: mandate.id,
      rum,
      customerId,
      customerBankAccountId: mandate.links?.customer_bank_account,
      status: this.mapMandateStatus(mandate.status),
      scheme: mandate.scheme,
      nextPossibleChargeDate: mandate.next_possible_charge_date
        ? new Date(mandate.next_possible_charge_date)
        : undefined,
    });

    this.logger.log(`Created mandate with RUM: ${rum} for client: ${clientId}`);

    return this.mandateRepository.save(mandateEntity) as Promise<GoCardlessMandateEntity>;
  }

  private mapMandateStatus(status: string): MandateStatus {
    const statusMap: Record<string, MandateStatus> = {
      pending_customer_approval: MandateStatus.PENDING_CUSTOMER_APPROVAL,
      pending_submission: MandateStatus.PENDING_SUBMISSION,
      submitted: MandateStatus.SUBMITTED,
      active: MandateStatus.ACTIVE,
      suspended_by_payer: MandateStatus.SUSPENDED_BY_PAYER,
      failed: MandateStatus.FAILED,
      cancelled: MandateStatus.CANCELLED,
      expired: MandateStatus.EXPIRED,
      consumed: MandateStatus.CONSUMED,
      blocked: MandateStatus.BLOCKED,
    };

    return statusMap[status] || MandateStatus.PENDING_SUBMISSION;
  }

  async getMandatesByClientId(
    societeId: string,
    clientId: string,
  ): Promise<GoCardlessMandateEntity[]> {
    return this.mandateRepository.find({
      where: { societeId, clientId },
      order: { createdAt: 'DESC' },
    });
  }

  async getActiveMandate(
    societeId: string,
    clientId: string,
  ): Promise<GoCardlessMandateEntity | null> {
    return this.mandateRepository.findOne({
      where: {
        societeId,
        clientId,
        status: MandateStatus.ACTIVE,
      },
    });
  }

  async createPayment(
    societeId: string,
    params: {
      mandateId: string;
      amount: number;
      currency?: string;
      description?: string;
      chargeDate?: string;
      metadata?: Record<string, string>;
    },
  ): Promise<{ paymentId: string; status: string; chargeDate: string }> {
    const account = await this.getAccountBySocieteId(societeId);
    if (!account || !account.isConfigured()) {
      throw new NotFoundException('GoCardless account not configured');
    }

    const mandate = await this.mandateRepository.findOne({
      where: { id: params.mandateId, societeId },
    });

    if (!mandate || !mandate.isActive()) {
      throw new NotFoundException('Mandate not found or not active');
    }

    const config: GoCardlessConfig = {
      accessToken: account.accessToken,
      baseUrl: this.getBaseUrl(account.isSandbox),
    };

    const payment = await this.makeRequest<any>(config, 'POST', '/payments', {
      payments: {
        amount: Math.round(params.amount * 100),
        currency: params.currency || 'EUR',
        description: params.description,
        charge_date: params.chargeDate,
        metadata: params.metadata,
        links: {
          mandate: mandate.mandateId,
        },
      },
    });

    return {
      paymentId: payment.payments.id,
      status: payment.payments.status,
      chargeDate: payment.payments.charge_date,
    };
  }

  async cancelMandate(societeId: string, mandateId: string): Promise<void> {
    const account = await this.getAccountBySocieteId(societeId);
    if (!account || !account.isConfigured()) {
      throw new NotFoundException('GoCardless account not configured');
    }

    const mandate = await this.mandateRepository.findOne({
      where: { id: mandateId, societeId },
    });

    if (!mandate) {
      throw new NotFoundException('Mandate not found');
    }

    const config: GoCardlessConfig = {
      accessToken: account.accessToken,
      baseUrl: this.getBaseUrl(account.isSandbox),
    };

    await this.makeRequest(config, 'POST', `/mandates/${mandate.mandateId}/actions/cancel`, {});

    mandate.status = MandateStatus.CANCELLED;
    await this.mandateRepository.save(mandate);
  }

  async getAccountInfo(societeId: string): Promise<{
    configured: boolean;
    sandboxMode: boolean;
  }> {
    const account = await this.getAccountBySocieteId(societeId);

    return {
      configured: account?.isConfigured() ?? false,
      sandboxMode: account?.isSandbox ?? true,
    };
  }

  async handleWebhook(
    societeId: string,
    payload: any,
    signature: string,
  ): Promise<void> {
    const account = await this.getAccountBySocieteId(societeId);
    if (!account) {
      throw new NotFoundException('GoCardless account not found');
    }

    // TODO: Verify webhook signature
    // Process events
    for (const event of payload.events || []) {
      await this.processEvent(societeId, event);
    }
  }

  private async processEvent(societeId: string, event: any): Promise<void> {
    this.logger.log(`Processing GoCardless event: ${event.resource_type} - ${event.action}`);

    if (event.resource_type === 'mandates') {
      const mandateId = event.links?.mandate;
      if (mandateId) {
        const mandate = await this.mandateRepository.findOne({
          where: { mandateId, societeId },
        });

        if (mandate) {
          mandate.status = this.mapMandateStatus(event.action);
          await this.mandateRepository.save(mandate);
        }
      }
    }
  }
}
