import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import { MultiSafepayAccountEntity } from './entities/multisafepay-account.entity';

@Injectable()
export class MultiSafepayService {
  private readonly logger = new Logger(MultiSafepayService.name);

  constructor(
    @InjectRepository(MultiSafepayAccountEntity)
    private readonly accountRepository: Repository<MultiSafepayAccountEntity>,
  ) {}

  private getBaseUrl(account: MultiSafepayAccountEntity): string {
    return account.isSandbox
      ? 'https://testapi.multisafepay.com/v1/json'
      : 'https://api.multisafepay.com/v1/json';
  }

  async getAccountBySocieteId(societeId: string): Promise<MultiSafepayAccountEntity | null> {
    return this.accountRepository.findOne({ where: { societeId, actif: true } });
  }

  async createOrder(societeId: string, payload: Record<string, any>): Promise<any> {
    const account = await this.getAccountBySocieteId(societeId);
    if (!account || !account.isConfigured()) {
      throw new NotFoundException('MultiSafepay account not configured');
    }

    const response = await fetch(`${this.getBaseUrl(account)}/orders`, {
      method: 'POST',
      headers: {
        api_key: account.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`MultiSafepay create order error: ${text}`);
      throw new Error('MultiSafepay order creation failed');
    }

    return response.json();
  }

  verifyWebhookSignature(params: { rawBody: string; authHeader: string; apiKey: string }): boolean {
    if (!params.authHeader) {
      return false;
    }

    let decoded: string;
    try {
      decoded = Buffer.from(params.authHeader, 'base64').toString('utf-8');
    } catch {
      return false;
    }

    const [timestamp, provided] = decoded.split(':');
    if (!timestamp || !provided) {
      return false;
    }

    const payloadToSign = `${timestamp}:${params.rawBody}`;
    const computed = createHmac('sha512', params.apiKey).update(payloadToSign).digest('hex');
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
