import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { addDays, subDays, format } from 'date-fns';

import { PlannedDebitEntity } from './entities/planned-debit.entity';
import { ConfigurationResolverService, ResolvedConfig } from '../configuration/configuration-resolver.service';
import { HolidaysService } from '../holidays/holidays.service';
import { DebitDateMode, DebitBatch, DateShiftStrategy } from '../configuration/entities/system-debit-configuration.entity';
import type {
  CalculatePlannedDateRequest,
  CalculatePlannedDateResponse,
  DateResolutionStep,
} from '@crm/proto/calendar';

export interface CalculatePlannedDateInput {
  organisationId: string;
  contratId?: string;
  clientId?: string;
  societeId?: string;
  referenceDate?: string;
  targetMonth: number;
  targetYear: number;
  includeResolutionTrace?: boolean;
}

export interface CalculatePlannedDateResult {
  plannedDebitDate: string;
  originalTargetDate: string;
  wasShifted: boolean;
  shiftReason: string;
  resolvedConfig: ResolvedConfig;
  resolutionTrace?: ResolutionStep[];
}

export interface ResolutionStep {
  stepOrder: number;
  description: string;
  inputDate: string;
  outputDate: string;
  appliedRule: string;
}

export class CalendarError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'CalendarError';
  }
}

@Injectable()
export class CalendarEngineService {
  private readonly batchRanges: Record<DebitBatch, [number, number]> = {
    [DebitBatch.L1]: [1, 7],
    [DebitBatch.L2]: [8, 14],
    [DebitBatch.L3]: [15, 21],
    [DebitBatch.L4]: [22, 31],
  };

  constructor(
    @InjectRepository(PlannedDebitEntity)
    private readonly plannedDebitRepository: Repository<PlannedDebitEntity>,
    private readonly configResolver: ConfigurationResolverService,
    private readonly holidaysService: HolidaysService,
  ) {}

  async calculatePlannedDate(input: CalculatePlannedDateInput): Promise<CalculatePlannedDateResult> {
    const trace: ResolutionStep[] = [];
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

  private calculateTargetDate(year: number, month: number, config: ResolvedConfig): Date {
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

  private async applyShiftStrategy(
    date: Date,
    strategy: DateShiftStrategy,
    holidayZoneId: string,
  ): Promise<Date> {
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

  private async findNextEligibleDate(date: Date, holidayZoneId: string): Promise<Date> {
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

  private async findPreviousEligibleDate(date: Date, holidayZoneId: string): Promise<Date> {
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

  async calculateBatch(
    inputs: Array<{
      contratId: string;
      clientId: string;
      societeId: string;
      amountCents: number;
      currency: string;
    }>,
    organisationId: string,
    targetMonth: number,
    targetYear: number,
  ): Promise<{
    results: Array<{
      contratId: string;
      success: boolean;
      plannedDebitDate?: string;
      errorCode?: string;
      errorMessage?: string;
      resolvedConfig?: ResolvedConfig;
    }>;
    totalCount: number;
    successCount: number;
    errorCount: number;
  }> {
    const results: Array<{
      contratId: string;
      success: boolean;
      plannedDebitDate?: string;
      errorCode?: string;
      errorMessage?: string;
      resolvedConfig?: ResolvedConfig;
    }> = [];

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
      } catch (error) {
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
}
