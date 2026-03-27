import { Injectable, Logger } from '@nestjs/common';
import { WebhookEventHandler } from './webhook-event-handler.interface';

@Injectable()
export class QuoteEventHandler implements WebhookEventHandler {
  private readonly logger = new Logger(QuoteEventHandler.name);
  private readonly pricingCache = new Map<string, Record<string, unknown>>();

  async handle(payload: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
    const partnerId = this.readString(payload, ['partnerId', 'partner_id', 'keycloakGroupId']);
    const productCode = this.readString(payload, ['productCode', 'product_code', 'sku', 'reference']);
    const quoteId = this.readString(payload, ['quoteId', 'quote_id', 'id']);

    const cacheKey = `${partnerId || 'unknown'}:${productCode || quoteId || 'unknown'}`;
    this.pricingCache.set(cacheKey, {
      ...payload,
      cachedAt: new Date().toISOString(),
    });

    this.logger.log(`Quote webhook processed and cached under key ${cacheKey}`);
    return { success: true };
  }

  private readString(payload: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return null;
  }
}
