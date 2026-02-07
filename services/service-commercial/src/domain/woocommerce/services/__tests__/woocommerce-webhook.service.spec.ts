import { describe, expect, it } from 'bun:test';
import { createHmac } from 'crypto';
import { WooCommerceWebhookService } from '../woocommerce-webhook.service';
import type { IWooCommerceWebhookEventRepository } from '../../repositories/IWooCommerceWebhookEventRepository';
import type { IWooCommerceConfigRepository } from '../../repositories/IWooCommerceConfigRepository';
import type { WooCommerceConfigEntity } from '../../entities/woocommerce-config.entity';
import {
  WooCommerceWebhookEventEntity,
  WebhookEventStatus,
} from '../../entities/woocommerce-webhook-event.entity';

function makeConfig(overrides: Partial<WooCommerceConfigEntity> = {}): WooCommerceConfigEntity {
  return {
    id: 'config-1',
    organisationId: 'org-1',
    storeUrl: 'https://store.example.com',
    webhookSecret: 'test-secret-key',
    consumerKeyHash: 'ck_hash',
    consumerSecretHash: 'cs_hash',
    active: true,
    lastSyncAt: null,
    syncError: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function computeSignature(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body, 'utf8').digest('base64');
}

function createFixture(options: { config?: WooCommerceConfigEntity | null; natsConnected?: boolean } = {}) {
  const savedEvents: WooCommerceWebhookEventEntity[] = [];
  const publishedMessages: Array<{ subject: string; data: Record<string, unknown> }> = [];
  let eventIdCounter = 0;
  const eventStore = new Map<string, WooCommerceWebhookEventEntity>();
  const verifiedIds: string[] = [];
  const processedIds: string[] = [];
  const failedEvents: Array<{ id: string; error: string }> = [];
  const duplicateIds: string[] = [];

  const webhookEventRepository: IWooCommerceWebhookEventRepository = {
    findById: async (id: string) => eventStore.get(id) || null,
    findByExternalEventId: async (_source: string, externalEventId: string) => {
      for (const e of eventStore.values()) {
        if (e.externalEventId === externalEventId) return e;
      }
      return null;
    },
    findAll: async () => [],
    findPendingEvents: async () => [],
    findFailedEvents: async () => [],
    save: async (entity: WooCommerceWebhookEventEntity) => {
      eventStore.set(entity.id, entity);
      savedEvents.push({ ...entity });
      return entity;
    },
    create: async (input) => {
      eventIdCounter++;
      const entity = new WooCommerceWebhookEventEntity();
      entity.id = `event-${eventIdCounter}`;
      entity.organisationId = input.organisationId;
      entity.source = input.source;
      entity.externalEventId = input.externalEventId;
      entity.eventType = input.eventType;
      entity.wooResourceId = input.wooResourceId;
      entity.rawPayload = input.rawPayload;
      entity.signature = input.signature || null;
      entity.status = input.status || WebhookEventStatus.RECEIVED;
      entity.retryCount = 0;
      entity.receivedAt = new Date();
      entity.verifiedAt = null;
      entity.processedAt = null;
      entity.errorMessage = null;
      entity.createdAt = new Date();
      entity.updatedAt = new Date();
      eventStore.set(entity.id, entity);
      savedEvents.push({ ...entity });
      return entity;
    },
    markVerified: async (id: string) => {
      const e = eventStore.get(id);
      if (e) { e.markVerified(); verifiedIds.push(id); }
    },
    markProcessed: async (id: string) => {
      const e = eventStore.get(id);
      if (e) { e.markProcessed(); processedIds.push(id); }
    },
    markFailed: async (id: string, errorMessage: string) => {
      const e = eventStore.get(id);
      if (e) { e.markFailed(errorMessage); failedEvents.push({ id, error: errorMessage }); }
    },
    markDuplicate: async (id: string) => {
      const e = eventStore.get(id);
      if (e) { e.markDuplicate(); duplicateIds.push(id); }
    },
    delete: async () => {},
  };

  const configRepository: IWooCommerceConfigRepository = {
    findById: async () => options.config ?? makeConfig(),
    findByOrganisationId: async () => options.config ?? makeConfig(),
    findByOrganisation: async () => options.config ?? makeConfig(),
    findAllActive: async () => (options.config ? [options.config] : [makeConfig()]),
    save: async (e: WooCommerceConfigEntity) => e,
    delete: async () => {},
  };

  const natsService = {
    isConnected: () => options.natsConnected !== false,
    publish: async (subject: string, data: Record<string, unknown>) => {
      publishedMessages.push({ subject, data });
    },
  };

  const service = new WooCommerceWebhookService(webhookEventRepository, configRepository, natsService as any);

  return { service, savedEvents, publishedMessages, verifiedIds, processedIds, failedEvents, duplicateIds, eventStore };
}

describe('WooCommerceWebhookService', () => {
  it('validateSignature returns true for valid HMAC-SHA256', () => {
    const { service } = createFixture();
    const body = '{"id":123,"name":"test"}';
    const signature = computeSignature(body, 'test-secret-key');
    expect(service.validateSignature(body, signature, 'test-secret-key')).toBe(true);
  });

  it('validateSignature returns false for invalid signature', () => {
    const { service } = createFixture();
    expect(service.validateSignature('{"id":123}', 'invalid', 'test-secret-key')).toBe(false);
  });

  it('processWebhook returns success for valid signature and stores event + publishes NATS', async () => {
    const { service, savedEvents, publishedMessages, verifiedIds } = createFixture();
    const body = JSON.stringify({ id: 42, email: 'test@example.com' });
    const signature = computeSignature(body, 'test-secret-key');

    const result = await service.processWebhook({
      organisationId: 'org-1', signature, deliveryId: 'del-1',
      topic: 'customer.created', resource: 'customer', body,
      payload: { id: 42, email: 'test@example.com' },
    });

    expect(result.success).toBe(true);
    expect(result.eventId).toBeTruthy();
    expect(savedEvents.length).toBe(1);
    expect(savedEvents[0].eventType).toBe('customer.created');
    expect(verifiedIds.length).toBe(1);
    expect(publishedMessages[0].subject).toBe('woocommerce.customer.created');
  });

  it('processWebhook returns 401 for invalid signature', async () => {
    const { service, savedEvents } = createFixture();
    const result = await service.processWebhook({
      organisationId: 'org-1', signature: 'wrong', deliveryId: 'del-2',
      topic: 'customer.created', resource: 'customer',
      body: '{"id":42}', payload: { id: 42 },
    });
    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid signature');
    expect(savedEvents.length).toBe(0);
  });

  it('processWebhook returns error when config inactive', async () => {
    const { service } = createFixture({ config: makeConfig({ active: false }) });
    const result = await service.processWebhook({
      organisationId: 'org-1', signature: 'any', deliveryId: 'del-3',
      topic: 'customer.created', resource: 'customer',
      body: '{"id":42}', payload: { id: 42 },
    });
    expect(result.success).toBe(false);
    expect(result.message).toBe('WooCommerce config not found or inactive');
  });

  it('processWebhook detects duplicate by deliveryId', async () => {
    const { service, duplicateIds, eventStore, savedEvents } = createFixture();
    const existing = new WooCommerceWebhookEventEntity();
    existing.id = 'existing-evt';
    existing.organisationId = 'org-1';
    existing.source = 'woocommerce';
    existing.externalEventId = 'dup-delivery';
    existing.eventType = 'customer.created';
    existing.wooResourceId = '42';
    existing.rawPayload = { id: 42 };
    existing.signature = null;
    existing.status = WebhookEventStatus.PROCESSED;
    existing.retryCount = 0;
    existing.receivedAt = new Date();
    existing.verifiedAt = new Date();
    existing.processedAt = new Date();
    existing.errorMessage = null;
    existing.createdAt = new Date();
    existing.updatedAt = new Date();
    eventStore.set(existing.id, existing);

    const body = JSON.stringify({ id: 42 });
    const result = await service.processWebhook({
      organisationId: 'org-1', signature: computeSignature(body, 'test-secret-key'),
      deliveryId: 'dup-delivery', topic: 'customer.created', resource: 'customer',
      body, payload: { id: 42 },
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('duplicate');
    expect(duplicateIds.length).toBe(1);
    expect(savedEvents.length).toBe(0);
  });

  it('processWebhook records all webhooks in event log', async () => {
    const { service, savedEvents } = createFixture();
    const topics = ['customer.created', 'subscription.created', 'order.completed'];
    for (let i = 0; i < topics.length; i++) {
      const body = JSON.stringify({ id: i + 1 });
      await service.processWebhook({
        organisationId: 'org-1', signature: computeSignature(body, 'test-secret-key'),
        deliveryId: `batch-${i}`, topic: topics[i], resource: topics[i].split('.')[0],
        body, payload: { id: i + 1 },
      });
    }
    expect(savedEvents.length).toBe(3);
    expect(savedEvents[0].eventType).toBe('customer.created');
    expect(savedEvents[1].eventType).toBe('subscription.created');
    expect(savedEvents[2].eventType).toBe('order.completed');
  });

  it('retryEvent re-queues a FAILED event', async () => {
    const { service, publishedMessages, eventStore } = createFixture();
    const failedEvent = new WooCommerceWebhookEventEntity();
    failedEvent.id = 'evt-fail-1';
    failedEvent.organisationId = 'org-1';
    failedEvent.source = 'woocommerce';
    failedEvent.externalEventId = 'del-fail';
    failedEvent.eventType = 'customer.created';
    failedEvent.wooResourceId = '42';
    failedEvent.rawPayload = { id: 42 };
    failedEvent.signature = null;
    failedEvent.status = WebhookEventStatus.FAILED;
    failedEvent.errorMessage = 'Connection timeout';
    failedEvent.retryCount = 1;
    failedEvent.receivedAt = new Date();
    failedEvent.verifiedAt = null;
    failedEvent.processedAt = null;
    failedEvent.createdAt = new Date();
    failedEvent.updatedAt = new Date();
    eventStore.set(failedEvent.id, failedEvent);

    const result = await service.retryEvent('evt-fail-1');
    expect(result.success).toBe(true);
    const updated = eventStore.get('evt-fail-1')!;
    expect(updated.status).toBe(WebhookEventStatus.RECEIVED);
    expect(updated.retryCount).toBe(2);
    expect(publishedMessages[0].subject).toBe('woocommerce.customer.created');
  });

  it('retryEvent refuses to retry non-FAILED event', async () => {
    const { service, eventStore } = createFixture();
    const doneEvent = new WooCommerceWebhookEventEntity();
    doneEvent.id = 'evt-done';
    doneEvent.organisationId = 'org-1';
    doneEvent.source = 'woocommerce';
    doneEvent.externalEventId = 'del-done';
    doneEvent.eventType = 'customer.created';
    doneEvent.wooResourceId = '42';
    doneEvent.rawPayload = { id: 42 };
    doneEvent.signature = null;
    doneEvent.status = WebhookEventStatus.PROCESSED;
    doneEvent.retryCount = 0;
    doneEvent.receivedAt = new Date();
    doneEvent.verifiedAt = new Date();
    doneEvent.processedAt = new Date();
    doneEvent.errorMessage = null;
    doneEvent.createdAt = new Date();
    doneEvent.updatedAt = new Date();
    eventStore.set(doneEvent.id, doneEvent);

    const result = await service.retryEvent('evt-done');
    expect(result.success).toBe(false);
    expect(result.message).toContain('not FAILED');
  });

  it('resolveNatsSubject maps all topics correctly', () => {
    const { service } = createFixture();
    expect(service.resolveNatsSubject('customer.created')).toBe('woocommerce.customer.created');
    expect(service.resolveNatsSubject('subscription.updated')).toBe('woocommerce.subscription.updated');
    expect(service.resolveNatsSubject('payment_intent.succeeded')).toBe('woocommerce.payment_intent.succeeded');
    expect(service.resolveNatsSubject('unknown.topic')).toBeNull();
  });
});
