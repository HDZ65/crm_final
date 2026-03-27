import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  IdempotenceService,
  type IdempotenceStore,
  NatsService,
} from '@crm/shared-kernel';
import { CatalogueWebhookProcessingStatus } from '../../../domain/catalogue-webhook/entities/catalogue-webhook-event.entity';
import { CatalogueWebhookEventRepoService } from '../../persistence/typeorm/repositories/catalogue-webhook/catalogue-webhook-event.service';

class CatalogueWebhookIdempotenceStore implements IdempotenceStore {
  constructor(private readonly repoService: CatalogueWebhookEventRepoService) {}

  async isEventProcessed(eventId: string): Promise<boolean> {
    return this.repoService.isEventProcessed(eventId);
  }

  async markEventProcessed(_eventId: string, _eventType: string): Promise<void> {
    return Promise.resolve();
  }
}

@Controller('webhooks')
export class CatalogueWebhookController {
  private readonly logger = new Logger(CatalogueWebhookController.name);
  private readonly idempotenceService: IdempotenceService;

  constructor(
    private readonly catalogueWebhookEventRepoService: CatalogueWebhookEventRepoService,
    private readonly natsService: NatsService,
  ) {
    this.idempotenceService = new IdempotenceService(
      new CatalogueWebhookIdempotenceStore(this.catalogueWebhookEventRepoService),
    );
  }

  @Post('catalogue/:organisationId')
  @HttpCode(HttpStatus.OK)
  async handleCatalogueWebhook(
    @Param('organisationId') organisationId: string,
    @Headers('x-api-key') apiKey: string,
    @Body() body: any,
  ) {
    // API key validation
    const expectedKey = process.env.CATALOGUE_WEBHOOK_API_KEY;
    if (!apiKey || apiKey !== expectedKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Generate event ID
    const eventId = `catalogue-${organisationId}-${Date.now()}-${randomUUID().slice(0, 8)}`;

    // Idempotence check
    const alreadyProcessed = await this.idempotenceService.isProcessed(eventId);
    if (alreadyProcessed) {
      this.logger.log(`Duplicate catalogue webhook ignored: ${eventId}`);
      return { success: true, status: 'duplicate', eventId };
    }

    // Store event
    const storedEvent = await this.catalogueWebhookEventRepoService.create({
      organisationId,
      eventId,
      eventType: 'catalogue.sync',
      payload: body,
      apiKeyValid: true,
      processingStatus: CatalogueWebhookProcessingStatus.RECEIVED,
    });

    await this.idempotenceService.markProcessed(eventId, 'catalogue.sync');

    // Publish to NATS
    if (this.natsService.isConnected()) {
      await this.natsService.publish('crm.commercial.catalogue.webhook.received', {
        internalEventId: storedEvent.id,
        organisationId,
        eventType: 'catalogue.sync',
        payload: body,
        receivedAt: storedEvent.createdAt?.toISOString() || new Date().toISOString(),
      });
    } else {
      this.logger.warn('NATS not connected, catalogue webhook event stored without publish');
    }

    return {
      success: true,
      status: 'received',
      eventId: storedEvent.id,
    };
  }
}
