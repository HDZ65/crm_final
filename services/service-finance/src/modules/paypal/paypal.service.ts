import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaypalAccountEntity } from './entities/paypal-account.entity';

interface PayPalAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expiresAt: number;
}

@Injectable()
export class PaypalService {
  private readonly logger = new Logger(PaypalService.name);
  private accessTokenCache: Map<string, PayPalAccessToken> = new Map();

  constructor(
    @InjectRepository(PaypalAccountEntity)
    private readonly paypalAccountRepository: Repository<PaypalAccountEntity>,
  ) {}

  private getBaseUrl(isSandbox: boolean): string {
    return isSandbox
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
  }

  async getAccountBySocieteId(societeId: string): Promise<PaypalAccountEntity | null> {
    return this.paypalAccountRepository.findOne({
      where: { societeId, actif: true },
    });
  }

  private async getAccessToken(account: PaypalAccountEntity): Promise<string> {
    const cacheKey = account.id;
    const cached = this.accessTokenCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.access_token;
    }

    const baseUrl = this.getBaseUrl(account.isSandbox);
    const auth = Buffer.from(`${account.clientId}:${account.clientSecret}`).toString('base64');

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Failed to get PayPal access token: ${error}`);
      throw new Error('Failed to authenticate with PayPal');
    }

    const data = await response.json() as { access_token: string; expires_in: number; token_type: string };

    this.accessTokenCache.set(cacheKey, {
      ...data,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    });

    return data.access_token;
  }

  async createOrder(
    societeId: string,
    params: {
      amount: number;
      currency?: string;
      returnUrl: string;
      cancelUrl: string;
      description?: string;
      referenceId?: string;
    },
  ): Promise<{ orderId: string; approvalUrl: string }> {
    const account = await this.getAccountBySocieteId(societeId);
    if (!account || !account.isConfigured()) {
      throw new NotFoundException('PayPal account not configured for this company');
    }

    const accessToken = await this.getAccessToken(account);
    const baseUrl = this.getBaseUrl(account.isSandbox);

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: params.referenceId,
            description: params.description,
            amount: {
              currency_code: params.currency || 'EUR',
              value: params.amount.toFixed(2),
            },
          },
        ],
        application_context: {
          return_url: params.returnUrl,
          cancel_url: params.cancelUrl,
          brand_name: 'CRM',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Failed to create PayPal order: ${error}`);
      throw new Error('Failed to create PayPal order');
    }

    const order = await response.json() as { id: string; links: Array<{ rel: string; href: string }> };
    const approvalLink = order.links.find((link) => link.rel === 'approve');

    return {
      orderId: order.id,
      approvalUrl: approvalLink?.href || '',
    };
  }

  async captureOrder(
    societeId: string,
    orderId: string,
  ): Promise<{
    captureId: string;
    status: string;
    amount: number;
    currency: string;
  }> {
    const account = await this.getAccountBySocieteId(societeId);
    if (!account || !account.isConfigured()) {
      throw new NotFoundException('PayPal account not configured');
    }

    const accessToken = await this.getAccessToken(account);
    const baseUrl = this.getBaseUrl(account.isSandbox);

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Failed to capture PayPal order: ${error}`);
      throw new Error('Failed to capture PayPal order');
    }

    const capture = await response.json() as {
      status: string;
      purchase_units: Array<{
        payments?: {
          captures?: Array<{
            id: string;
            amount?: { value: string; currency_code: string };
          }>;
        };
      }>;
    };
    const captureDetails = capture.purchase_units[0]?.payments?.captures?.[0];

    return {
      captureId: captureDetails?.id || '',
      status: capture.status,
      amount: parseFloat(captureDetails?.amount?.value || '0'),
      currency: captureDetails?.amount?.currency_code || 'EUR',
    };
  }

  async getOrder(societeId: string, orderId: string): Promise<any> {
    const account = await this.getAccountBySocieteId(societeId);
    if (!account || !account.isConfigured()) {
      throw new NotFoundException('PayPal account not configured');
    }

    const accessToken = await this.getAccessToken(account);
    const baseUrl = this.getBaseUrl(account.isSandbox);

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Failed to get PayPal order: ${error}`);
      throw new Error('Failed to get PayPal order');
    }

    return response.json();
  }

  async createRefund(
    societeId: string,
    captureId: string,
    amount?: number,
    currency?: string,
  ): Promise<{ refundId: string; status: string }> {
    const account = await this.getAccountBySocieteId(societeId);
    if (!account || !account.isConfigured()) {
      throw new NotFoundException('PayPal account not configured');
    }

    const accessToken = await this.getAccessToken(account);
    const baseUrl = this.getBaseUrl(account.isSandbox);

    const body: any = {};
    if (amount !== undefined) {
      body.amount = {
        value: amount.toFixed(2),
        currency_code: currency || 'EUR',
      };
    }

    const response = await fetch(`${baseUrl}/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Failed to create PayPal refund: ${error}`);
      throw new Error('Failed to create PayPal refund');
    }

    const refund = await response.json() as { id: string; status: string };

    return {
      refundId: refund.id,
      status: refund.status,
    };
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
}
