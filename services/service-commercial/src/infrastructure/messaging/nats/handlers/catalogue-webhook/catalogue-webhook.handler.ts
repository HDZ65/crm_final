import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import { CatalogueWebhookEventRepoService } from '../../../../persistence/typeorm/repositories/catalogue-webhook/catalogue-webhook-event.service';
import {
  CatalogueWebhookMappingService,
  type PartnerProductPayload,
} from '../../../../../domain/catalogue-webhook/services/catalogue-webhook-mapping.service';

const CATALOGUE_WEBHOOK_SUBJECT = 'crm.commercial.catalogue.webhook.received';

/**
 * NATS event shape published by CatalogueWebhookController.
 */
export interface CatalogueWebhookNatsEvent {
  internalEventId: string;
  organisationId: string;
  eventType: string;
  payload: unknown;
  receivedAt: string;
}

/**
 * CatalogueWebhookNatsWorker
 *
 * Subscribes to catalogue webhook NATS events and processes them:
 * 1. markProcessing on the stored event
 * 2. Parse payload (array of partner products or single product)
 * 3. For each product: mapping + upsert via CatalogueWebhookMappingService
 * 4. markDone on success / markFailed on error
 */
@Injectable()
export class CatalogueWebhookNatsWorker implements OnModuleInit {
  private readonly logger = new Logger(CatalogueWebhookNatsWorker.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly catalogueWebhookEventRepoService: CatalogueWebhookEventRepoService,
    private readonly catalogueWebhookMappingService: CatalogueWebhookMappingService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.natsService.isConnected()) {
      this.logger.warn(
        'NATS not connected, CatalogueWebhookNatsWorker will not subscribe',
      );
      return;
    }

    await this.natsService.subscribe<CatalogueWebhookNatsEvent>(
      CATALOGUE_WEBHOOK_SUBJECT,
      async (event) => {
        await this.processEvent(event);
      },
    );

    this.logger.log(
      'CatalogueWebhookNatsWorker initialized — ready to process catalogue webhook events',
    );
  }

  private async processEvent(event: CatalogueWebhookNatsEvent): Promise<void> {
    const { internalEventId, organisationId, payload } = event;

    try {
      // 1. Mark event as processing
      if (internalEventId) {
        await this.catalogueWebhookEventRepoService.markProcessing(internalEventId);
      }

      // 2. Parse payload — accept array or single product or object with products key
      const products = this.extractProducts(payload);

      if (products.length === 0) {
        this.logger.warn(
          `Catalogue webhook event ${internalEventId}: no products found in payload`,
        );
      }

      // 3. Upsert all products
      const { results, errors } = await this.catalogueWebhookMappingService.upsertBatch(
        organisationId,
        products,
      );

      const created = results.filter((r) => r.action === 'CREATED').length;
      const updated = results.filter((r) => r.action === 'UPDATED').length;

      this.logger.log(
        `Catalogue webhook ${internalEventId}: processed ${results.length} products (${created} created, ${updated} updated, ${errors.length} errors)`,
      );

      // 4. If there were partial errors but some succeeded, still mark done with a note
      if (errors.length > 0 && results.length === 0) {
        // All failed
        const errorSummary = errors
          .map((e) => `[${e.index}] ${e.error}`)
          .join('; ');
        throw new Error(`All products failed to upsert: ${errorSummary}`);
      }

      // 5. Mark done
      if (internalEventId) {
        await this.catalogueWebhookEventRepoService.markDone(internalEventId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to process catalogue webhook event ${internalEventId}: ${errorMessage}`,
      );

      if (internalEventId) {
        try {
          await this.catalogueWebhookEventRepoService.markFailed(
            internalEventId,
            errorMessage,
          );
        } catch (markFailedError) {
          this.logger.error(
            `Failed to mark catalogue webhook event as failed: ${markFailedError}`,
          );
        }
      }

      throw error;
    }
  }

  /**
   * Extract product array from various payload shapes:
   * - Direct array: [{ id, nom, ... }, ...]
   * - Wrapper object: { products: [...] } or { produits: [...] } or { data: [...] }
   * - Single product: { id, nom, ... }
   */
  private extractProducts(payload: unknown): PartnerProductPayload[] {
    if (Array.isArray(payload)) {
      return payload as PartnerProductPayload[];
    }

    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      const obj = payload as Record<string, unknown>;

      // Check for known wrapper keys
      for (const key of ['products', 'produits', 'data', 'items']) {
        if (Array.isArray(obj[key])) {
          return obj[key] as PartnerProductPayload[];
        }
      }

      // Single product object with required 'id' and 'nom' fields
      if ('id' in obj && 'nom' in obj) {
        return [obj as unknown as PartnerProductPayload];
      }
    }

    return [];
  }
}
