import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  IdempotenceService,
  type IdempotenceStore,
  NatsService,
} from '@crm/shared-kernel';
import { ImsWebhookProcessingStatus } from '../../../domain/mondial-tv/entities/ims-webhook-event.entity';
import { ImsWebhookEventService } from '../../persistence/typeorm/repositories/mondial-tv/ims-webhook-event.service';

interface ImsWebhookPayload {
  organisation_id?: string;
  event_id?: string;
  event_type?: string;
  timestamp?: string;
  payload?: Record<string, any>;
}

type RequestWithRawBody = Request & { rawBody?: Buffer };

class ImsWebhookIdempotenceStore implements IdempotenceStore {
  constructor(private readonly imsWebhookEventService: ImsWebhookEventService) {}

  async isEventProcessed(eventId: string): Promise<boolean> {
    return this.imsWebhookEventService.isEventProcessed(eventId);
  }

  async markEventProcessed(_eventId: string, _eventType: string): Promise<void> {
    return Promise.resolve();
  }
}

@Controller('webhooks')
export class ImsWebhookController {
  private readonly logger = new Logger(ImsWebhookController.name);
  private readonly idempotenceService: IdempotenceService;

  constructor(
    private readonly imsWebhookEventService: ImsWebhookEventService,
    private readonly natsService: NatsService,
  ) {
    this.idempotenceService = new IdempotenceService(
      new ImsWebhookIdempotenceStore(this.imsWebhookEventService),
    );
  }

  @Post('ims')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RequestWithRawBody,
    @Body() body: ImsWebhookPayload,
    @Headers('x-ims-signature') signature: string,
  ) {
    const organisationId = this.resolveOrganisationId(body);
    const eventId = body?.event_id;
    const eventType = body?.event_type;

    if (!organisationId) {
      throw new BadRequestException('Missing organisation_id in IMS webhook payload');
    }

    if (!eventId) {
      throw new BadRequestException('Missing event_id in IMS webhook payload');
    }

    if (!eventType) {
      throw new BadRequestException('Missing event_type in IMS webhook payload');
    }

    const secret = process.env.IMS_WEBHOOK_SECRET;
    if (!secret) {
      throw new InternalServerErrorException(
        'IMS webhook secret is not configured (IMS_WEBHOOK_SECRET)',
      );
    }

    if (!signature) {
      throw new UnauthorizedException('Missing IMS webhook signature');
    }

    const rawBody = req.rawBody?.toString('utf8') || JSON.stringify(body);
    const hmacValid = this.validateSignature(rawBody, signature, secret);

    if (!hmacValid) {
      this.logger.warn(`Invalid IMS webhook signature for event ${eventId}`);
      throw new UnauthorizedException('Invalid IMS webhook signature');
    }

    const alreadyProcessed = await this.idempotenceService.isProcessed(eventId);
    if (alreadyProcessed) {
      this.logger.log(`Duplicate IMS webhook ignored: ${eventId}`);
      return { success: true, status: 'duplicate', eventId };
    }

    const payload = this.resolvePayload(body.payload);
    const eventTimestamp = this.parseParisTimestamp(body.timestamp);

    const storedEvent = await this.imsWebhookEventService.create({
      organisationId,
      eventId,
      eventType,
      payload,
      hmacValid,
      processingStatus: ImsWebhookProcessingStatus.RECEIVED,
    });

    await this.idempotenceService.markProcessed(eventId, eventType);

    if (this.natsService.isConnected()) {
      await this.natsService.publish('crm.commercial.mondial-tv.ims.webhook.received', {
        internalEventId: storedEvent.id,
        organisationId,
        eventId,
        eventType,
        payload,
        eventTimestamp: eventTimestamp ? eventTimestamp.toISOString() : null,
        timezone: 'Europe/Paris',
        receivedAt: storedEvent.createdAt?.toISOString() || new Date().toISOString(),
      });
    } else {
      this.logger.warn('NATS not connected, IMS webhook event stored without publish');
    }

    return {
      success: true,
      status: 'received',
      eventId: storedEvent.id,
    };
  }

  private resolveOrganisationId(body: ImsWebhookPayload): string | null {
    const topLevelOrganisationId =
      typeof body?.organisation_id === 'string' ? body.organisation_id.trim() : '';
    if (topLevelOrganisationId) {
      return topLevelOrganisationId;
    }

    const nestedOrganisationId =
      typeof body?.payload?.organisation_id === 'string'
        ? body.payload.organisation_id.trim()
        : '';

    return nestedOrganisationId || null;
  }

  private resolvePayload(payload: unknown): Record<string, any> {
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      return payload as Record<string, any>;
    }

    return {};
  }

  private validateSignature(rawBody: string, signature: string, secret: string): boolean {
    const normalizedSignature = this.normalizeSignature(signature);
    if (!normalizedSignature) {
      return false;
    }

    const expectedHex = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
    const expectedBase64 = createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');

    return (
      this.secureCompare(normalizedSignature, expectedHex) ||
      this.secureCompare(normalizedSignature, expectedBase64)
    );
  }

  private normalizeSignature(signature: string): string {
    return signature.replace(/^sha256=/i, '').trim();
  }

  private secureCompare(actual: string, expected: string): boolean {
    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);

    if (actualBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(actualBuffer, expectedBuffer);
  }

  private parseParisTimestamp(timestamp: string | undefined): Date | null {
    if (!timestamp || !timestamp.trim()) {
      return null;
    }

    const input = timestamp.trim();

    if (/[zZ]$|[+\-]\d{2}:\d{2}$/.test(input)) {
      const parsed = new Date(input);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const matched = input.match(
      /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/,
    );

    if (!matched) {
      const parsed = new Date(input);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const year = Number(matched[1]);
    const month = Number(matched[2]);
    const day = Number(matched[3]);
    const hours = Number(matched[4]);
    const minutes = Number(matched[5]);
    const seconds = Number(matched[6] || '0');

    const utcGuess = Date.UTC(year, month - 1, day, hours, minutes, seconds);
    const offsetMillis = this.getParisOffsetMillis(new Date(utcGuess));
    const parsed = new Date(utcGuess - offsetMillis);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private getParisOffsetMillis(date: Date): number {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Paris',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const parts = formatter
      .formatToParts(date)
      .reduce<Record<string, string>>((carry, part) => {
        if (part.type !== 'literal') {
          carry[part.type] = part.value;
        }
        return carry;
      }, {});

    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );

    return asUtc - date.getTime();
  }
}
