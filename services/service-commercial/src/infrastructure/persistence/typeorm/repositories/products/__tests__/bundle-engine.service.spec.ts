import { describe, expect, it } from 'bun:test';
import { Repository } from 'typeorm';
import { NatsService } from '@crm/shared-kernel';
import { ConfigurationBundleEntity } from '../../../../../../domain/products/entities/configuration-bundle.entity';
import {
  BundleEngineService,
  BundleServiceCode,
} from '../bundle-engine.service';

function makeConfiguration(overrides: Partial<ConfigurationBundleEntity> = {}): ConfigurationBundleEntity {
  return {
    id: 'bundle-config-1',
    organisationId: 'org-1',
    remiseJustiPlusAvecConciergerie: 4,
    remiseWincashAvecConciergerie: 4,
    remiseBothAvecConciergerie: 8,
    prixStandalone: 9.9,
    prixJustiPlusStandalone: 9.9,
    prixWincashStandalone: 9.9,
    prixConciergerieStandalone: 9.9,
    proRataEnabled: true,
    groupedBillingEnabled: true,
    actif: true,
    metadata: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createFixture(configuration = makeConfiguration()) {
  const publishedEvents: Array<{ subject: string; payload: unknown }> = [];

  const configurationRepository = {
    findOne: async ({ where }: { where?: { id?: string; organisationId?: string; actif?: boolean } } = {}) => {
      if (where?.actif && !configuration.actif) {
        return null;
      }

      if (where?.id && where.id !== configuration.id) {
        return null;
      }

      if (where?.organisationId && where.organisationId !== configuration.organisationId) {
        return null;
      }

      return configuration;
    },
    save: async (entity: ConfigurationBundleEntity) => entity,
  } as unknown as Repository<ConfigurationBundleEntity>;

  const natsService = {
    isConnected: () => true,
    publish: async (subject: string, payload: unknown) => {
      publishedEvents.push({ subject, payload });
    },
  } as unknown as NatsService;

  const service = new BundleEngineService(configurationRepository, natsService);

  return {
    service,
    publishedEvents,
  };
}

describe('BundleEngineService', () => {
  it('solo Justi+ = 9.90', async () => {
    const { service } = createFixture();

    const pricing = await service.calculatePrice('client-1', [BundleServiceCode.JUSTI_PLUS], 'org-1');

    expect(pricing.totalHt).toBe(9.9);
    expect(pricing.remiseBundle).toBe(0);
    expect(pricing.items[0].finalPrice).toBe(9.9);
  });

  it('duo conciergerie + Justi+ applique la remise duo', async () => {
    const { service } = createFixture();

    const pricing = await service.calculatePrice(
      'client-1',
      [BundleServiceCode.CONCIERGERIE, BundleServiceCode.JUSTI_PLUS],
      'org-1',
    );

    const justiLine = pricing.items.find((item) => item.service === BundleServiceCode.JUSTI_PLUS);
    expect(justiLine?.finalPrice).toBe(5.9);
    expect(pricing.remiseBundle).toBe(4);
    expect(pricing.totalHt).toBe(15.8);
  });

  it('trio conciergerie + Justi+ + Wincash applique la remise bundle', async () => {
    const { service } = createFixture();

    const pricing = await service.calculatePrice(
      'client-1',
      [BundleServiceCode.CONCIERGERIE, BundleServiceCode.JUSTI_PLUS, BundleServiceCode.WINCASH],
      'org-1',
    );

    const justiLine = pricing.items.find((item) => item.service === BundleServiceCode.JUSTI_PLUS);
    const wincashLine = pricing.items.find((item) => item.service === BundleServiceCode.WINCASH);

    expect(justiLine?.finalPrice).toBe(5.9);
    expect(wincashLine?.finalPrice).toBe(5.9);
    expect(pricing.remiseBundle).toBe(8);
    expect(pricing.totalHt).toBe(21.7);
  });

  it('pro-rata milieu de cycle: 5.90 * 15/30', async () => {
    const { service } = createFixture();

    const pricing = await service.recalculateOnServiceChange({
      clientId: 'client-1',
      organisationId: 'org-1',
      services: [BundleServiceCode.CONCIERGERIE, BundleServiceCode.JUSTI_PLUS],
      serviceChanged: BundleServiceCode.JUSTI_PLUS,
      action: 'added',
      startDate: new Date('2026-01-15T00:00:00.000Z'),
      endDate: new Date('2026-01-30T00:00:00.000Z'),
    });

    const justiLine = pricing.items.find((item) => item.service === BundleServiceCode.JUSTI_PLUS);
    expect(justiLine?.finalPrice).toBe(2.95);
    expect(pricing.totalHt).toBe(12.85);
  });

  it('annulation conciergerie: Justi+ repasse a 9.90 et event NATS emis', async () => {
    const { service, publishedEvents } = createFixture();

    const pricing = await service.recalculateOnServiceChange({
      clientId: 'client-1',
      organisationId: 'org-1',
      services: [BundleServiceCode.JUSTI_PLUS],
      serviceChanged: BundleServiceCode.CONCIERGERIE,
      action: 'removed',
    });

    const justiLine = pricing.items.find((item) => item.service === BundleServiceCode.JUSTI_PLUS);
    expect(justiLine?.finalPrice).toBe(9.9);
    expect(pricing.remiseBundle).toBe(0);

    expect(publishedEvents.length).toBe(1);
    expect(publishedEvents[0].subject).toBe('bundle.price.recalculated');
  });
});
