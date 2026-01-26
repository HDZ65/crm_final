import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createPublicKey, verify } from 'crypto';
import { EmerchantpayAccountEntity } from './entities/emerchantpay-account.entity';

@Injectable()
export class EmerchantpayService {
  private readonly logger = new Logger(EmerchantpayService.name);

  constructor(
    @InjectRepository(EmerchantpayAccountEntity)
    private readonly accountRepository: Repository<EmerchantpayAccountEntity>,
  ) {}

  private getBaseUrl(account: EmerchantpayAccountEntity): string {
    return account.isSandbox ? 'https://staging-gateway.commerce.eu' : 'https://gateway.commerce.eu';
  }

  async getAccountBySocieteId(societeId: string): Promise<EmerchantpayAccountEntity | null> {
    return this.accountRepository.findOne({ where: { societeId, actif: true } });
  }

  private buildAuthHeader(account: EmerchantpayAccountEntity): string {
    const credentials = Buffer.from(`${account.apiLogin}:${account.apiPassword}`).toString('base64');
    return `Basic ${credentials}`;
  }

  async createTransaction(societeId: string, payload: Record<string, any>): Promise<any> {
    const account = await this.getAccountBySocieteId(societeId);
    if (!account || !account.isConfigured()) {
      throw new NotFoundException('Emerchantpay account not configured');
    }

    const response = await fetch(`${this.getBaseUrl(account)}/v1/transactions`, {
      method: 'POST',
      headers: {
        Authorization: this.buildAuthHeader(account),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Emerchantpay transaction error: ${text}`);
      throw new Error('Emerchantpay transaction failed');
    }

    return response.json();
  }

  verifyWebhookSignature(params: { rawBody: string; signature: string; publicKey: string }): boolean {
    if (!params.signature || !params.publicKey) {
      return false;
    }

    try {
      const key = createPublicKey(params.publicKey);
      const signature = Buffer.from(params.signature, 'base64');
      return verify('sha256', Buffer.from(params.rawBody), key, signature);
    } catch (error) {
      this.logger.error(`Emerchantpay webhook verification failed: ${error}`);
      return false;
    }
  }

  async getAccountInfo(societeId: string): Promise<{ configured: boolean; testMode: boolean; hasWebhook: boolean }> {
    const account = await this.getAccountBySocieteId(societeId);
    return {
      configured: account?.isConfigured() ?? false,
      testMode: account?.isLiveMode() === false,
      hasWebhook: account?.hasWebhookKey() ?? false,
    };
  }
}
