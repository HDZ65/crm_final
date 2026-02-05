import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ConfigurationService } from '../../../../infrastructure/persistence/typeorm/repositories/calendar/configuration.service';
import { DebitDateMode, DebitBatch, DateShiftStrategy } from '../../../../domain/calendar/entities';

@Controller()
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @GrpcMethod('CalendarConfigurationService', 'GetSystemConfig')
  async getSystemConfig(data: { organisation_id: string }) {
    return this.configurationService.getSystemConfig(data.organisation_id);
  }

  @GrpcMethod('CalendarConfigurationService', 'UpdateSystemConfig')
  async updateSystemConfig(data: {
    organisation_id: string;
    default_mode: string;
    default_batch?: string;
    default_fixed_day?: number;
    shift_strategy: string;
    holiday_zone_id?: string;
    cutoff_config_id?: string;
  }) {
    return this.configurationService.updateSystemConfig(data.organisation_id, {
      defaultMode: data.default_mode as DebitDateMode,
      defaultBatch: data.default_batch as DebitBatch | undefined,
      defaultFixedDay: data.default_fixed_day,
      shiftStrategy: data.shift_strategy as DateShiftStrategy,
      holidayZoneId: data.holiday_zone_id,
      cutoffConfigId: data.cutoff_config_id,
    });
  }
}
