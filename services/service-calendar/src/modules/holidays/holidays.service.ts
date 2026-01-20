import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { getDay, format, getMonth, getDate, startOfYear, endOfYear } from 'date-fns';
import Holidays from 'date-holidays';

import { HolidayZoneEntity } from './entities/holiday-zone.entity.js';
import { HolidayEntity } from './entities/holiday.entity.js';

export interface DateEligibility {
  isEligible: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  reason?: string;
}

export interface HolidayInfo {
  date: string;
  name: string;
  type: string;
}

export class HolidaysError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'HolidaysError';
  }
}

@Injectable()
export class HolidaysService implements OnModuleInit {
  private readonly logger = new Logger(HolidaysService.name);
  private holidayCalculators: Map<string, Holidays> = new Map();

  constructor(
    @InjectRepository(HolidayZoneEntity)
    private readonly holidayZoneRepo: Repository<HolidayZoneEntity>,
    @InjectRepository(HolidayEntity)
    private readonly holidayRepo: Repository<HolidayEntity>,
  ) {}

  async onModuleInit() {
    this.logger.log('HolidaysService initialized');
  }

  async checkEligibility(date: Date, holidayZoneId: string): Promise<DateEligibility> {
    const dayOfWeek = getDay(date);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      return {
        isEligible: false,
        isWeekend: true,
        isHoliday: false,
        reason: dayOfWeek === 0 ? 'Sunday' : 'Saturday',
      };
    }

    const holidayInfo = await this.getHolidayForDate(date, holidayZoneId);

    if (holidayInfo) {
      return {
        isEligible: false,
        isWeekend: false,
        isHoliday: true,
        holidayName: holidayInfo.name,
        reason: `Holiday: ${holidayInfo.name}`,
      };
    }

    return {
      isEligible: true,
      isWeekend: false,
      isHoliday: false,
    };
  }

  async getHolidayForDate(date: Date, holidayZoneId: string): Promise<HolidayInfo | null> {
    const dateStr = format(date, 'yyyy-MM-dd');

    const dbHoliday = await this.holidayRepo.findOne({
      where: {
        holidayZoneId,
        date: new Date(dateStr),
        isActive: true,
      },
    });

    if (dbHoliday) {
      return {
        date: dateStr,
        name: dbHoliday.name,
        type: dbHoliday.holidayType,
      };
    }

    const recurringHoliday = await this.holidayRepo.findOne({
      where: {
        holidayZoneId,
        isRecurring: true,
        recurringMonth: getMonth(date) + 1,
        recurringDay: getDate(date),
        isActive: true,
      },
    });

    if (recurringHoliday) {
      return {
        date: dateStr,
        name: recurringHoliday.name,
        type: recurringHoliday.holidayType,
      };
    }

    const zone = await this.holidayZoneRepo.findOne({
      where: { id: holidayZoneId, isActive: true },
    });

    if (zone) {
      const calculator = this.getHolidayCalculator(zone.countryCode, zone.regionCode);
      if (calculator) {
        const holidays = calculator.isHoliday(date);
        if (holidays && holidays.length > 0) {
          return {
            date: dateStr,
            name: holidays[0].name,
            type: holidays[0].type,
          };
        }
      }
    }

    return null;
  }

  async getHolidaysForRange(
    holidayZoneId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<HolidayInfo[]> {
    const zone = await this.holidayZoneRepo.findOne({
      where: { id: holidayZoneId, isActive: true },
    });

    if (!zone) {
      throw new HolidaysError(
        'HOLIDAY_ZONE_NOT_FOUND',
        `Holiday zone ${holidayZoneId} not found`,
        { holidayZoneId },
      );
    }

    const result: HolidayInfo[] = [];

    const dbHolidays = await this.holidayRepo.find({
      where: {
        holidayZoneId,
        date: Between(startDate, endDate),
        isActive: true,
      },
      order: { date: 'ASC' },
    });

    for (const holiday of dbHolidays) {
      result.push({
        date: format(holiday.date, 'yyyy-MM-dd'),
        name: holiday.name,
        type: holiday.holidayType,
      });
    }

    const calculator = this.getHolidayCalculator(zone.countryCode, zone.regionCode);
    if (calculator) {
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();

      for (let year = startYear; year <= endYear; year++) {
        const yearHolidays = calculator.getHolidays(year);
        for (const h of yearHolidays) {
          const holidayDate = new Date(h.date);
          if (holidayDate >= startDate && holidayDate <= endDate) {
            const dateStr = format(holidayDate, 'yyyy-MM-dd');
            if (!result.find((r) => r.date === dateStr)) {
              result.push({
                date: dateStr,
                name: h.name,
                type: h.type,
              });
            }
          }
        }
      }
    }

    result.sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }

  async getHolidaysForYear(holidayZoneId: string, year: number): Promise<HolidayInfo[]> {
    return this.getHolidaysForRange(
      holidayZoneId,
      startOfYear(new Date(year, 0, 1)),
      endOfYear(new Date(year, 11, 31)),
    );
  }

  async createHoliday(
    holidayZoneId: string,
    date: Date,
    name: string,
    holidayType: string,
    isRecurring: boolean = false,
  ): Promise<HolidayEntity> {
    const zone = await this.holidayZoneRepo.findOne({
      where: { id: holidayZoneId, isActive: true },
    });

    if (!zone) {
      throw new HolidaysError(
        'HOLIDAY_ZONE_NOT_FOUND',
        `Holiday zone ${holidayZoneId} not found`,
        { holidayZoneId },
      );
    }

    const holiday = this.holidayRepo.create({
      holidayZoneId,
      date,
      name,
      holidayType: holidayType as any,
      isRecurring,
      recurringMonth: isRecurring ? getMonth(date) + 1 : undefined,
      recurringDay: isRecurring ? getDate(date) : undefined,
      isActive: true,
    });

    return this.holidayRepo.save(holiday);
  }

  async createHolidayZone(
    organisationId: string,
    code: string,
    name: string,
    countryCode: string,
    regionCode?: string,
  ): Promise<HolidayZoneEntity> {
    const zone = this.holidayZoneRepo.create({
      organisationId,
      code,
      name,
      countryCode,
      regionCode,
      isActive: true,
    });

    return this.holidayZoneRepo.save(zone);
  }

  async getHolidayZonesByOrganisation(organisationId: string): Promise<HolidayZoneEntity[]> {
    return this.holidayZoneRepo.find({
      where: { organisationId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  private getHolidayCalculator(countryCode: string, regionCode?: string): Holidays | null {
    const cacheKey = regionCode ? `${countryCode}-${regionCode}` : countryCode;

    if (!this.holidayCalculators.has(cacheKey)) {
      try {
        const hd = new Holidays();
        if (regionCode) {
          hd.init(countryCode, regionCode);
        } else {
          hd.init(countryCode);
        }
        this.holidayCalculators.set(cacheKey, hd);
      } catch (error) {
        this.logger.warn(`Failed to initialize holiday calculator for ${cacheKey}: ${error}`);
        return null;
      }
    }

    return this.holidayCalculators.get(cacheKey) ?? null;
  }
}
