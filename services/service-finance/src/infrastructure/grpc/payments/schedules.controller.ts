import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SchedulesService } from '../../persistence/typeorm/repositories/payments/schedules.service';
import { ScheduleFrequency, PaymentProvider } from '../../../domain/payments/entities';
import { CreateScheduleRequest, GetByIdRequest } from '@proto/payment';

@Controller()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @GrpcMethod('ScheduleService', 'Create')
  async createSchedule(data: CreateScheduleRequest) {
    return this.schedulesService.createSchedule({
      organisationId: data.organisation_id,
      clientId: data.client_id ?? '',
      societeId: data.societe_id,
      contratId: data.contrat_id,
      factureId: data.facture_id,
      provider: this.toPaymentProvider(data.metadata?.provider),
      providerAccountId: data.metadata?.provider_account_id ?? '',
      amount: data.amount,
      currency: data.currency,
      frequency: this.toScheduleFrequency(data.metadata?.frequency),
      startDate: new Date(data.due_date),
      metadata: {
        ...data.metadata,
        description: data.description,
        auto_process: String(data.auto_process),
      },
    });
  }

  @GrpcMethod('ScheduleService', 'Get')
  async getSchedule(data: GetByIdRequest) {
    return this.schedulesService.getScheduleById(data.id);
  }

  @GrpcMethod('ScheduleService', 'Pause')
  async pauseSchedule(data: GetByIdRequest) {
    return this.schedulesService.pauseSchedule(data.id);
  }

  @GrpcMethod('ScheduleService', 'Resume')
  async resumeSchedule(data: GetByIdRequest) {
    return this.schedulesService.resumeSchedule(data.id);
  }

  @GrpcMethod('ScheduleService', 'Cancel')
  async cancelSchedule(data: GetByIdRequest) {
    return this.schedulesService.cancelSchedule(data.id);
  }

  private toPaymentProvider(provider?: string): PaymentProvider {
    switch ((provider ?? '').toLowerCase()) {
      case PaymentProvider.PAYPAL:
        return PaymentProvider.PAYPAL;
      case PaymentProvider.GOCARDLESS:
        return PaymentProvider.GOCARDLESS;
      case PaymentProvider.SLIMPAY:
        return PaymentProvider.SLIMPAY;
      case PaymentProvider.MULTISAFEPAY:
        return PaymentProvider.MULTISAFEPAY;
      case PaymentProvider.EMERCHANTPAY:
        return PaymentProvider.EMERCHANTPAY;
      default:
        return PaymentProvider.STRIPE;
    }
  }

  private toScheduleFrequency(frequency?: string): ScheduleFrequency {
    switch ((frequency ?? '').toLowerCase()) {
      case ScheduleFrequency.WEEKLY:
        return ScheduleFrequency.WEEKLY;
      case ScheduleFrequency.QUARTERLY:
        return ScheduleFrequency.QUARTERLY;
      case ScheduleFrequency.YEARLY:
        return ScheduleFrequency.YEARLY;
      default:
        return ScheduleFrequency.MONTHLY;
    }
  }
}
