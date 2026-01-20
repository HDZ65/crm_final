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
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { addDays, subDays, format } from 'date-fns';
import { PlannedDebitEntity } from './entities/planned-debit.entity.js';
import { ConfigurationResolverService } from '../configuration/configuration-resolver.service.js';
import { HolidaysService } from '../holidays/holidays.service.js';
import { DebitDateMode, DebitBatch, DateShiftStrategy } from '../configuration/entities/system-debit-configuration.entity.js';
export class CalendarError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'CalendarError';
    }
}
let CalendarEngineService = class CalendarEngineService {
    plannedDebitRepository;
    configResolver;
    holidaysService;
    batchRanges = {
        [DebitBatch.L1]: [1, 7],
        [DebitBatch.L2]: [8, 14],
        [DebitBatch.L3]: [15, 21],
        [DebitBatch.L4]: [22, 31],
    };
    constructor(plannedDebitRepository, configResolver, holidaysService) {
        this.plannedDebitRepository = plannedDebitRepository;
        this.configResolver = configResolver;
        this.holidaysService = holidaysService;
    }
    async calculatePlannedDate(input) {
        const trace = [];
        let stepOrder = 1;
        const config = await this.configResolver.resolve({
            organisationId: input.organisationId,
            contratId: input.contratId,
            clientId: input.clientId,
            societeId: input.societeId,
        });
        if (input.includeResolutionTrace) {
            trace.push({
                stepOrder: stepOrder++,
                description: `Configuration resolved at level ${config.appliedLevel}`,
                inputDate: '',
                outputDate: '',
                appliedRule: `${config.appliedLevel}: ${config.appliedConfigId}`,
            });
        }
        const targetDate = this.calculateTargetDate(input.targetYear, input.targetMonth, config);
        const targetDateStr = format(targetDate, 'yyyy-MM-dd');
        if (input.includeResolutionTrace) {
            trace.push({
                stepOrder: stepOrder++,
                description: `Target date calculated for mode ${config.mode}`,
                inputDate: `${input.targetYear}-${String(input.targetMonth).padStart(2, '0')}`,
                outputDate: targetDateStr,
                appliedRule: config.mode === DebitDateMode.BATCH ? `Batch ${config.batch}` : `Fixed day ${config.fixedDay}`,
            });
        }
        const eligibility = await this.holidaysService.checkEligibility(targetDate, config.holidayZoneId);
        let finalDate = targetDate;
        let wasShifted = false;
        let shiftReason = '';
        if (!eligibility.isEligible) {
            finalDate = await this.applyShiftStrategy(targetDate, config.shiftStrategy, config.holidayZoneId);
            wasShifted = true;
            shiftReason = eligibility.isWeekend ? 'weekend' : `holiday:${eligibility.holidayName}`;
            if (input.includeResolutionTrace) {
                trace.push({
                    stepOrder: stepOrder++,
                    description: `Date shifted due to ${shiftReason}`,
                    inputDate: targetDateStr,
                    outputDate: format(finalDate, 'yyyy-MM-dd'),
                    appliedRule: `Strategy: ${config.shiftStrategy}`,
                });
            }
        }
        return {
            plannedDebitDate: format(finalDate, 'yyyy-MM-dd'),
            originalTargetDate: targetDateStr,
            wasShifted,
            shiftReason,
            resolvedConfig: config,
            resolutionTrace: input.includeResolutionTrace ? trace : undefined,
        };
    }
    calculateTargetDate(year, month, config) {
        if (config.mode === DebitDateMode.BATCH) {
            if (!config.batch) {
                throw new CalendarError('BATCH_REQUIRED', 'batch is required when mode is BATCH', { mode: config.mode });
            }
            const [startDay] = this.batchRanges[config.batch];
            return new Date(year, month - 1, startDay);
        }
        if (config.mode === DebitDateMode.FIXED_DAY) {
            if (!config.fixedDay || config.fixedDay < 1 || config.fixedDay > 28) {
                throw new CalendarError('FIXED_DAY_OUT_OF_RANGE', 'fixed_day must be between 1 and 28', { fixedDay: config.fixedDay });
            }
            return new Date(year, month - 1, config.fixedDay);
        }
        throw new CalendarError('INVALID_MODE', 'mode must be BATCH or FIXED_DAY', { mode: config.mode });
    }
    async applyShiftStrategy(date, strategy, holidayZoneId) {
        switch (strategy) {
            case DateShiftStrategy.NEXT_BUSINESS_DAY:
                return this.findNextEligibleDate(date, holidayZoneId);
            case DateShiftStrategy.PREVIOUS_BUSINESS_DAY:
                return this.findPreviousEligibleDate(date, holidayZoneId);
            case DateShiftStrategy.NEXT_WEEK_SAME_DAY: {
                let shifted = addDays(date, 7);
                const eligibility = await this.holidaysService.checkEligibility(shifted, holidayZoneId);
                if (!eligibility.isEligible) {
                    shifted = await this.findNextEligibleDate(shifted, holidayZoneId);
                }
                return shifted;
            }
            default:
                throw new CalendarError('INVALID_SHIFT_STRATEGY', `Unknown shift strategy: ${strategy}`, { strategy });
        }
    }
    async findNextEligibleDate(date, holidayZoneId) {
        let current = addDays(date, 1);
        let iterations = 0;
        const maxIterations = 30;
        while (iterations < maxIterations) {
            const eligibility = await this.holidaysService.checkEligibility(current, holidayZoneId);
            if (eligibility.isEligible) {
                return current;
            }
            current = addDays(current, 1);
            iterations++;
        }
        throw new CalendarError('NO_ELIGIBLE_DATE_FOUND', 'Could not find eligible date within 30 days', {
            startDate: format(date, 'yyyy-MM-dd'),
            holidayZoneId,
        });
    }
    async findPreviousEligibleDate(date, holidayZoneId) {
        let current = subDays(date, 1);
        let iterations = 0;
        const maxIterations = 30;
        while (iterations < maxIterations) {
            const eligibility = await this.holidaysService.checkEligibility(current, holidayZoneId);
            if (eligibility.isEligible) {
                return current;
            }
            current = subDays(current, 1);
            iterations++;
        }
        throw new CalendarError('NO_ELIGIBLE_DATE_FOUND', 'Could not find eligible date within 30 days back', {
            startDate: format(date, 'yyyy-MM-dd'),
            holidayZoneId,
        });
    }
    async calculateBatch(inputs, organisationId, targetMonth, targetYear) {
        const results = [];
        let successCount = 0;
        let errorCount = 0;
        for (const input of inputs) {
            try {
                const result = await this.calculatePlannedDate({
                    organisationId,
                    contratId: input.contratId,
                    clientId: input.clientId,
                    societeId: input.societeId,
                    targetMonth,
                    targetYear,
                });
                results.push({
                    contratId: input.contratId,
                    success: true,
                    plannedDebitDate: result.plannedDebitDate,
                    resolvedConfig: result.resolvedConfig,
                });
                successCount++;
            }
            catch (error) {
                const calendarError = error instanceof CalendarError ? error : null;
                results.push({
                    contratId: input.contratId,
                    success: false,
                    errorCode: calendarError?.code ?? 'UNKNOWN_ERROR',
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                });
                errorCount++;
            }
        }
        return {
            results,
            totalCount: inputs.length,
            successCount,
            errorCount,
        };
    }
};
CalendarEngineService = __decorate([
    Injectable(),
    __param(0, InjectRepository(PlannedDebitEntity)),
    __metadata("design:paramtypes", [Repository,
        ConfigurationResolverService,
        HolidaysService])
], CalendarEngineService);
export { CalendarEngineService };
//# sourceMappingURL=calendar-engine.service.js.map