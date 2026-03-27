import { describe, expect, it } from 'bun:test';
import { WooCommerceNatsWorkersService } from '../woocommerce-nats-workers.service';
import type { WooCommerceSyncService } from '../woocommerce-sync.service';
import type { WooCommerceWebhookService } from '../woocommerce-webhook.service';

function createWorkerFixture() {
  const syncCalls: Array<{ method: string; args: any[] }> = [];
  const markCalls: Array<{ method: string; eventId: string; error?: string }> = [];

  const syncService = {
    syncCustomer: async (...args: any[]) => { syncCalls.push({ method: 'syncCustomer', args }); return { clientId: 'c-1', isNew: true }; },
    syncSubscriptionCreated: async (...args: any[]) => { syncCalls.push({ method: 'syncSubscriptionCreated', args }); return { subscriptionId: 's-1' }; },
    syncSubscriptionUpdated: async (...args: any[]) => { syncCalls.push({ method: 'syncSubscriptionUpdated', args }); return { subscriptionId: 's-1', updated: true }; },
    syncOrderCompleted: async (...args: any[]) => { syncCalls.push({ method: 'syncOrderCompleted', args }); return { orderId: 'o-1', linkedSubscriptionId: null }; },
    syncPaymentSucceeded: async (...args: any[]) => { syncCalls.push({ method: 'syncPaymentSucceeded', args }); return { paymentId: 'p-1', linkedSubscriptionId: null }; },
  } as unknown as WooCommerceSyncService;

  const webhookService = {
    markProcessing: async (eventId: string) => { markCalls.push({ method: 'markProcessing', eventId }); },
    markProcessed: async (eventId: string) => { markCalls.push({ method: 'markProcessed', eventId }); },
    markFailed: async (eventId: string, error: string) => { markCalls.push({ method: 'markFailed', eventId, error }); },
  } as unknown as WooCommerceWebhookService;

  const workers = new WooCommerceNatsWorkersService(syncService, webhookService);
  return { workers, syncCalls, markCalls };
}

function makeMsg(overrides: Partial<{ eventId: string; organisationId: string; topic: string; wooResourceId: string; payload: Record<string, any> }> = {}) {
  return { eventId: 'evt-1', organisationId: 'org-1', topic: 'customer.created', wooResourceId: '42', payload: { id: 42 }, ...overrides };
}

describe('WooCommerceNatsWorkersService', () => {
  it('handleCustomerCreated calls syncCustomer and marks PROCESSED', async () => {
    const { workers, syncCalls, markCalls } = createWorkerFixture();
    await workers.handleCustomerCreated(makeMsg());
    expect(syncCalls[0].method).toBe('syncCustomer');
    expect(markCalls[0]).toEqual({ method: 'markProcessing', eventId: 'evt-1' });
    expect(markCalls[1]).toEqual({ method: 'markProcessed', eventId: 'evt-1' });
  });

  it('handleSubscriptionCreated calls syncSubscriptionCreated', async () => {
    const { workers, syncCalls, markCalls } = createWorkerFixture();
    await workers.handleSubscriptionCreated(makeMsg({ wooResourceId: '200' }));
    expect(syncCalls[0].method).toBe('syncSubscriptionCreated');
    expect(markCalls[1]).toEqual({ method: 'markProcessed', eventId: 'evt-1' });
  });

  it('handleSubscriptionUpdated calls syncSubscriptionUpdated', async () => {
    const { workers, syncCalls } = createWorkerFixture();
    await workers.handleSubscriptionUpdated(makeMsg({ wooResourceId: '300' }));
    expect(syncCalls[0].method).toBe('syncSubscriptionUpdated');
  });

  it('handleOrderCompleted calls syncOrderCompleted', async () => {
    const { workers, syncCalls } = createWorkerFixture();
    await workers.handleOrderCompleted(makeMsg({ wooResourceId: '500' }));
    expect(syncCalls[0].method).toBe('syncOrderCompleted');
  });

  it('handlePaymentSucceeded calls syncPaymentSucceeded', async () => {
    const { workers, syncCalls } = createWorkerFixture();
    await workers.handlePaymentSucceeded(makeMsg({ wooResourceId: 'pi_123' }));
    expect(syncCalls[0].method).toBe('syncPaymentSucceeded');
  });

  it('worker marks event as FAILED when sync throws', async () => {
    const markCalls: Array<{ method: string; eventId: string; error?: string }> = [];
    const failingSync = { syncCustomer: async () => { throw new Error('gRPC unavailable'); } } as unknown as WooCommerceSyncService;
    const webhookSvc = {
      markProcessing: async (eid: string) => { markCalls.push({ method: 'markProcessing', eventId: eid }); },
      markProcessed: async (eid: string) => { markCalls.push({ method: 'markProcessed', eventId: eid }); },
      markFailed: async (eid: string, err: string) => { markCalls.push({ method: 'markFailed', eventId: eid, error: err }); },
    } as unknown as WooCommerceWebhookService;
    const workers = new WooCommerceNatsWorkersService(failingSync, webhookSvc);

    await workers.handleCustomerCreated(makeMsg());
    expect(markCalls[0]).toEqual({ method: 'markProcessing', eventId: 'evt-1' });
    expect(markCalls[1].method).toBe('markFailed');
    expect(markCalls[1].error).toBe('gRPC unavailable');
  });
});
