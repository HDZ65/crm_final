import { describe, expect, it } from 'bun:test';
import {
  WooCommerceSyncService,
  type ClientBasePort,
  type ClientSearchResult,
} from '../woocommerce-sync.service';
import type { IWooCommerceMappingRepository } from '../../repositories/IWooCommerceMappingRepository';
import {
  WooCommerceMappingEntity,
  WooCommerceEntityType,
} from '../../entities/woocommerce-mapping.entity';
import type { ISubscriptionRepository } from '../../../subscriptions/repositories/ISubscriptionRepository';

// Use plain string values matching the enums to avoid TypeORM decorator circular dependency issues in bun test
const SubscriptionStatus = {
  PENDING: 'PENDING' as const,
  ACTIVE: 'ACTIVE' as const,
  SUSPENDED: 'SUSPENDED' as const,
  CANCELLED: 'CANCELLED' as const,
  EXPIRED: 'EXPIRED' as const,
};

const SubscriptionFrequency = {
  MONTHLY: 'MONTHLY' as const,
  ANNUAL: 'ANNUAL' as const,
};

interface SubscriptionEntity {
  id: string;
  organisationId: string;
  clientId: string;
  contratId: string | null;
  status: string;
  frequency: string;
  amount: number;
  currency: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  nextChargeAt: Date | null;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

function makeSubscription(overrides: Partial<SubscriptionEntity> = {}): SubscriptionEntity {
  return {
    id: 'sub-1', organisationId: 'org-1', clientId: 'client-1', contratId: null,
    status: 'ACTIVE', frequency: 'MONTHLY', amount: 19.9, currency: 'EUR',
    startDate: '2026-01-01', endDate: null, pausedAt: null, resumedAt: null,
    nextChargeAt: '2026-02-01', retryCount: 0,
    createdAt: new Date(), updatedAt: new Date(),
    lines: [], history: [], cycles: [], statusHistory: [],
    ...overrides,
  };
}

function createFixture(options: {
  existingMappings?: WooCommerceMappingEntity[];
  existingClients?: ClientSearchResult[];
  subscriptions?: Map<string, SubscriptionEntity>;
} = {}) {
  const mappings = new Map<string, WooCommerceMappingEntity>();
  const savedMappings: WooCommerceMappingEntity[] = [];
  const savedSubscriptions: SubscriptionEntity[] = [];
  const clientCreated: Array<{ input: any }> = [];
  const clientUpdated: Array<{ clientId: string; input: any }> = [];
  let mappingIdCounter = 0;
  let subIdCounter = 0;

  for (const m of options.existingMappings || []) {
    mappings.set(`${m.organisationId}:${m.entityType}:${m.wooId}`, m);
  }

  const subscriptionStore = options.subscriptions || new Map<string, SubscriptionEntity>();

  const mappingRepository: IWooCommerceMappingRepository = {
    findById: async (id) => { for (const m of mappings.values()) { if (m.id === id) return m; } return null; },
    findByWooId: async (orgId, entityType, wooId) => mappings.get(`${orgId}:${entityType}:${wooId}`) || null,
    findByCrmEntityId: async (crmId) => { const r: WooCommerceMappingEntity[] = []; for (const m of mappings.values()) { if (m.crmEntityId === crmId) r.push(m); } return r; },
    findAll: async () => Array.from(mappings.values()),
    save: async (entity) => {
      if (!entity.id) { mappingIdCounter++; entity.id = `mapping-${mappingIdCounter}`; }
      mappings.set(`${entity.organisationId}:${entity.entityType}:${entity.wooId}`, entity);
      savedMappings.push({ ...entity });
      return entity;
    },
    delete: async () => {},
  };

  const subscriptionRepository = {
    findById: async (id: string) => subscriptionStore.get(id) || null,
    save: async (entity: SubscriptionEntity) => {
      if (!entity.id) { subIdCounter++; (entity as any).id = `sub-${subIdCounter}`; }
      subscriptionStore.set(entity.id, entity);
      savedSubscriptions.push({ ...entity });
      return entity;
    },
  } as unknown as ISubscriptionRepository;

  const existingClients = options.existingClients || [];
  const clientPort: ClientBasePort = {
    searchByEmail: async (_orgId, email) => existingClients.find((c) => c.email === email) || null,
    searchByPhone: async (_orgId, phone) => existingClients.find((c) => c.telephone === phone) || null,
    createClient: async (input) => {
      const client = { id: `client-new-${clientCreated.length + 1}`, email: input.email, telephone: input.telephone, nom: input.nom, prenom: input.prenom };
      clientCreated.push({ input });
      return client;
    },
    updateClient: async (clientId, input) => { clientUpdated.push({ clientId, input }); return { id: clientId, ...input } as ClientSearchResult; },
  };

  const service = new WooCommerceSyncService(mappingRepository, subscriptionRepository, clientPort);
  return { service, savedMappings, savedSubscriptions, clientCreated, clientUpdated, mappings, subscriptionStore };
}

describe('WooCommerceSyncService', () => {
  it('syncCustomer creates new client and mapping when no existing match', async () => {
    const { service, savedMappings, clientCreated } = createFixture();
    const result = await service.syncCustomer('org-1', '42', {
      id: 42, email: 'new@example.com', first_name: 'John', last_name: 'Doe',
      billing: { phone: '+33612345678', city: 'Paris' },
    });
    expect(result.isNew).toBe(true);
    expect(clientCreated.length).toBe(1);
    expect(savedMappings.length).toBe(1);
    expect(savedMappings[0].entityType).toBe(WooCommerceEntityType.CLIENT);
  });

  it('syncCustomer detects duplicate by email — mapping updated not duplicate created', async () => {
    const { service, savedMappings, clientCreated } = createFixture({
      existingClients: [{ id: 'existing-client-1', email: 'existing@example.com', nom: 'Dupont' }],
    });
    const result = await service.syncCustomer('org-1', '99', {
      id: 99, email: 'existing@example.com', first_name: 'Jean', last_name: 'Dupont',
    });
    expect(result.isNew).toBe(false);
    expect(result.clientId).toBe('existing-client-1');
    expect(clientCreated.length).toBe(0);
    expect(savedMappings.length).toBe(1);
    expect(savedMappings[0].crmEntityId).toBe('existing-client-1');
  });

  it('syncCustomer updates existing mapping when already synced', async () => {
    const existingMapping = new WooCommerceMappingEntity();
    existingMapping.id = 'map-exist';
    existingMapping.organisationId = 'org-1';
    existingMapping.entityType = WooCommerceEntityType.CLIENT;
    existingMapping.wooId = '42';
    existingMapping.crmEntityId = 'crm-client-1';
    existingMapping.lastSyncedAt = new Date('2026-01-01');
    existingMapping.createdAt = new Date();
    existingMapping.updatedAt = new Date();

    const { service, clientUpdated, clientCreated } = createFixture({ existingMappings: [existingMapping] });
    const result = await service.syncCustomer('org-1', '42', { id: 42, email: 'updated@example.com' });
    expect(result.isNew).toBe(false);
    expect(result.clientId).toBe('crm-client-1');
    expect(clientCreated.length).toBe(0);
    expect(clientUpdated.length).toBe(1);
  });

  it('syncSubscriptionCreated creates subscription with correct frequency', async () => {
    const { service, savedSubscriptions, savedMappings } = createFixture();
    const result = await service.syncSubscriptionCreated('org-1', '200', {
      id: 200, customer_id: 42, status: 'active', billing_period: 'month',
      total: '29.90', currency: 'EUR', start_date: '2026-01-15', next_payment_date: '2026-02-15',
    });
    expect(result.subscriptionId).toBeTruthy();
    expect(savedSubscriptions[0].frequency).toBe(SubscriptionFrequency.MONTHLY);
    expect(savedSubscriptions[0].status).toBe(SubscriptionStatus.ACTIVE);
    expect(savedSubscriptions[0].amount).toBe(29.9);
    expect(savedMappings[0].entityType).toBe(WooCommerceEntityType.SUBSCRIPTION);
  });

  it('syncSubscriptionCreated maps quarterly frequency correctly', async () => {
    const { service, savedSubscriptions } = createFixture();
    await service.syncSubscriptionCreated('org-1', '202', {
      id: 202, customer_id: 42, status: 'pending', billing_period: '3 months', total: '49.90',
    });
    expect(savedSubscriptions[0].frequency).toBe(SubscriptionFrequency.ANNUAL); // '3 months' → closest match is ANNUAL
    expect(savedSubscriptions[0].status).toBe(SubscriptionStatus.PENDING);
  });

  it('syncSubscriptionUpdated updates status and frequency', async () => {
    const existingSub = makeSubscription({ id: 'sub-existing', status: 'ACTIVE', frequency: 'MONTHLY' });
    const existingMapping = new WooCommerceMappingEntity();
    existingMapping.id = 'map-sub';
    existingMapping.organisationId = 'org-1';
    existingMapping.entityType = WooCommerceEntityType.SUBSCRIPTION;
    existingMapping.wooId = '300';
    existingMapping.crmEntityId = 'sub-existing';
    existingMapping.lastSyncedAt = new Date('2026-01-01');
    existingMapping.createdAt = new Date();
    existingMapping.updatedAt = new Date();

    const subscriptions = new Map<string, SubscriptionEntity>();
    subscriptions.set('sub-existing', existingSub);
    const { service, savedSubscriptions } = createFixture({ existingMappings: [existingMapping], subscriptions });

    const result = await service.syncSubscriptionUpdated('org-1', '300', {
      id: 300, status: 'on-hold', billing_period: 'week', total: '15.00',
    });
    expect(result.updated).toBe(true);
    expect(savedSubscriptions[0].status).toBe(SubscriptionStatus.SUSPENDED);
    expect(savedSubscriptions[0].frequency).toBe(SubscriptionFrequency.MONTHLY); // 'week' → MONTHLY fallback
  });

  it('mapWooFrequency maps all periods correctly', () => {
    const { service } = createFixture();
    expect(service.mapWooFrequency('week')).toBe(SubscriptionFrequency.MONTHLY);
    expect(service.mapWooFrequency('month')).toBe(SubscriptionFrequency.MONTHLY);
    expect(service.mapWooFrequency('3 months')).toBe(SubscriptionFrequency.ANNUAL);
    expect(service.mapWooFrequency('year')).toBe(SubscriptionFrequency.ANNUAL);
    expect(service.mapWooFrequency(undefined)).toBe(SubscriptionFrequency.MONTHLY);
  });

  it('mapWooStatus maps all statuses correctly', () => {
    const { service } = createFixture();
    expect(service.mapWooStatus('active')).toBe(SubscriptionStatus.ACTIVE);
    expect(service.mapWooStatus('on-hold')).toBe(SubscriptionStatus.SUSPENDED);
    expect(service.mapWooStatus('cancelled')).toBe(SubscriptionStatus.CANCELLED);
    expect(service.mapWooStatus('expired')).toBe(SubscriptionStatus.EXPIRED);
    expect(service.mapWooStatus(undefined)).toBe(SubscriptionStatus.PENDING);
  });

  it('syncSubscriptionCreated is idempotent — returns same ID on duplicate', async () => {
    const existingMapping = new WooCommerceMappingEntity();
    existingMapping.id = 'map-dup';
    existingMapping.organisationId = 'org-1';
    existingMapping.entityType = WooCommerceEntityType.SUBSCRIPTION;
    existingMapping.wooId = '200';
    existingMapping.crmEntityId = 'sub-already-exists';
    existingMapping.lastSyncedAt = new Date();
    existingMapping.createdAt = new Date();
    existingMapping.updatedAt = new Date();

    const { service, savedSubscriptions } = createFixture({ existingMappings: [existingMapping] });
    const result = await service.syncSubscriptionCreated('org-1', '200', { id: 200, status: 'active', billing_period: 'month' });
    expect(result.subscriptionId).toBe('sub-already-exists');
    expect(savedSubscriptions.length).toBe(0);
  });

  it('syncOrderCompleted creates mapping for order', async () => {
    const { service, savedMappings } = createFixture();
    const result = await service.syncOrderCompleted('org-1', '500', { id: 500, status: 'completed' });
    expect(result.orderId).toContain('woo-order-500');
    expect(savedMappings[0].entityType).toBe(WooCommerceEntityType.ORDER);
  });

  it('syncPaymentSucceeded creates mapping for payment', async () => {
    const { service, savedMappings } = createFixture();
    const result = await service.syncPaymentSucceeded('org-1', 'pi_abc', { id: 'pi_abc', amount: 2990 });
    expect(result.paymentId).toContain('woo-payment-pi_abc');
    expect(savedMappings[0].entityType).toBe(WooCommerceEntityType.PAYMENT);
  });
});
