import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import { SlimpayAccountEntity } from './entities/slimpay-account.entity';
import { SlimpayToken } from '@proto/payments/payment.js';

@Injectable()
export class SlimpayService {
  private readonly logger = new Logger(SlimpayService.name);
  private readonly tokenCache: Map<string, SlimpayToken> = new Map();

  constructor(
    @InjectRepository(SlimpayAccountEntity)
    private readonly accountRepository: Repository<SlimpayAccountEntity>,
  ) {}

  private getBaseUrl(account: SlimpayAccountEntity): string {
    return account.isSandbox ? 'https://api.preprod.slimpay.com' : 'https://api.slimpay.com';
  }

  async getAccountBySocieteId(societeId: string): Promise<SlimpayAccountEntity | null> {
    return this.accountRepository.findOne({ where: { societeId, actif: true } });
  }

  private async getAccessToken(account: SlimpayAccountEntity): Promise<string> {
    const cacheKey = `${account.id}`;
    const cached = this.tokenCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now + 30_000) {
      return cached.accessToken;
    }

    if (!account.appName || !account.appSecret) {
      throw new NotFoundException('Slimpay account not configured');
    }

    const auth = Buffer.from(`${account.appName}:${account.appSecret}`).toString('base64');
    const response = await fetch(`${this.getBaseUrl(account)}/oauth/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'api',
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Slimpay token error: ${text}`);
      throw new Error('Slimpay authentication failed');
    }

    const data = await response.json();
    const expiresIn = Number(data.expires_in ?? 3600);
    const token: SlimpayToken = {
      accessToken: data.access_token,
      expiresAt: now + expiresIn * 1000,
    };
    this.tokenCache.set(cacheKey, token);

    return token.accessToken;
  }

  async createOrder(societeId: string, payload: Record<string, any>): Promise<any> {
    const account = await this.getAccountBySocieteId(societeId);
    if (!account || !account.isConfigured()) {
      throw new NotFoundException('Slimpay account not configured');
    }

    const token = await this.getAccessToken(account);
    const response = await fetch(`${this.getBaseUrl(account)}/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Slimpay create order error: ${text}`);
      throw new Error('Slimpay order creation failed');
    }

    return response.json();
  }

  async getMandate(societeId: string, mandateId: string): Promise<any> {
    const account = await this.getAccountBySocieteId(societeId);
    if (!account || !account.isConfigured()) {
      throw new NotFoundException('Slimpay account not configured');
    }

    const token = await this.getAccessToken(account);
    const response = await fetch(`${this.getBaseUrl(account)}/mandates/${mandateId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Slimpay get mandate error: ${text}`);
      throw new Error('Slimpay get mandate failed');
    }

    return response.json();
  }

  verifyWebhookSignature(params: {
    rawBody: string;
    signature: string;
    secret: string;
    maxAgeSeconds?: number;
  }): boolean {
    const parts = params.signature.split(',').map((part) => part.trim());
    const timestampPart = parts.find((p) => p.startsWith('t='));
    const signaturePart = parts.find((p) => p.startsWith('v1='));

    if (!timestampPart || !signaturePart) {
      return false;
    }

    const timestamp = Number(timestampPart.replace('t=', ''));
    const provided = signaturePart.replace('v1=', '');
    const ageSeconds = Math.floor(Date.now() / 1000) - timestamp;
    if (params.maxAgeSeconds && ageSeconds > params.maxAgeSeconds) {
      return false;
    }

    const payloadToSign = `${timestamp}:${params.rawBody}`;
    const computed = createHmac('sha256', params.secret).update(payloadToSign).digest('hex');
    return computed === provided;
  }

  async getAccountInfo(societeId: string): Promise<{ configured: boolean; testMode: boolean; hasWebhook: boolean }> {
    const account = await this.getAccountBySocieteId(societeId);
    return {
      configured: account?.isConfigured() ?? false,
      testMode: account?.isLiveMode() === false,
      hasWebhook: account?.hasWebhookSecret() ?? false,
    };
  }
}
