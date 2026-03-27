import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WincashService } from './wincash.service';

describe('WincashService', () => {
  let service: WincashService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WincashService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config: Record<string, string> = {
                WINCASH_USE_MOCK: 'true',
                WINCASH_API_URL: 'https://api.wincash.fr/v1',
                WINCASH_API_KEY: '',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<WincashService>(WincashService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCustomer', () => {
    it('should return mock customer when WINCASH_USE_MOCK=true', async () => {
      const result = await service.getCustomer('ext-123');
      expect(result).toBeDefined();
      expect(result!.externalId).toBe('ext-123');
      expect(result!.email).toContain('ext-123');
      expect(result!.firstName).toBeDefined();
      expect(result!.lastName).toBeDefined();
      expect(result!.loyaltyPoints).toBeGreaterThanOrEqual(0);
      expect(result!.tier).toBeDefined();
    });
  });

  describe('syncCustomer', () => {
    it('should return mock customer data', async () => {
      const result = await service.syncCustomer('ext-456');
      expect(result).toBeDefined();
      expect(result.externalId).toBe('ext-456');
    });
  });

  describe('getSubscription', () => {
    it('should return mock subscription when WINCASH_USE_MOCK=true', async () => {
      const result = await service.getSubscription('sub-123');
      expect(result).toBeDefined();
      expect(result!.externalId).toBe('sub-123');
      expect(result!.status).toBe('active');
      expect(result!.programId).toBeDefined();
      expect(result!.startDate).toBeDefined();
    });
  });

  describe('syncCashbackOperations', () => {
    it('should return mock sync result', async () => {
      const result = await service.syncCashbackOperations('org-123');
      expect(result).toBeDefined();
      expect(result.operationsCreees).toBeGreaterThanOrEqual(0);
      expect(result.operationsMisesAJour).toBeGreaterThanOrEqual(0);
      expect(result.erreurs).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.syncId).toBeDefined();
      expect(result.syncedAt).toBeInstanceOf(Date);
    });

    it('should accept optional clientId and since parameters', async () => {
      const result = await service.syncCashbackOperations(
        'org-123',
        'client-456',
        '2025-01-01T00:00:00Z',
        true,
      );
      expect(result).toBeDefined();
      expect(result.syncId).toBeDefined();
    });
  });

  describe('getCashbackOperation', () => {
    it('should return mock cashback operation', async () => {
      const result = await service.getCashbackOperation('cb-123');
      expect(result).toBeDefined();
      expect(result!.externalId).toBe('cb-123');
      expect(result!.type).toBe('gain');
      expect(result!.montant).toBeGreaterThan(0);
      expect(result!.devise).toBe('EUR');
    });
  });
});
