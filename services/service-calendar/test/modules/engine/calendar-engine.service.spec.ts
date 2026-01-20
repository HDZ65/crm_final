import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalendarEngineService } from '../../src/modules/engine/calendar-engine.service.js';
import { HolidayZoneEntity } from '../../src/modules/holidays/entities/holiday-zone.entity.js';
import { SystemDebitConfigurationEntity } from '../../src/modules/configuration/entities/system-debit-configuration.entity.js';
import { HolidayEntity } from '../../src/modules/holidays/entities/holiday.entity.js';

describe('CalendarEngineService', () => {
  let service: CalendarEngineService;
  let holidayZoneRepo: Repository<HolidayZoneEntity>;
  let systemConfigRepo: Repository<SystemDebitConfigurationEntity>;
  let holidayRepo: Repository<HolidayEntity>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: CalendarEngineService,
          useFactory: () => {
            return new CalendarEngineService(
              { get: () => ({}) as any },
              { get: () => ({}) as any },
              { get: () => ({}) as any },
              { get: () => ({}) as any },
            );
          },
        },
      ],
    }).compile();

    service = module.get<CalendarEngineService>(CalendarEngineService);
    holidayZoneRepo = module.get(getRepositoryToken(HolidayZoneEntity));
    systemConfigRepo = module.get(getRepositoryToken(SystemDebitConfigurationEntity));
    holidayRepo = module.get(getRepositoryToken(HolidayEntity));
  });

  describe('calculatePlannedDate', () => {
    it('should calculate date with BATCH mode - L1 (days 1-7)', async () => {
      jest.spyOn(holidayZoneRepo, 'findOne').mockResolvedValue(undefined);
      jest.spyOn(systemConfigRepo, 'findOne').mockResolvedValue({
        defaultMode: 'BATCH' as any,
        defaultBatch: 'L1' as any,
        shiftStrategy: 'NEXT_BUSINESS_DAY' as any,
        holidayZoneId: 'test-zone-id' as any,
        isActive: true,
      });
      jest.spyOn(holidayRepo, 'checkEligibility').mockResolvedValue({
        isEligible: true,
        isWeekend: false,
        isHoliday: false,
      });

      const result = await service.calculatePlannedDate({
        organisationId: 'test-org',
        targetMonth: 1,
        targetYear: 2026,
      });

      expect(result.plannedDebitDate).toBe('2026-01-01');
      expect(result.wasShifted).toBe(false);
      expect(result.shiftReason).toBe('');
      expect(result.resolvedConfig.appliedLevel).toBe('SYSTEM_DEFAULT');
    });

    it('should shift date when ineligible (weekend)', async () => {
      jest.spyOn(systemConfigRepo, 'findOne').mockResolvedValue({
        defaultMode: 'BATCH' as any,
        defaultBatch: 'L1' as any,
        shiftStrategy: 'NEXT_BUSINESS_DAY' as any,
        holidayZoneId: 'test-zone-id' as any,
        isActive: true,
      });
      jest.spyOn(holidayRepo, 'checkEligibility').mockResolvedValue({
        isEligible: false,
        isWeekend: true,
        isHoliday: false,
      });
      jest.spyOn(holidayRepo, 'findNextEligibleDate').mockResolvedValue(new Date('2026-01-02'));

      const result = await service.calculatePlannedDate({
        organisationId: 'test-org',
        targetMonth: 1,
        targetYear: 2026,
      });

      expect(result.plannedDebitDate).toBe('2026-01-02');
      expect(result.wasShifted).toBe(true);
      expect(result.shiftReason).toBe('weekend');
    });

    it('should shift date when ineligible (holiday)', async () => {
      jest.spyOn(systemConfigRepo, 'findOne').mockResolvedValue({
        defaultMode: 'BATCH' as any,
        defaultBatch: 'L1' as any,
        shiftStrategy: 'NEXT_BUSINESS_DAY' as any,
        holidayZoneId: 'test-zone-id' as any,
        isActive: true,
      });
      jest.spyOn(holidayRepo, 'checkEligibility').mockResolvedValue({
        isEligible: false,
        isWeekend: false,
        isHoliday: true,
        holidayName: 'Test Holiday',
      });
      jest.spyOn(holidayRepo, 'findNextEligibleDate').mockResolvedValue(new Date('2026-01-02'));

      const result = await service.calculatePlannedDate({
        organisationId: 'test-org',
        targetMonth: 1,
        targetYear: 2026,
      });

      expect(result.plannedDebitDate).toBe('2026-01-02');
      expect(result.wasShifted).toBe(true);
      expect(result.shiftReason).toBe('holiday:Test Holiday');
    });

    it('should use FIXED_DAY mode when configured', async () => {
      jest.spyOn(systemConfigRepo, 'findOne').mockResolvedValue({
        defaultMode: 'FIXED_DAY' as any,
        defaultFixedDay: 15 as any,
        shiftStrategy: 'NEXT_BUSINESS_DAY' as any,
        holidayZoneId: 'test-zone-id' as any,
        isActive: true,
      });
      jest.spyOn(holidayRepo, 'checkEligibility').mockResolvedValue({
        isEligible: true,
        isWeekend: false,
        isHoliday: false,
      });

      const result = await service.calculatePlannedDate({
        organisationId: 'test-org',
        targetMonth: 1,
        targetYear: 2026,
      });

      expect(result.plannedDebitDate).toBe('2026-01-15');
      expect(result.resolvedConfig.appliedLevel).toBe('SYSTEM_DEFAULT');
    });

    it('should throw error for invalid mode', async () => {
      jest.spyOn(systemConfigRepo, 'findOne').mockResolvedValue({
        defaultMode: 'BATCH' as any,
        defaultBatch: 'L1' as any,
        shiftStrategy: 'NEXT_BUSINESS_DAY' as any,
        holidayZoneId: 'test-zone-id' as any,
        isActive: true,
      });

      jest.spyOn(holidayRepo, 'checkEligibility').mockResolvedValue({
        isEligible: true,
        isWeekend: false,
        isHoliday: false,
      });

      await expect(
        service.calculatePlannedDate({
          organisationId: 'test-org',
          targetMonth: 1,
          targetYear: 2026,
          referenceDate: '2026-01-01',
        }),
      ).rejects.toThrow('INVALID_MODE');
    });
  });

  describe('batch ranges', () => {
    it('should have correct batch ranges defined', () => {
      // Access private batchRanges through any due to TypeScript
      const service = new CalendarEngineService(
        { get: () => ({}) } as any,
        { get: () => ({}) } as any,
        { get: () => ({}) } as any,
      );
      
      expect((service as any).batchRanges).toEqual({
        L1: [1, 7],
        L2: [8, 14],
        L3: [15, 21],
        L4: [22, 31],
      });
    });
  });
});
