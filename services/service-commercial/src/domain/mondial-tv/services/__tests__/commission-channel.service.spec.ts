import { describe, expect, it, beforeEach, mock } from 'bun:test';
import { CommissionChannelService } from '../commission-channel.service';
import { TypeCalcul, BaseCalcul } from '../../../commercial/entities/bareme-commission.entity';
import { SubscriptionPlanType, SubscriptionStatus, SubscriptionFrequency, StoreSource } from '../../../subscriptions/entities/subscription.entity';
import { CommissionCalculationService } from '../../../commercial/services/commission-calculation.service';

// Use type imports to avoid circular dependency issues
import type { BaremeCommissionEntity } from '../../../commercial/entities/bareme-commission.entity';
import type { SubscriptionEntity } from '../../../subscriptions/entities/subscription.entity';
import type { Repository } from 'typeorm';

describe('CommissionChannelService', () => {
  let service: CommissionChannelService;
  let mockBaremeRepository: Partial<Repository<BaremeCommissionEntity>>;
  let mockCommissionCalculationService: Partial<CommissionCalculationService>;

  beforeEach(() => {
    // Mock repository
    mockBaremeRepository = {
      createQueryBuilder: mock(() => ({
        leftJoinAndSelect: mock(() => ({
          where: mock(() => ({
            andWhere: mock(() => ({
              andWhere: mock(() => ({
                andWhere: mock(() => ({
                  andWhere: mock(() => ({
                    andWhere: mock(() => ({
                      orderBy: mock(() => ({
                        getOne: mock(() => null),
                      })),
                    })),
                  })),
                })),
              })),
            })),
          })),
        })),
      })),
    };

    // Mock commission calculation service
    mockCommissionCalculationService = {
      calculer: mock((contrat, bareme, montantBase) => ({
        montantCalcule: montantBase * (Number(bareme.tauxPourcentage) / 100),
        typeCalcul: bareme.typeCalcul,
        details: { montantBase, contrat },
      })),
    };

    service = new CommissionChannelService(
      mockBaremeRepository as Repository<BaremeCommissionEntity>,
      mockCommissionCalculationService as CommissionCalculationService,
    );
  });

  it('getApplicableBareme: FREE_AVOD returns null (no commission)', async () => {
    const result = await service.getApplicableBareme(
      SubscriptionPlanType.FREE_AVOD,
      'web_direct',
      'org-123',
    );

    expect(result).toBeNull();
  });

  it('getApplicableBareme: PREMIUM_SVOD with web_direct returns barème', async () => {
    const mockBareme: BaremeCommissionEntity = {
      id: 'bareme-1',
      organisationId: 'org-123',
      code: 'OTT_PREMIUM_WEB_DIRECT',
      nom: 'Commission Premium SVOD - Web Direct',
      description: 'Test',
      typeCalcul: TypeCalcul.POURCENTAGE,
      baseCalcul: BaseCalcul.CA_HT,
      montantFixe: null,
      tauxPourcentage: 15.0,
      recurrenceActive: false,
      tauxRecurrence: null,
      dureeRecurrenceMois: null,
      dureeReprisesMois: 3,
      tauxReprise: 100,
      typeProduit: 'PREMIUM_SVOD',
      profilRemuneration: null,
      societeId: null,
      canalVente: 'web_direct',
      repartitionCommercial: 100,
      repartitionManager: 0,
      repartitionAgence: 0,
      repartitionEntreprise: 0,
      version: 1,
      dateEffet: new Date('2026-01-01'),
      dateFin: null,
      actif: true,
      creePar: null,
      modifiePar: null,
      motifModification: null,
      createdBy: null,
      modifiedBy: null,
      paliers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Override mock to return barème
    mockBaremeRepository.createQueryBuilder = mock(() => ({
      leftJoinAndSelect: mock(() => ({
        where: mock(() => ({
          andWhere: mock(() => ({
            andWhere: mock(() => ({
              andWhere: mock(() => ({
                andWhere: mock(() => ({
                  andWhere: mock(() => ({
                    orderBy: mock(() => ({
                      getOne: mock(() => mockBareme),
                    })),
                  })),
                })),
              })),
            })),
          })),
        })),
      })),
    }));

    const result = await service.getApplicableBareme(
      SubscriptionPlanType.PREMIUM_SVOD,
      'web_direct',
      'org-123',
    );

    expect(result).not.toBeNull();
    expect(result?.code).toBe('OTT_PREMIUM_WEB_DIRECT');
    expect(result?.tauxPourcentage).toBe(15.0);
  });

  it('getApplicableBareme: VIP with apple_store returns lower rate barème', async () => {
    const mockBareme: BaremeCommissionEntity = {
      id: 'bareme-2',
      organisationId: 'org-123',
      code: 'OTT_VIP_APPLE',
      nom: 'Commission VIP - Apple Store',
      description: 'Lower rate due to Apple 30% cut',
      typeCalcul: TypeCalcul.POURCENTAGE,
      baseCalcul: BaseCalcul.CA_HT,
      montantFixe: null,
      tauxPourcentage: 12.0,
      recurrenceActive: false,
      tauxRecurrence: null,
      dureeRecurrenceMois: null,
      dureeReprisesMois: 3,
      tauxReprise: 100,
      typeProduit: 'VIP',
      profilRemuneration: null,
      societeId: null,
      canalVente: 'apple_store',
      repartitionCommercial: 100,
      repartitionManager: 0,
      repartitionAgence: 0,
      repartitionEntreprise: 0,
      version: 1,
      dateEffet: new Date('2026-01-01'),
      dateFin: null,
      actif: true,
      creePar: null,
      modifiePar: null,
      motifModification: null,
      createdBy: null,
      modifiedBy: null,
      paliers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockBaremeRepository.createQueryBuilder = mock(() => ({
      leftJoinAndSelect: mock(() => ({
        where: mock(() => ({
          andWhere: mock(() => ({
            andWhere: mock(() => ({
              andWhere: mock(() => ({
                andWhere: mock(() => ({
                  andWhere: mock(() => ({
                    orderBy: mock(() => ({
                      getOne: mock(() => mockBareme),
                    })),
                  })),
                })),
              })),
            })),
          })),
        })),
      })),
    }));

    const result = await service.getApplicableBareme(
      SubscriptionPlanType.VIP,
      'apple_store',
      'org-123',
    );

    expect(result).not.toBeNull();
    expect(result?.tauxPourcentage).toBe(12.0);
  });

  it('calculateCommission: FREE_AVOD subscription returns 0', async () => {
    const subscription: SubscriptionEntity = {
      id: 'sub-1',
      organisationId: 'org-123',
      clientId: 'client-1',
      planType: SubscriptionPlanType.FREE_AVOD,
      status: SubscriptionStatus.ACTIVE,
      frequency: SubscriptionFrequency.MONTHLY,
      trialStart: null,
      trialEnd: null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      nextChargeAt: null,
      amount: 0,
      currency: 'EUR',
      storeSource: StoreSource.WEB_DIRECT,
      imsSubscriptionId: null,
      couponId: null,
      cancelAtPeriodEnd: false,
      cancelledAt: null,
      suspendedAt: null,
      suspensionReason: null,
      addOns: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lines: [],
      history: [],
      cycles: [],
      statusHistory: [],
      contratId: null,
      retryCount: 0,
      startDate: '',
      endDate: null,
      pausedAt: null,
      resumedAt: null,
    };

    const commission = await service.calculateCommission(subscription, 'apporteur-1');

    expect(commission).toBe(0);
  });

  it('calculateCommission: PREMIUM_SVOD web_direct calculates correct commission', async () => {
    const mockBareme: BaremeCommissionEntity = {
      id: 'bareme-1',
      organisationId: 'org-123',
      code: 'OTT_PREMIUM_WEB_DIRECT',
      nom: 'Commission Premium SVOD - Web Direct',
      description: 'Test',
      typeCalcul: TypeCalcul.POURCENTAGE,
      baseCalcul: BaseCalcul.CA_HT,
      montantFixe: null,
      tauxPourcentage: 15.0,
      recurrenceActive: false,
      tauxRecurrence: null,
      dureeRecurrenceMois: null,
      dureeReprisesMois: 3,
      tauxReprise: 100,
      typeProduit: 'PREMIUM_SVOD',
      profilRemuneration: null,
      societeId: null,
      canalVente: 'web_direct',
      repartitionCommercial: 100,
      repartitionManager: 0,
      repartitionAgence: 0,
      repartitionEntreprise: 0,
      version: 1,
      dateEffet: new Date('2026-01-01'),
      dateFin: null,
      actif: true,
      creePar: null,
      modifiePar: null,
      motifModification: null,
      createdBy: null,
      modifiedBy: null,
      paliers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockBaremeRepository.createQueryBuilder = mock(() => ({
      leftJoinAndSelect: mock(() => ({
        where: mock(() => ({
          andWhere: mock(() => ({
            andWhere: mock(() => ({
              andWhere: mock(() => ({
                andWhere: mock(() => ({
                  andWhere: mock(() => ({
                    orderBy: mock(() => ({
                      getOne: mock(() => mockBareme),
                    })),
                  })),
                })),
              })),
            })),
          })),
        })),
      })),
    }));

    const subscription: SubscriptionEntity = {
      id: 'sub-2',
      organisationId: 'org-123',
      clientId: 'client-2',
      planType: SubscriptionPlanType.PREMIUM_SVOD,
      status: SubscriptionStatus.ACTIVE,
      frequency: SubscriptionFrequency.MONTHLY,
      trialStart: null,
      trialEnd: null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      nextChargeAt: new Date(),
      amount: 9.99,
      currency: 'EUR',
      storeSource: StoreSource.WEB_DIRECT,
      imsSubscriptionId: null,
      couponId: null,
      cancelAtPeriodEnd: false,
      cancelledAt: null,
      suspendedAt: null,
      suspensionReason: null,
      addOns: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lines: [],
      history: [],
      cycles: [],
      statusHistory: [],
      contratId: null,
      retryCount: 0,
      startDate: '',
      endDate: null,
      pausedAt: null,
      resumedAt: null,
    };

    const commission = await service.calculateCommission(subscription, 'apporteur-1');

    // 9.99 * 15% = 1.4985 ≈ 1.50
    expect(commission).toBeCloseTo(1.50, 2);
  });

  it('getAvailableChannels: returns all 6 OTT channels', () => {
    const channels = service.getAvailableChannels();

    expect(channels).toHaveLength(6);
    expect(channels).toContain('web_direct');
    expect(channels).toContain('apple_store');
    expect(channels).toContain('google_store');
    expect(channels).toContain('tv_store');
    expect(channels).toContain('operator');
    expect(channels).toContain('affiliate');
  });

  it('getChannelRates: FREE_AVOD returns empty map', async () => {
    const rates = await service.getChannelRates(SubscriptionPlanType.FREE_AVOD, 'org-123');

    expect(rates.size).toBe(0);
  });
});
