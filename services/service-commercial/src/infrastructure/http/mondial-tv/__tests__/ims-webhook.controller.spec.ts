import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createHmac } from 'crypto';
import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ImsWebhookController } from '../ims-webhook.controller';
import {
  ImsWebhookEventEntity,
  ImsWebhookProcessingStatus,
} from '../../../../domain/mondial-tv/entities/ims-webhook-event.entity';

type PublishedMessage = {
  subject: string;
  payload: Record<string, any>;
};

const ORIGINAL_WEBHOOK_SECRET = process.env.IMS_WEBHOOK_SECRET;

function computeHexSignature(body: string, secret: string, withPrefix = false): string {
  const digest = createHmac('sha256', secret).update(body, 'utf8').digest('hex');
  return withPrefix ? `sha256=${digest}` : digest;
}

function makeRequest(rawBody: string): { rawBody: Buffer } {
  return {
    rawBody: Buffer.from(rawBody, 'utf8'),
  };
}

function createFixture(options?: { natsConnected?: boolean }) {
  const storedEvents: ImsWebhookEventEntity[] = [];
  const eventsById = new Map<string, ImsWebhookEventEntity>();
  const publishedMessages: PublishedMessage[] = [];
  let counter = 0;

  const imsWebhookEventService = {
    isEventProcessed: async (eventId: string) => eventsById.has(eventId),
    create: async (input: {
      organisationId: string;
      eventId: string;
      eventType: string;
      payload: Record<string, any>;
      hmacValid: boolean;
      processingStatus: ImsWebhookProcessingStatus;
    }) => {
      counter += 1;
      const entity = new ImsWebhookEventEntity();
      entity.id = `ims-webhook-${counter}`;
      entity.organisationId = input.organisationId;
      entity.eventId = input.eventId;
      entity.eventType = input.eventType;
      entity.payload = input.payload;
      entity.hmacValid = input.hmacValid;
      entity.processingStatus = input.processingStatus;
      entity.errorMessage = null;
      entity.retryCount = 0;
      entity.processedAt = null;
      entity.createdAt = new Date('2026-01-01T00:00:00.000Z');

      storedEvents.push(entity);
      eventsById.set(entity.eventId, entity);

      return entity;
    },
  };

  const natsService = {
    isConnected: () => options?.natsConnected !== false,
    publish: async (subject: string, payload: Record<string, any>) => {
      publishedMessages.push({ subject, payload });
    },
  };

  const controller = new ImsWebhookController(
    imsWebhookEventService as any,
    natsService as any,
  );

  return {
    controller,
    storedEvents,
    publishedMessages,
  };
}

