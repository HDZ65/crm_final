import { describe, expect, it } from '@jest/globals';
import { DomainException } from '@crm/shared-kernel';
import type {
  IFulfillmentBatchLineRepository,
  IFulfillmentBatchRepository,
  IFulfillmentCutoffConfigRepository,
} from '../../repositories';
import {
  FulfillmentBatchLineStatus,
  FulfillmentBatchStatus,
  type AddressSnapshotEntity,
  type FulfillmentBatchEntity,
  type FulfillmentBatchLineEntity,
  type FulfillmentCutoffConfigEntity,
  type PreferenceSnapshotEntity,
} from '../../entities';
import {
  FulfillmentBatchService,
  type FulfillmentAddressSourcePort,
  type FulfillmentChargedSubscription,
  type FulfillmentChargedSubscriptionSourcePort,
  type FulfillmentCreateExpeditionRequest,
  type FulfillmentExpeditionBridgePort,
  type FulfillmentPreferenceSourcePort,
  type IFulfillmentAddressSnapshotRepository,
  type IFulfillmentPreferenceSnapshotRepository,
} from '../fulfillment-batch.service';

interface FixtureOptions {
  now?: Date;
  dueCandidates?: FulfillmentChargedSubscription[];
  chargedBySubscriptionId?: Record<string, FulfillmentChargedSubscription>;
  addresses?: Record<string, { rue: string; codePostal: string; ville: string; pays: string }>;
  preferences?: Record<string, Record<string, unknown>>;
  cutoffConfigs?: FulfillmentCutoffConfigEntity[];
  defaultTransporteurCompteId?: string;
}

