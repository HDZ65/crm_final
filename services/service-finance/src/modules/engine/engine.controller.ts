import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { format, parseISO, addDays, subDays } from 'date-fns';

import { CalendarEngineService } from './calendar-engine.service';
import { HolidaysService } from '../holidays/holidays.service';

@Controller()
export class EngineController {
  constructor(
    private readonly engine: CalendarEngineService,
    private readonly holidaysService: HolidaysService,
  ) {}

  @GrpcMethod('CalendarEngineService', 'CalculatePlannedDate')
  async calculatePlannedDate(req: {
    organisationId: string;
    contratId?: string;
    clientId?: string;
    societeId?: string;
    referenceDate?: string;
    targetMonth: number;
    targetYear: number;
    includeResolutionTrace?: boolean;
  }) {
    try {
      const result = await this.engine.calculatePlannedDate({
        organisationId: req.organisationId,
        contratId: req.contratId,
        clientId: req.clientId,
        societeId: req.societeId,
        referenceDate: req.referenceDate,
        targetMonth: req.targetMonth,
        targetYear: req.targetYear,
        includeResolutionTrace: req.includeResolutionTrace,
      });
      return result;
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CalendarEngineService', 'CalculatePlannedDatesBatch')
  async calculatePlannedDatesBatch(req: {
    organisationId: string;
    inputs: Array<{
      contratId: string;
      clientId: string;
      societeId: string;
      amountCents: number;
      currency: string;
    }>;
    targetMonth: number;
    targetYear: number;
  }) {
    try {
      const result = await this.engine.calculateBatch(
        req.inputs,
        req.organisationId,
        req.targetMonth,
        req.targetYear,
      );
      return result;
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CalendarEngineService', 'CheckDateEligibility')
  async checkDateEligibility(req: {
    organisationId: string;
    date: string;
    holidayZoneId: string;
  }) {
    try {
      const date = parseISO(req.date);
      const eligibility = await this.holidaysService.checkEligibility(date, req.holidayZoneId);

      let nextEligibleDate = '';
      let previousEligibleDate = '';

      if (!eligibility.isEligible) {
        let nextDate = addDays(date, 1);
        for (let i = 0; i < 30; i++) {
          const nextCheck = await this.holidaysService.checkEligibility(nextDate, req.holidayZoneId);
          if (nextCheck.isEligible) {
            nextEligibleDate = format(nextDate, 'yyyy-MM-dd');
            break;
          }
          nextDate = addDays(nextDate, 1);
        }

        let prevDate = subDays(date, 1);
        for (let i = 0; i < 30; i++) {
          const prevCheck = await this.holidaysService.checkEligibility(prevDate, req.holidayZoneId);
          if (prevCheck.isEligible) {
            previousEligibleDate = format(prevDate, 'yyyy-MM-dd');
            break;
          }
          prevDate = subDays(prevDate, 1);
        }
      }

      return {
        isEligible: eligibility.isEligible,
        isWeekend: eligibility.isWeekend,
        isHoliday: eligibility.isHoliday,
        holidayName: eligibility.holidayName ?? '',
        nextEligibleDate,
        previousEligibleDate,
      };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}
