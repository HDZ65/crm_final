import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SchedulesService } from '../../../../infrastructure/persistence/typeorm/repositories/payments/schedules.service';
import { ScheduleFrequency, PaymentProvider } from '../../../../domain/payments/entities';

@Controller()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @GrpcMethod('ScheduleService', 'Create')
  async createSchedule(data: {
    organisation_id?: string;
    client_id: string;
    societe_id: string;
    contrat_id?: string;
    provider: string;
    provider_account_id: string;
    amount: number;
    currency?: string;
    frequency: string;
    start_date: string;
    end_date?: string;
  }) {
    return this.schedulesService.createSchedule({
      organisationId: data.organisation_id,
      clientId: data.client_id,
      societeId: data.societe_id,
      contratId: data.contrat_id,
      provider: data.provider as PaymentProvider,
      providerAccountId: data.provider_account_id,
      amount: data.amount,
      currency: data.currency,
      frequency: (data.frequency || 'monthly') as ScheduleFrequency,
      startDate: new Date(data.start_date),
      endDate: data.end_date ? new Date(data.end_date) : undefined,
    });
  }

  @GrpcMethod('ScheduleService', 'Get')
  async getSchedule(data: { id: string }) {
    return this.schedulesService.getScheduleById(data.id);
  }

  @GrpcMethod('ScheduleService', 'Pause')
  async pauseSchedule(data: { id: string }) {
    return this.schedulesService.pauseSchedule(data.id);
  }

  @GrpcMethod('ScheduleService', 'Resume')
  async resumeSchedule(data: { id: string }) {
    return this.schedulesService.resumeSchedule(data.id);
  }

  @GrpcMethod('ScheduleService', 'Cancel')
  async cancelSchedule(data: { id: string }) {
    return this.schedulesService.cancelSchedule(data.id);
  }
}
