import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JustiPlusService } from './justi-plus.service';

describe('JustiPlusService', () => {
  let service: JustiPlusService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JustiPlusService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config: Record<string, string> = {
                JUSTI_PLUS_USE_MOCK: 'true',
                JUSTI_PLUS_API_URL: 'https://api.justi-plus.fr/v1',
                JUSTI_PLUS_API_KEY: '',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<JustiPlusService>(JustiPlusService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchCases', () => {
    it('should return mock sync result when JUSTI_PLUS_USE_MOCK=true', async () => {
      const result = await service.fetchCases('org-123');
      expect(result).toBeDefined();
      expect(result.cases).toBeInstanceOf(Array);
      expect(result.cases.length).toBeGreaterThan(0);
      expect(result.totalFetched).toBe(result.cases.length);
      expect(result.syncTimestamp).toBeDefined();
    });

    it('should return cases with correct structure', async () => {
      const result = await service.fetchCases('org-123', 'client-456');
      const firstCase = result.cases[0];

      expect(firstCase.externalId).toBeDefined();
      expect(firstCase.organisationId).toBe('org-123');
      expect(firstCase.titre).toBeDefined();
      expect(firstCase.type).toBeDefined();
      expect(firstCase.statut).toBeDefined();
      expect(firstCase.montantCouvert).toBeGreaterThanOrEqual(0);
      expect(firstCase.montantFranchise).toBeGreaterThanOrEqual(0);
    });
  });

  describe('suspendSubscription', () => {
    it('should return mock success response', async () => {
      const result = await service.suspendSubscription('ext-123');
      expect(result.success).toBe(true);
      expect(result.externalId).toBe('ext-123');
      expect(result.action).toBe('suspend');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('resumeSubscription', () => {
    it('should return mock success response', async () => {
      const result = await service.resumeSubscription('ext-456');
      expect(result.success).toBe(true);
      expect(result.externalId).toBe('ext-456');
      expect(result.action).toBe('resume');
    });
  });

  describe('cancelSubscription', () => {
    it('should return mock success response', async () => {
      const result = await service.cancelSubscription('ext-789');
      expect(result.success).toBe(true);
      expect(result.externalId).toBe('ext-789');
      expect(result.action).toBe('cancel');
    });
  });
});
