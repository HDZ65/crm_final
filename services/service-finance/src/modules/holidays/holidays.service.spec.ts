import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { HolidaysService, HolidaysError } from './holidays.service';
import { HolidayZoneEntity } from './entities/holiday-zone.entity';
import { HolidayEntity, HolidayType } from './entities/holiday.entity';

describe('HolidaysService', () => {
  let service: HolidaysService;

  const mockHolidayZoneRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockHolidayRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockHolidayZone = {
    id: 'zone-fr',
    organisationId: 'org-1',
    code: 'FR',
    name: 'France',
    countryCode: 'FR',
    regionCode: undefined,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    holidays: [],
  } as unknown as HolidayZoneEntity;

  const mockHoliday: HolidayEntity = {
    id: 'holiday-1',
    holidayZoneId: 'zone-fr',
    date: new Date('2026-01-01'),
    name: 'Jour de l\'An',
    holidayType: HolidayType.PUBLIC,
    isRecurring: true,
    recurringMonth: 1,
    recurringDay: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    holidayZone: mockHolidayZone,
  } as HolidayEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HolidaysService,
        { provide: getRepositoryToken(HolidayZoneEntity), useValue: mockHolidayZoneRepo },
        { provide: getRepositoryToken(HolidayEntity), useValue: mockHolidayRepo },
      ],
    }).compile();

    service = module.get<HolidaysService>(HolidaysService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('checkEligibility', () => {
    it('should return ineligible for Saturday', async () => {
      const saturday = new Date('2026-01-03');

      const result = await service.checkEligibility(saturday, 'zone-fr');

      expect(result.isEligible).toBe(false);
      expect(result.isWeekend).toBe(true);
      expect(result.isHoliday).toBe(false);
      expect(result.reason).toBe('Saturday');
    });

    it('should return ineligible for Sunday', async () => {
      const sunday = new Date('2026-01-04');

      const result = await service.checkEligibility(sunday, 'zone-fr');

      expect(result.isEligible).toBe(false);
      expect(result.isWeekend).toBe(true);
      expect(result.isHoliday).toBe(false);
      expect(result.reason).toBe('Sunday');
    });

    it('should return ineligible for database holiday', async () => {
      const holidayDate = new Date('2026-01-01');
      mockHolidayRepo.findOne
        .mockResolvedValueOnce(mockHoliday)
        .mockResolvedValueOnce(null);

      const result = await service.checkEligibility(holidayDate, 'zone-fr');

      expect(result.isEligible).toBe(false);
      expect(result.isWeekend).toBe(false);
      expect(result.isHoliday).toBe(true);
      expect(result.holidayName).toBe('Jour de l\'An');
    });

    it('should return ineligible for recurring holiday', async () => {
      const recurringHolidayDate = new Date('2026-05-01');
      const recurringHoliday = {
        ...mockHoliday,
        recurringMonth: 5,
        recurringDay: 1,
        name: 'Fête du Travail',
      };
      // Service calls findOne twice: first for exact date, then for recurring
      mockHolidayRepo.findOne
        .mockResolvedValueOnce(null) // exact date lookup
        .mockResolvedValueOnce(recurringHoliday); // recurring lookup

      const result = await service.checkEligibility(recurringHolidayDate, 'zone-fr');

      expect(result.isEligible).toBe(false);
      expect(result.isHoliday).toBe(true);
      expect(result.holidayName).toBe('Fête du Travail');
    });

    it('should return eligible for regular weekday', async () => {
      const weekday = new Date('2026-01-05');
      mockHolidayRepo.findOne.mockResolvedValue(null);
      mockHolidayZoneRepo.findOne.mockResolvedValue(mockHolidayZone);

      const result = await service.checkEligibility(weekday, 'zone-fr');

      expect(result.isEligible).toBe(true);
      expect(result.isWeekend).toBe(false);
      expect(result.isHoliday).toBe(false);
    });

    it('should check date-holidays library for country-specific holidays', async () => {
      const bastilleDay = new Date('2026-07-14');
      mockHolidayRepo.findOne.mockResolvedValue(null);
      mockHolidayZoneRepo.findOne.mockResolvedValue(mockHolidayZone);

      const result = await service.checkEligibility(bastilleDay, 'zone-fr');

      expect(result.isEligible).toBe(false);
      expect(result.isHoliday).toBe(true);
    });
  });

  describe('getHolidaysForYear', () => {
    it('should return holidays for a given year', async () => {
      mockHolidayZoneRepo.findOne.mockResolvedValue(mockHolidayZone);
      mockHolidayRepo.find.mockResolvedValue([mockHoliday]);

      const result = await service.getHolidaysForYear('zone-fr', 2026);

      expect(result.length).toBeGreaterThan(0);
    });

    it('should throw HolidaysError when zone not found', async () => {
      mockHolidayZoneRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getHolidaysForRange('zone-invalid', new Date('2026-01-01'), new Date('2026-12-31')),
      ).rejects.toThrow(HolidaysError);
    });
  });

  describe('createHolidayZone', () => {
    it('should create a new holiday zone', async () => {
      const newZone = { ...mockHolidayZone, id: 'new-zone' };
      mockHolidayZoneRepo.create.mockReturnValue(newZone);
      mockHolidayZoneRepo.save.mockResolvedValue(newZone);

      const result = await service.createHolidayZone('org-1', 'DE', 'Germany', 'DE');

      expect(mockHolidayZoneRepo.create).toHaveBeenCalledWith({
        organisationId: 'org-1',
        code: 'DE',
        name: 'Germany',
        countryCode: 'DE',
        regionCode: undefined,
        isActive: true,
      });
      expect(result.id).toBe('new-zone');
    });

    it('should create a holiday zone with region code', async () => {
      const newZone = { ...mockHolidayZone, regionCode: 'BY' };
      mockHolidayZoneRepo.create.mockReturnValue(newZone);
      mockHolidayZoneRepo.save.mockResolvedValue(newZone);

      const result = await service.createHolidayZone('org-1', 'DE-BY', 'Bavaria', 'DE', 'BY');

      expect(mockHolidayZoneRepo.create).toHaveBeenCalledWith({
        organisationId: 'org-1',
        code: 'DE-BY',
        name: 'Bavaria',
        countryCode: 'DE',
        regionCode: 'BY',
        isActive: true,
      });
      expect(result.regionCode).toBe('BY');
    });
  });

  describe('createHoliday', () => {
    it('should create a new holiday', async () => {
      mockHolidayZoneRepo.findOne.mockResolvedValue(mockHolidayZone);
      mockHolidayRepo.create.mockReturnValue(mockHoliday);
      mockHolidayRepo.save.mockResolvedValue(mockHoliday);

      const result = await service.createHoliday(
        'zone-fr',
        new Date('2026-01-01'),
        'Jour de l\'An',
        'PUBLIC',
        true,
      );

      expect(result.name).toBe('Jour de l\'An');
    });

    it('should throw HolidaysError when zone not found', async () => {
      mockHolidayZoneRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createHoliday('zone-invalid', new Date(), 'Test', 'PUBLIC'),
      ).rejects.toThrow(HolidaysError);
    });
  });

  describe('getHolidayZonesByOrganisation', () => {
    it('should return all zones for an organisation', async () => {
      mockHolidayZoneRepo.find.mockResolvedValue([mockHolidayZone]);

      const result = await service.getHolidayZonesByOrganisation('org-1');

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('FR');
    });
  });
});