describe('ImsWebhookController', () => {
  beforeEach(() => {
    process.env.IMS_WEBHOOK_SECRET = 'ims-webhook-secret';
  });

  afterEach(() => {
    if (ORIGINAL_WEBHOOK_SECRET === undefined) {
      delete process.env.IMS_WEBHOOK_SECRET;
      return;
    }

    process.env.IMS_WEBHOOK_SECRET = ORIGINAL_WEBHOOK_SECRET;
  });

  it('accepts a valid IMS webhook, stores it, and marks it as RECEIVED', async () => {
    const { controller, storedEvents } = createFixture();

    const body = {
      organisation_id: 'org-1',
      event_id: 'evt-100',
      event_type: 'user.created',
      timestamp: '2026-01-15T10:00:00+01:00',
      payload: {
        ims_user_id: 'ims-001',
      },
    };

    const rawBody = JSON.stringify(body);
    const signature = computeHexSignature(rawBody, 'ims-webhook-secret', true);

    const response = await controller.handleWebhook(
      makeRequest(rawBody) as any,
      body,
      signature,
    );

    expect(response.success).toBe(true);
    expect(response.status).toBe('received');
    expect(storedEvents.length).toBe(1);
    expect(storedEvents[0].eventId).toBe('evt-100');
    expect(storedEvents[0].processingStatus).toBe(ImsWebhookProcessingStatus.RECEIVED);
    expect(storedEvents[0].hmacValid).toBe(true);
  });

  it('publishes valid webhook events to NATS', async () => {
    const { controller, publishedMessages } = createFixture();

    const body = {
      organisation_id: 'org-1',
      event_id: 'evt-101',
      event_type: 'subscription.created',
      timestamp: '2026-01-15T11:30:00+01:00',
      payload: {
        ims_subscription_id: 'ims-sub-123',
      },
    };

    const rawBody = JSON.stringify(body);
    const signature = computeHexSignature(rawBody, 'ims-webhook-secret');

    await controller.handleWebhook(makeRequest(rawBody) as any, body, signature);

    expect(publishedMessages.length).toBe(1);
    expect(publishedMessages[0].subject).toBe(
      'crm.commercial.mondial-tv.ims.webhook.received',
    );
    expect(publishedMessages[0].payload.eventId).toBe('evt-101');
    expect(publishedMessages[0].payload.eventType).toBe('subscription.created');
  });

  it('returns duplicate status and prevents duplicate insert on same event_id', async () => {
    const { controller, storedEvents, publishedMessages } = createFixture();

    const body = {
      organisation_id: 'org-1',
      event_id: 'evt-102',
      event_type: 'payment.succeeded',
      timestamp: '2026-01-15T11:30:00+01:00',
      payload: {
        amount: 999,
      },
    };

    const rawBody = JSON.stringify(body);
    const signature = computeHexSignature(rawBody, 'ims-webhook-secret');

    const first = await controller.handleWebhook(makeRequest(rawBody) as any, body, signature);
    const second = await controller.handleWebhook(makeRequest(rawBody) as any, body, signature);

    expect(first.status).toBe('received');
    expect(second.status).toBe('duplicate');
    expect(storedEvents.length).toBe(1);
    expect(publishedMessages.length).toBe(1);
  });

  it('rejects invalid HMAC signatures', async () => {
    const { controller, storedEvents } = createFixture();

    const body = {
      organisation_id: 'org-1',
      event_id: 'evt-103',
      event_type: 'user.updated',
      payload: {
        email: 'updated@example.com',
      },
    };

    const rawBody = JSON.stringify(body);

    await expect(
      controller.handleWebhook(makeRequest(rawBody) as any, body, 'sha256=invalid-signature'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(storedEvents.length).toBe(0);
  });

  it('rejects webhook requests without signature header', async () => {
    const { controller } = createFixture();

    const body = {
      organisation_id: 'org-1',
      event_id: 'evt-104',
      event_type: 'user.updated',
      payload: {
        email: 'updated@example.com',
      },
    };

    const rawBody = JSON.stringify(body);

    await expect(
      controller.handleWebhook(makeRequest(rawBody) as any, body, ''),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects webhook requests when event_id is missing', async () => {
    const { controller } = createFixture();

    const body = {
      organisation_id: 'org-1',
      event_type: 'user.updated',
      payload: {
        email: 'updated@example.com',
      },
    };

    const rawBody = JSON.stringify(body);
    const signature = computeHexSignature(rawBody, 'ims-webhook-secret');

    await expect(
      controller.handleWebhook(makeRequest(rawBody) as any, body as any, signature),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('parses naive timestamps as Europe/Paris before publishing', async () => {
    const { controller, publishedMessages } = createFixture();

    const body = {
      organisation_id: 'org-1',
      event_id: 'evt-105',
      event_type: 'subscription.updated',
      timestamp: '2026-01-15T10:00:00',
      payload: {
        status: 'active',
      },
    };

    const rawBody = JSON.stringify(body);
    const signature = computeHexSignature(rawBody, 'ims-webhook-secret');

    await controller.handleWebhook(makeRequest(rawBody) as any, body, signature);

    expect(publishedMessages[0].payload.eventTimestamp).toBe('2026-01-15T09:00:00.000Z');
    expect(publishedMessages[0].payload.timezone).toBe('Europe/Paris');
  });

  it('uses payload.organisation_id when missing at root level', async () => {
    const { controller, storedEvents } = createFixture();

    const body = {
      event_id: 'evt-106',
      event_type: 'user.created',
      payload: {
        organisation_id: 'org-from-payload',
        ims_user_id: 'ims-106',
      },
    };

    const rawBody = JSON.stringify(body);
    const signature = computeHexSignature(rawBody, 'ims-webhook-secret');

    await controller.handleWebhook(makeRequest(rawBody) as any, body as any, signature);

    expect(storedEvents[0].organisationId).toBe('org-from-payload');
  });

  it('stores valid events when NATS is disconnected', async () => {
    const { controller, storedEvents, publishedMessages } = createFixture({
      natsConnected: false,
    });

    const body = {
      organisation_id: 'org-1',
      event_id: 'evt-107',
      event_type: 'payment.failed',
      timestamp: '2026-01-15T10:00:00+01:00',
      payload: {
        reason: 'card_declined',
      },
    };

    const rawBody = JSON.stringify(body);
    const signature = computeHexSignature(rawBody, 'ims-webhook-secret');

    const response = await controller.handleWebhook(
      makeRequest(rawBody) as any,
      body,
      signature,
    );

    expect(response.success).toBe(true);
    expect(storedEvents.length).toBe(1);
    expect(publishedMessages.length).toBe(0);
  });

  it('fails with 500 when IMS secret is not configured', async () => {
    const { controller } = createFixture();
    delete process.env.IMS_WEBHOOK_SECRET;

    const body = {
      organisation_id: 'org-1',
      event_id: 'evt-108',
      event_type: 'user.created',
      payload: {
        ims_user_id: 'ims-108',
      },
    };

    const rawBody = JSON.stringify(body);
    const signature = computeHexSignature(rawBody, 'ims-webhook-secret');

    await expect(
      controller.handleWebhook(makeRequest(rawBody) as any, body, signature),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
