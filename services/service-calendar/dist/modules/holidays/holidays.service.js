var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var HolidaysService_1;
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { getDay, format, getMonth, getDate, startOfYear, endOfYear } from 'date-fns';
import Holidays from 'date-holidays';
import { HolidayZoneEntity } from './entities/holiday-zone.entity.js';
import { HolidayEntity } from './entities/holiday.entity.js';
export class HolidaysError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'HolidaysError';
    }
}
let HolidaysService = HolidaysService_1 = class HolidaysService {
    holidayZoneRepo;
    holidayRepo;
    logger = new Logger(HolidaysService_1.name);
    holidayCalculators = new Map();
    constructor(holidayZoneRepo, holidayRepo) {
        this.holidayZoneRepo = holidayZoneRepo;
        this.holidayRepo = holidayRepo;
    }
    async onModuleInit() {
        this.logger.log('HolidaysService initialized');
    }
    async checkEligibility(date, holidayZoneId) {
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
    async getHolidayForDate(date, holidayZoneId) {
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
    async getHolidaysForRange(holidayZoneId, startDate, endDate) {
        const zone = await this.holidayZoneRepo.findOne({
            where: { id: holidayZoneId, isActive: true },
        });
        if (!zone) {
            throw new HolidaysError('HOLIDAY_ZONE_NOT_FOUND', `Holiday zone ${holidayZoneId} not found`, { holidayZoneId });
        }
        const result = [];
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
    async getHolidaysForYear(holidayZoneId, year) {
        return this.getHolidaysForRange(holidayZoneId, startOfYear(new Date(year, 0, 1)), endOfYear(new Date(year, 11, 31)));
    }
    async createHoliday(holidayZoneId, date, name, holidayType, isRecurring = false) {
        const zone = await this.holidayZoneRepo.findOne({
            where: { id: holidayZoneId, isActive: true },
        });
        if (!zone) {
            throw new HolidaysError('HOLIDAY_ZONE_NOT_FOUND', `Holiday zone ${holidayZoneId} not found`, { holidayZoneId });
        }
        const holiday = this.holidayRepo.create({
            holidayZoneId,
            date,
            name,
            holidayType: holidayType,
            isRecurring,
            recurringMonth: isRecurring ? getMonth(date) + 1 : undefined,
            recurringDay: isRecurring ? getDate(date) : undefined,
            isActive: true,
        });
        return this.holidayRepo.save(holiday);
    }
    async createHolidayZone(organisationId, code, name, countryCode, regionCode) {
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
    async getHolidayZonesByOrganisation(organisationId) {
        return this.holidayZoneRepo.find({
            where: { organisationId, isActive: true },
            order: { name: 'ASC' },
        });
    }
    getHolidayCalculator(countryCode, regionCode) {
        const cacheKey = regionCode ? `${countryCode}-${regionCode}` : countryCode;
        if (!this.holidayCalculators.has(cacheKey)) {
            try {
                const hd = new Holidays();
                if (regionCode) {
                    hd.init(countryCode, regionCode);
                }
                else {
                    hd.init(countryCode);
                }
                this.holidayCalculators.set(cacheKey, hd);
            }
            catch (error) {
                this.logger.warn(`Failed to initialize holiday calculator for ${cacheKey}: ${error}`);
                return null;
            }
        }
        return this.holidayCalculators.get(cacheKey) ?? null;
    }
};
HolidaysService = HolidaysService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(HolidayZoneEntity)),
    __param(1, InjectRepository(HolidayEntity)),
    __metadata("design:paramtypes", [Repository,
        Repository])
], HolidaysService);
export { HolidaysService };
//# sourceMappingURL=holidays.service.js.map