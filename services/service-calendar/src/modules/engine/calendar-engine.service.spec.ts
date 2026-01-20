import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CalendarEngineService, CalendarError } from './calendar-engine.service.js';
import { PlannedDebitEntity } from './entities/planned-debit.entity.js';
import { ConfigurationResolverService, ResolvedConfig } from '../configuration/configuration-resolver.service.js';
import { HolidaysService, DateEligibility } from '../holidays/holidays.service.js';
import { DebitDateMode, DebitBatch, DateShiftStrategy } from '../configuration/entities/system-debit-configuration.entity.js';

describe('CalendarEngineService', () => {
  let service: CalendarEngineService;
  let configResolver: jest.Mocked<ConfigurationResolverService>;
  let holidaysService: jest.Mocked<HolidaysService>;

  const mockPlannedDebitRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockConfig: ResolvedConfig = {
    mode: DebitDateMode.BATCH,
    batch: DebitBatch.L1,
    shiftStrategy: DateShiftStrategy.NEXT_BUSINESS_DAY,
    holidayZoneId: 'zone-fr',
    appliedLevel: 'system',
    appliedConfigId: 'config-1',
  };

  const mockEligibleDate: DateEligibility = {
    isEligible: true,
    isWeekend: false,
    isHoliday: false,
  };

  const mockWeekendDate: DateEligibility = {
    isEligible: false,
    isWeekend: true,
    isHoliday: false,
    reason: 'Saturday',
  };

  const mockHolidayDate: DateEligibility = {
    isEligible: false,
    isWeekend: false,
    isHoliday: true,
    holidayName: 'Jour de l\'An',
    reason: 'Holiday: Jour de l\'An',
  };

  beforeEach(async () => {
    const mockConfigResolver = {
      resolve: jest.fn(),
    };

    const mockHolidaysService = {
      checkEligibility: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarEngineService,
        {
          provide: getRepositoryToken(PlannedDebitEntity),
          useValue: mockPlannedDebitRepo,
        },
        {
          provide: ConfigurationResolverService,
          useValue: mockConfigResolver,
        },
        {
          provide: HolidaysService,
          useValue: mockHolidaysService,
        },
      ],
    }).compile();

    service = module.get<CalendarEngineService>(CalendarEngineService);
    configResolver = module.get(ConfigurationResolverService);
    holidaysService = module.get(HolidaysService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculatePlannedDate', () => {
    it('should calculate date for L1 batch (day 1 of month)', async () => {
      configResolver.resolve.mockResolvedValue(mockConfig);
      holidaysService.checkEligibility.mockResolvedValue(mockEligibleDate);

      const result = await service.calculatePlannedDate({
        organisationId: 'org-1',
        targetMonth: 3,
        targetYear: 2026,
      });

      expect(result.plannedDebitDate).toBe('2026-03-01');
      expect(result.wasShifted).toBe(false);
      expect(result.resolvedConfig.appliedLevel).toBe('system');
    });

    it('should calculate date for L2 batch (day 8 of month)', async () => {
      const l2Config = { ...mockConfig, batch: DebitBatch.L2 };
      configResolver.resolve.mockResolvedValue(l2Config);
      holidaysService.checkEligibility.mockResolvedValue(mockEligibleDate);

      const result = await service.calculatePlannedDate({
        organisationId: 'org-1',
        targetMonth: 3,
        targetYear: 2026,
      });

      expect(result.plannedDebitDate).toBe('2026-03-08');
      expect(result.wasShifted).toBe(false);
    });

    it('should calculate date for L3 batch (day 15 of month)', async () => {
      const l3Config = { ...mockConfig, batch: DebitBatch.L3 };
      configResolver.resolve.mockResolvedValue(l3Config);
      holidaysService.checkEligibility.mockResolvedValue(mockEligibleDate);

      const result = await service.calculatePlannedDate({
        organisationId: 'org-1',
        targetMonth: 3,
        targetYear: 2026,
      });

      expect(result.plannedDebitDate).toBe('2026-03-15');
    });

    it('should calculate date for L4 batch (day 22 of month)', async () => {
      const l4Config = { ...mockConfig, batch: DebitBatch.L4 };
      configResolver.resolve.mockResolvedValue(l4Config);
      holidaysService.checkEligibility.mockResolvedValue(mockEligibleDate);

      const result = await service.calculatePlannedDate({
        organisationId: 'org-1',
        targetMonth: 3,
        targetYear: 2026,
      });

      expect(result.plannedDebitDate).toBe('2026-03-22');
    });

    it('should calculate date for FIXED_DAY mode', async () => {
      const fixedDayConfig: ResolvedConfig = {
        ...mockConfig,
        mode: DebitDateMode.FIXED_DAY,
        fixedDay: 15,
        batch: undefined,
      };
      configResolver.resolve.mockResolvedValue(fixedDayConfig);
      holidaysService.checkEligibility.mockResolvedValue(mockEligibleDate);

      const result = await service.calculatePlannedDate({
        organisationId: 'org-1',
        targetMonth: 3,
        targetYear: 2026,
      });

      expect(result.plannedDebitDate).toBe('2026-03-15');
    });

    it('should shift date to next business day when target falls on weekend', async () => {
      configResolver.resolve.mockResolvedValue(mockConfig);
      holidaysService.checkEligibility
        .mockResolvedValueOnce(mockWeekendDate)
        .mockResolvedValueOnce(mockEligibleDate);

      const result = await service.calculatePlannedDate({
        organisationId: 'org-1',
        targetMonth: 3,
        targetYear: 2026,
      });

      expect(result.wasShifted).toBe(true);
      expect(result.shiftReason).toBe('weekend');
    });

    it('should shift date to next business day when target falls on holiday', async () => {
      configResolver.resolve.mockResolvedValue(mockConfig);
      holidaysService.checkEligibility
        .mockResolvedValueOnce(mockHolidayDate)
        .mockResolvedValueOnce(mockEligibleDate);

      const result = await service.calculatePlannedDate({
        organisationId: 'org-1',
        targetMonth: 1,
        targetYear: 2026,
      });

      expect(result.wasShifted).toBe(true);
      expect(result.shiftReason).toContain('holiday');
    });

    it('should use PREVIOUS_BUSINESS_DAY strategy when configured', async () => {
      const prevDayConfig = { ...mockConfig, shiftStrategy: DateShiftStrategy.PREVIOUS_BUSINESS_DAY };
      configResolver.resolve.mockResolvedValue(prevDayConfig);
      holidaysService.checkEligibility
        .mockResolvedValueOnce(mockWeekendDate)
        .mockResolvedValueOnce(mockEligibleDate);

      const result = await service.calculatePlannedDate({
        organisationId: 'org-1',
        targetMonth: 3,
        targetYear: 2026,
      });

      expect(result.wasShifted).toBe(true);
    });

    it('should use NEXT_WEEK_SAME_DAY strategy when configured', async () => {
      const nextWeekConfig = { ...mockConfig, shiftStrategy: DateShiftStrategy.NEXT_WEEK_SAME_DAY };
      configResolver.resolve.mockResolvedValue(nextWeekConfig);
      holidaysService.checkEligibility
        .mockResolvedValueOnce(mockWeekendDate)
        .mockResolvedValueOnce(mockEligibleDate);

      const result = await service.calculatePlannedDate({
        organisationId: 'org-1',
        targetMonth: 3,
        targetYear: 2026,
      });

      expect(result.wasShifted).toBe(true);
    });

    it('should include resolution trace when requested', async () => {
      configResolver.resolve.mockResolvedValue(mockConfig);
      holidaysService.checkEligibility.mockResolvedValue(mockEligibleDate);

      const result = await service.calculatePlannedDate({
        organisationId: 'org-1',
        targetMonth: 3,
        targetYear: 2026,
        includeResolutionTrace: true,
      });

      expect(result.resolutionTrace).toBeDefined();
      expect(result.resolutionTrace!.length).toBeGreaterThan(0);
    });

    it('should throw CalendarError when batch is required but not provided', async () => {
      const invalidConfig = { ...mockConfig, batch: undefined };
      configResolver.resolve.mockResolvedValue(invalidConfig);

      await expect(
        service.calculatePlannedDate({
          organisationId: 'org-1',
          targetMonth: 3,
          targetYear: 2026,
        }),
      ).rejects.toThrow(CalendarError);
    });

    it('should throw CalendarError when fixedDay is out of range', async () => {
      const invalidConfig: ResolvedConfig = {
        ...mockConfig,
        mode: DebitDateMode.FIXED_DAY,
        fixedDay: 30,
        batch: undefined,
      };
      configResolver.resolve.mockResolvedValue(invalidConfig);

      await expect(
        service.calculatePlannedDate({
          organisationId: 'org-1',
          targetMonth: 3,
          targetYear: 2026,
        }),
      ).rejects.toThrow(CalendarError);
    });
  });

  describe('calculateBatch', () => {
    it('should process multiple inputs and return results', async () => {
      configResolver.resolve.mockResolvedValue(mockConfig);
      holidaysService.checkEligibility.mockResolvedValue(mockEligibleDate);

      const inputs = [
        { contratId: 'c1', clientId: 'cl1', societeId: 's1', amountCents: 10000, currency: 'EUR' },
        { contratId: 'c2', clientId: 'cl2', societeId: 's2', amountCents: 20000, currency: 'EUR' },
      ];

      const result = await service.calculateBatch(inputs, 'org-1', 3, 2026);

      expect(result.totalCount).toBe(2);
      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(0);
      expect(result.results).toHaveLength(2);
    });

    it('should handle individual failures in batch without stopping', async () => {
      configResolver.resolve
        .mockResolvedValueOnce(mockConfig)
        .mockRejectedValueOnce(new Error('Config not found'));
      holidaysService.checkEligibility.mockResolvedValue(mockEligibleDate);

      const inputs = [
        { contratId: 'c1', clientId: 'cl1', societeId: 's1', amountCents: 10000, currency: 'EUR' },
        { contratId: 'c2', clientId: 'cl2', societeId: 's2', amountCents: 20000, currency: 'EUR' },
      ];

      const result = await service.calculateBatch(inputs, 'org-1', 3, 2026);

      expect(result.totalCount).toBe(2);
      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(1);
      expect(result.results[1].success).toBe(false);
      expect(result.results[1].errorMessage).toBeDefined();
    });
  });
});
