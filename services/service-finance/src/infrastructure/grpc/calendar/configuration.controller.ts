import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ConfigurationService } from '../../persistence/typeorm/repositories/calendar/configuration.service';
import { DebitDateMode, DebitBatch, DateShiftStrategy } from '../../../domain/calendar/entities';
import {
  DateShiftStrategy as ProtoDateShiftStrategy,
  DebitBatch as ProtoDebitBatch,
  DebitDateMode as ProtoDebitDateMode,
  GetSystemConfigRequest,
  UpdateSystemConfigRequest,
} from '@proto/calendar';

@Controller()
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @GrpcMethod('CalendarConfigurationService', 'GetSystemConfig')
  async getSystemConfig(data: GetSystemConfigRequest) {
    return this.configurationService.getSystemConfig(data.organisation_id);
  }

  @GrpcMethod('CalendarConfigurationService', 'UpdateSystemConfig')
  async updateSystemConfig(data: UpdateSystemConfigRequest) {
    return this.configurationService.updateSystemConfig(data.organisation_id, {
      defaultMode: this.toDomainDebitDateMode(data.default_mode),
      defaultBatch: this.toDomainDebitBatch(data.default_batch),
      defaultFixedDay: data.default_fixed_day,
      shiftStrategy: this.toDomainDateShiftStrategy(data.shift_strategy),
      holidayZoneId: data.holiday_zone_id || undefined,
      cutoffConfigId: data.cutoff_config_id || undefined,
    });
  }

  private toDomainDebitDateMode(mode: ProtoDebitDateMode): DebitDateMode {
    switch (mode) {
      case ProtoDebitDateMode.DEBIT_DATE_MODE_FIXED_DAY:
        return DebitDateMode.FIXED_DAY;
      case ProtoDebitDateMode.DEBIT_DATE_MODE_BATCH:
      default:
        return DebitDateMode.BATCH;
    }
  }

  private toDomainDebitBatch(batch: ProtoDebitBatch): DebitBatch | undefined {
    switch (batch) {
      case ProtoDebitBatch.DEBIT_BATCH_L1:
        return DebitBatch.L1;
      case ProtoDebitBatch.DEBIT_BATCH_L2:
        return DebitBatch.L2;
      case ProtoDebitBatch.DEBIT_BATCH_L3:
        return DebitBatch.L3;
      case ProtoDebitBatch.DEBIT_BATCH_L4:
        return DebitBatch.L4;
      default:
        return undefined;
    }
  }

  private toDomainDateShiftStrategy(strategy: ProtoDateShiftStrategy): DateShiftStrategy {
    switch (strategy) {
      case ProtoDateShiftStrategy.DATE_SHIFT_STRATEGY_PREVIOUS_BUSINESS_DAY:
        return DateShiftStrategy.PREVIOUS_BUSINESS_DAY;
      case ProtoDateShiftStrategy.DATE_SHIFT_STRATEGY_NEXT_WEEK_SAME_DAY:
        return DateShiftStrategy.NEXT_WEEK_SAME_DAY;
      case ProtoDateShiftStrategy.DATE_SHIFT_STRATEGY_NEXT_BUSINESS_DAY:
      default:
        return DateShiftStrategy.NEXT_BUSINESS_DAY;
    }
  }
}