function createFixture(options: FixtureOptions = {}) {
  const now = options.now || new Date('2026-02-02T15:30:00.000Z');

  const batches = new Map<string, FulfillmentBatchEntity>();
  const lines = new Map<string, FulfillmentBatchLineEntity>();
  const addressSnapshots = new Map<string, AddressSnapshotEntity>();
  const preferenceSnapshots = new Map<string, PreferenceSnapshotEntity>();
  const expeditionRequests: FulfillmentCreateExpeditionRequest[] = [];

  const chargedBySubscriptionId = new Map<string, FulfillmentChargedSubscription>();
  for (const item of options.dueCandidates || []) {
    chargedBySubscriptionId.set(item.subscriptionId, item);
  }
  for (const [subscriptionId, item] of Object.entries(options.chargedBySubscriptionId || {})) {
    chargedBySubscriptionId.set(subscriptionId, item);
  }

  const addresses = {
    ...(options.addresses || {}),
  };
  const preferences = {
    ...(options.preferences || {}),
  };

  const cutoffConfigs = [...(options.cutoffConfigs || [])];

  let batchSeq = 0;
  let lineSeq = 0;
  let addressSeq = 0;
  let preferenceSeq = 0;
  let expeditionSeq = 0;

  const batchRepository: IFulfillmentBatchRepository = {
    create: async (params) => {
      const batch: FulfillmentBatchEntity = {
        id: `batch-${++batchSeq}`,
        organisationId: params.organisationId,
        societeId: params.societeId,
        status: params.status || FulfillmentBatchStatus.OPEN,
        batchDate: params.batchDate,
        lineCount: 0,
        lockedAt: null,
        dispatchedAt: null,
        completedAt: null,
        createdAt: new Date(now),
        updatedAt: new Date(now),
        isOpen: () => false,
        isLocked: () => false,
        isDispatched: () => false,
        isCompleted: () => false,
      };
      batches.set(batch.id, batch);
      return { ...batch };
    },
    findById: async (id) => {
      const batch = batches.get(id);
      return batch ? { ...batch } : null;
    },
    findByOrganisationId: async (organisationId, status, limit = 50, offset = 0) => {
      const filtered = Array.from(batches.values()).filter((batch) => {
        if (batch.organisationId !== organisationId) {
          return false;
        }
        if (!status) {
          return true;
        }
        return batch.status === status;
      });
      return {
        batches: filtered.slice(offset, offset + limit).map((batch) => ({ ...batch })),
        total: filtered.length,
      };
    },
    findOpenBySocieteId: async (societeId) => {
      for (const batch of batches.values()) {
        if (batch.societeId === societeId && batch.status === FulfillmentBatchStatus.OPEN) {
          return { ...batch };
        }
      }
      return null;
    },
    update: async (id, params) => {
      const batch = batches.get(id);
      if (!batch) {
        throw new Error(`Batch ${id} not found`);
      }
      Object.assign(batch, params, { updatedAt: new Date(now) });
      batches.set(id, batch);
      return { ...batch };
    },
    delete: async (id) => {
      batches.delete(id);
    },
  };

  const batchLineRepository: IFulfillmentBatchLineRepository = {
    create: async (params) => {
      const line: FulfillmentBatchLineEntity = {
        id: `line-${++lineSeq}`,
        organisationId: params.organisationId,
        batchId: params.batchId,
        subscriptionId: params.subscriptionId,
        clientId: params.clientId,
        produitId: params.produitId,
        quantite: params.quantite,
        addressSnapshotId: params.addressSnapshotId,
        preferenceSnapshotId: params.preferenceSnapshotId,
        lineStatus: params.lineStatus || FulfillmentBatchLineStatus.TO_PREPARE,
        expeditionId: null,
        errorMessage: null,
        createdAt: new Date(now),
        updatedAt: new Date(now),
        isPrepared: () => false,
        isShipped: () => false,
        hasError: () => false,
      };
      lines.set(line.id, line);
      return { ...line };
    },
    findById: async (id) => {
      const line = lines.get(id);
      return line ? { ...line } : null;
    },
    findByBatchId: async (batchId, lineStatus, limit = 50, offset = 0) => {
      const filtered = Array.from(lines.values()).filter((line) => {
        if (line.batchId !== batchId) {
          return false;
        }
        if (!lineStatus) {
          return true;
        }
        return line.lineStatus === lineStatus;
      });
      return {
        lines: filtered.slice(offset, offset + limit).map((line) => ({ ...line })),
        total: filtered.length,
      };
    },
    findByClientId: async (clientId, limit = 50, offset = 0) => {
      const filtered = Array.from(lines.values()).filter((line) => line.clientId === clientId);
      return {
        lines: filtered.slice(offset, offset + limit).map((line) => ({ ...line })),
        total: filtered.length,
      };
    },
    update: async (id, params) => {
      const line = lines.get(id);
      if (!line) {
        throw new Error(`Line ${id} not found`);
      }
      Object.assign(line, params, { updatedAt: new Date(now) });
      lines.set(id, line);
      return { ...line };
    },
    delete: async (id) => {
      lines.delete(id);
    },
    countByBatchId: async (batchId) => {
      return Array.from(lines.values()).filter((line) => line.batchId === batchId).length;
    },
  };

  const cutoffConfigRepository: IFulfillmentCutoffConfigRepository = {
    create: async (params) => {
      const config: FulfillmentCutoffConfigEntity = {
        id: `cfg-${cutoffConfigs.length + 1}`,
        organisationId: params.organisationId,
        societeId: params.societeId,
        cutoffDayOfWeek: params.cutoffDayOfWeek,
        cutoffTime: params.cutoffTime,
        timezone: params.timezone,
        active: params.active,
        createdAt: new Date(now),
        updatedAt: new Date(now),
        isActive: () => false,
        isValidDayOfWeek: () => false,
        isValidTimeFormat: () => false,
      };
      cutoffConfigs.push(config);
      return { ...config };
    },
    findById: async (id) => {
      const config = cutoffConfigs.find((item) => item.id === id);
      return config ? { ...config } : null;
    },
    findByOrganisationId: async (organisationId) => {
      return cutoffConfigs
        .filter((config) => config.organisationId === organisationId)
        .map((config) => ({ ...config }));
    },
    findBySocieteId: async (societeId) => {
      return cutoffConfigs
        .filter((config) => config.societeId === societeId)
        .map((config) => ({ ...config }));
    },
    findActiveByOrganisationId: async (organisationId) => {
      return cutoffConfigs
        .filter((config) => config.organisationId === organisationId && config.active)
        .map((config) => ({ ...config }));
    },
    findBySocieteIdAndDayOfWeek: async (societeId, dayOfWeek) => {
      const config = cutoffConfigs.find(
        (item) => item.societeId === societeId && item.cutoffDayOfWeek === dayOfWeek,
      );
      return config ? { ...config } : null;
    },
    update: async (id, params) => {
      const config = cutoffConfigs.find((item) => item.id === id);
      if (!config) {
        throw new Error(`Config ${id} not found`);
      }
      Object.assign(config, params, { updatedAt: new Date(now) });
      return { ...config };
    },
    delete: async (id) => {
      const index = cutoffConfigs.findIndex((item) => item.id === id);
      if (index >= 0) {
        cutoffConfigs.splice(index, 1);
      }
    },
  };

  const addressSnapshotRepository: IFulfillmentAddressSnapshotRepository = {
    create: async (params) => {
      const snapshot: AddressSnapshotEntity = {
        id: `addr-${++addressSeq}`,
        organisationId: params.organisationId,
        clientId: params.clientId,
        rue: params.rue,
        codePostal: params.codePostal,
        ville: params.ville,
        pays: params.pays,
        capturedAt: params.capturedAt,
      };
      addressSnapshots.set(snapshot.id, snapshot);
      return { ...snapshot };
    },
    findById: async (id) => {
      const snapshot = addressSnapshots.get(id);
      return snapshot ? { ...snapshot } : null;
    },
  };

  const preferenceSnapshotRepository: IFulfillmentPreferenceSnapshotRepository = {
    create: async (params) => {
      const snapshot: PreferenceSnapshotEntity = {
        id: `pref-${++preferenceSeq}`,
        organisationId: params.organisationId,
        subscriptionId: params.subscriptionId,
        preferenceData: params.preferenceData,
        capturedAt: params.capturedAt,
      };
      preferenceSnapshots.set(snapshot.id, snapshot);
      return { ...snapshot };
    },
  };

  const chargedSubscriptionSource: FulfillmentChargedSubscriptionSourcePort = {
    listDueChargedSubscriptions: async ({ organisationId, societeId }) => {
      return Array.from(chargedBySubscriptionId.values())
        .filter(
          (item) => item.organisationId === organisationId && item.societeId === societeId,
        )
        .map((item) => ({ ...item }));
    },
    findBySubscriptionId: async (subscriptionId) => {
      const item = chargedBySubscriptionId.get(subscriptionId);
      return item ? { ...item } : null;
    },
  };

  const addressSource: FulfillmentAddressSourcePort = {
    getClientAddress: async (_organisationId, clientId) => {
      const value = addresses[clientId];
      if (value) {
        return { ...value };
      }

      return {
        rue: '10 rue inconnue',
        codePostal: '75001',
        ville: 'Paris',
        pays: 'FR',
      };
    },
  };

  const preferenceSource: FulfillmentPreferenceSourcePort = {
    getSubscriptionPreferences: async (_organisationId, subscriptionId) => {
      return {
        ...(preferences[subscriptionId] || {}),
      };
    },
  };

  const expeditionBridge: FulfillmentExpeditionBridgePort = {
    createExpedition: async (request) => {
      expeditionRequests.push(request);
      return { id: `exp-${++expeditionSeq}` };
    },
  };

  const service = new FulfillmentBatchService(
    batchRepository,
    batchLineRepository,
    cutoffConfigRepository,
    addressSnapshotRepository,
    preferenceSnapshotRepository,
    chargedSubscriptionSource,
    addressSource,
    preferenceSource,
    expeditionBridge,
    undefined,
    {
      now: () => new Date(now),
      defaultTransporteurCompteId: options.defaultTransporteurCompteId || 'carrier-default',
    },
  );

  return {
    service,
    batches,
    lines,
    addressSnapshots,
    preferenceSnapshots,
    expeditionRequests,
  };
}

function candidate(overrides: Partial<FulfillmentChargedSubscription> = {}): FulfillmentChargedSubscription {
  return {
    organisationId: 'org-1',
    societeId: 'soc-1',
    subscriptionId: 'sub-1',
    clientId: 'client-1',
    produitId: 'prod-1',
    quantite: 1,
    transporteurCompteId: 'carrier-1',
    contratId: 'contrat-1',
    nomProduit: 'Cafe Blend',
    poids: 0.25,
    referenceCommande: 'cmd-1',
    ...overrides,
  };
}

function cutoffConfig(overrides: Partial<FulfillmentCutoffConfigEntity> = {}): FulfillmentCutoffConfigEntity {
  return {
    id: 'cfg-1',
    organisationId: 'org-1',
    societeId: 'soc-1',
    cutoffDayOfWeek: 0,
    cutoffTime: '12:00',
    timezone: 'UTC',
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    isActive: () => false,
    isValidDayOfWeek: () => false,
    isValidTimeFormat: () => false,
    ...overrides,
  };
}

describe('FulfillmentBatchService', () => {
  it('createBatch: creates OPEN batch', async () => {
    const { service } = createFixture();

    const batch = await service.createBatch('org-1', 'soc-1');

    expect(batch.status).toBe(FulfillmentBatchStatus.OPEN);
    expect(batch.organisationId).toBe('org-1');
    expect(batch.societeId).toBe('soc-1');
  });

  it('getOpenBatch: returns existing OPEN batch', async () => {
    const { service } = createFixture();

    const created = await service.createBatch('org-1', 'soc-1');
    const open = await service.getOpenBatch('soc-1');

    expect(open.id).toBe(created.id);
    expect(open.status).toBe(FulfillmentBatchStatus.OPEN);
  });

  it('getOpenBatch: creates batch when none exists', async () => {
    const { service } = createFixture({
      cutoffConfigs: [cutoffConfig({ societeId: 'soc-9', organisationId: 'org-9' })],
    });

    const open = await service.getOpenBatch('soc-9');

    expect(open.status).toBe(FulfillmentBatchStatus.OPEN);
    expect(open.organisationId).toBe('org-9');
    expect(open.societeId).toBe('soc-9');
  });

  it('lockBatch: creates address snapshots for charged subscriptions', async () => {
    const { service, addressSnapshots } = createFixture({
      dueCandidates: [candidate()],
      addresses: {
        'client-1': {
          rue: '1 rue du Port',
          codePostal: '44000',
          ville: 'Nantes',
          pays: 'FR',
        },
      },
    });

    const batch = await service.createBatch('org-1', 'soc-1');
    await service.lockBatch(batch.id);

    expect(addressSnapshots.size).toBe(1);
    const snapshot = Array.from(addressSnapshots.values())[0];
    expect(snapshot.rue).toBe('1 rue du Port');
    expect(snapshot.codePostal).toBe('44000');
    expect(snapshot.ville).toBe('Nantes');
  });

  it('lockBatch: creates preference snapshots for charged subscriptions', async () => {
    const { service, preferenceSnapshots, lines } = createFixture({
      dueCandidates: [candidate()],
      preferences: {
        'sub-1': {
          origin: 'Brazil',
          grind: 'medium',
        },
      },
    });

    const batch = await service.createBatch('org-1', 'soc-1');
    const locked = await service.lockBatch(batch.id);

    expect(locked.status).toBe(FulfillmentBatchStatus.LOCKED);
    expect(preferenceSnapshots.size).toBe(1);
    const snapshot = Array.from(preferenceSnapshots.values())[0];
    expect(snapshot.preferenceData.origin).toBe('Brazil');
    expect(snapshot.preferenceData.grind).toBe('medium');
    const line = Array.from(lines.values())[0];
    expect(line.preferenceSnapshotId).toBe(snapshot.id);
  });

  it('dispatchBatch: creates expedition entities from locked lines', async () => {
    const { service, lines, expeditionRequests } = createFixture({
      dueCandidates: [candidate()],
      addresses: {
        'client-1': {
          rue: '5 avenue Centrale',
          codePostal: '69001',
          ville: 'Lyon',
          pays: 'FR',
        },
      },
    });

    const batch = await service.createBatch('org-1', 'soc-1');
    await service.lockBatch(batch.id);
    const dispatched = await service.dispatchBatch(batch.id);

    expect(dispatched.status).toBe(FulfillmentBatchStatus.DISPATCHED);
    expect(expeditionRequests.length).toBe(1);
    expect(expeditionRequests[0].destination.city).toBe('Lyon');
    expect(expeditionRequests[0].transporteur_compte_id).toBe('carrier-1');
    const line = Array.from(lines.values())[0];
    expect(line.expeditionId).toBe('exp-1');
    expect(line.lineStatus).toBe(FulfillmentBatchLineStatus.SHIPPED);
  });

  it('SUBSCRIPTION_CHARGED: event adds line to OPEN batch', async () => {
    const { service, batches, lines } = createFixture({
      addresses: {
        'client-evt': {
          rue: '18 rue des Evenements',
          codePostal: '31000',
          ville: 'Toulouse',
          pays: 'FR',
        },
      },
      preferences: {
        'sub-evt': { intensity: 'strong' },
      },
    });

    const batch = await service.createBatch('org-1', 'soc-1');

    await service.handleSubscriptionCharged({
      organisationId: 'org-1',
      societeId: 'soc-1',
      subscriptionId: 'sub-evt',
      clientId: 'client-evt',
      produitId: 'prod-evt',
      quantite: 2,
      transporteurCompteId: 'carrier-evt',
    });

    expect(batches.get(batch.id)?.lineCount).toBe(1);

    await service.lockBatch(batch.id);

    expect(lines.size).toBe(1);
    const line = Array.from(lines.values())[0];
    expect(line.subscriptionId).toBe('sub-evt');
    expect(line.quantite).toBe(2);
  });

  it('runCutoffJob: auto-locks OPEN batch when cutoff is reached', async () => {
    const { service } = createFixture({
      dueCandidates: [candidate()],
      cutoffConfigs: [
        cutoffConfig({
          organisationId: 'org-1',
          societeId: 'soc-1',
          cutoffDayOfWeek: 0,
          cutoffTime: '12:00',
          timezone: 'UTC',
        }),
      ],
      now: new Date('2026-02-02T15:30:00.000Z'),
    });

    const batch = await service.createBatch('org-1', 'soc-1');
    const lockedBatches = await service.runCutoffJob('org-1', new Date('2026-02-02T15:30:00.000Z'));

    expect(lockedBatches.length).toBe(1);
    expect(lockedBatches[0].id).toBe(batch.id);
    expect(lockedBatches[0].status).toBe(FulfillmentBatchStatus.LOCKED);
  });

  it('invalid transition: lockBatch rejects DISPATCHED -> OPEN path', async () => {
    const { service, batches } = createFixture();

    const batch = await service.createBatch('org-1', 'soc-1');
    const stored = batches.get(batch.id);
    if (!stored) {
      throw new Error('Expected batch in fixture map');
    }
    stored.status = FulfillmentBatchStatus.DISPATCHED;

    await expect(service.lockBatch(batch.id)).rejects.toBeInstanceOf(DomainException);
  });

  it('completeBatch: transitions DISPATCHED -> COMPLETED', async () => {
    const { service } = createFixture({
      dueCandidates: [candidate()],
    });

    const batch = await service.createBatch('org-1', 'soc-1');
    await service.lockBatch(batch.id);
    await service.dispatchBatch(batch.id);
    const completed = await service.completeBatch(batch.id);

    expect(completed.status).toBe(FulfillmentBatchStatus.COMPLETED);
    expect(completed.completedAt).toBeTruthy();
  });
});
