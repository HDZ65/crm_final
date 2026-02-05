import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { v4 as uuidv4 } from 'uuid';
import { NatsService } from '@crm/nats-utils';
import { PaymentReceivedEvent } from '@crm/proto/events/payment';
import { SchedulesService } from './schedules.service';
import { RetryClientService } from '../retry/retry-client.service';
import { PaymentProvider, ScheduleFrequency, ScheduleEntity } from './entities/schedule.entity';
import { PaymentIntentStatus, PaymentIntentEntity } from './entities/payment-intent.entity';
import type {
  CreateScheduleRequest,
  ScheduleResponse,
  GetByIdRequest,
  UpdateScheduleRequest,
  DeleteResponse,
  GetDueSchedulesRequest,
  ScheduleListResponse,
  CreatePaymentIntentRequest,
  PaymentIntentResponse,
  UpdatePaymentIntentRequest,
} from '@crm/proto/payments';

const mapPspNameToProvider = (pspName: string): PaymentProvider => {
  const map: Record<string, PaymentProvider> = {
    STRIPE: PaymentProvider.STRIPE,
    PAYPAL: PaymentProvider.PAYPAL,
    GOCARDLESS: PaymentProvider.GOCARDLESS,
    SLIMPAY: PaymentProvider.SLIMPAY,
    MULTISAFEPAY: PaymentProvider.MULTISAFEPAY,
    EMERCHANTPAY: PaymentProvider.EMERCHANTPAY,
  };
  return map[pspName?.toUpperCase()] || PaymentProvider.STRIPE;
};

const mapStatusStringToEnum = (s: string): PaymentIntentStatus => {
  const map: Record<string, PaymentIntentStatus> = {
    PENDING: PaymentIntentStatus.PENDING,
    PROCESSING: PaymentIntentStatus.PROCESSING,
    SUCCEEDED: PaymentIntentStatus.SUCCEEDED,
    FAILED: PaymentIntentStatus.FAILED,
    CANCELLED: PaymentIntentStatus.CANCELLED,
    REFUNDED: PaymentIntentStatus.REFUNDED,
  };
  return map[s?.toUpperCase()] || PaymentIntentStatus.PENDING;
};

const mapScheduleToResponse = (schedule: ScheduleEntity): ScheduleResponse => ({
  id: schedule.id,
  organisation_id: schedule.organisationId ?? '',
  societe_id: schedule.societeId,
  contrat_id: schedule.contratId,
  facture_id: schedule.factureId,
  client_id: schedule.clientId,
  amount: Math.round(schedule.amount * 100),
  currency: schedule.currency,
  due_date: schedule.plannedDebitDate?.toISOString()
    || schedule.nextPaymentDate?.toISOString()
    || schedule.startDate?.toISOString()
    || '',
  status: schedule.status.toUpperCase(),
  last_attempt_at: schedule.lastPaymentDate?.toISOString(),
  retry_count: schedule.retryCount ?? 0,
});

const mapPaymentIntentToResponse = (intent: PaymentIntentEntity): PaymentIntentResponse => ({
  id: intent.id,
  organisation_id: intent.metadata?.organisationId ?? '',
  societe_id: intent.societeId,
  schedule_id: intent.scheduleId,
  psp_name: intent.provider?.toUpperCase() || 'STRIPE',
  psp_payment_id: intent.providerPaymentId,
  amount: Math.round(intent.amount * 100),
  currency: intent.currency,
  status: intent.status.toUpperCase(),
  error_message: intent.failureReason,
  created_at: intent.createdAt?.toISOString() || '',
  updated_at: intent.updatedAt?.toISOString() || '',
});

const PAYMENT_RECEIVED_SUBJECT = 'crm.events.payment.received';

@Controller()
export class SchedulesController {
  private readonly logger = new Logger(SchedulesController.name);

  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly retryClient: RetryClientService,
    private readonly natsService: NatsService,
  ) {}

  @GrpcMethod('PaymentService', 'CreateSchedule')
  async createSchedule(data: CreateScheduleRequest): Promise<ScheduleResponse> {
    try {
      this.logger.log(`CreateSchedule for societe: ${data.societe_id}`);

      const schedule = await this.schedulesService.createSchedule({
        organisationId: data.organisation_id,
        clientId: data.client_id ?? '',
        societeId: data.societe_id,
        contratId: data.contrat_id,
        factureId: data.facture_id,
        provider: PaymentProvider.STRIPE,
        providerAccountId: '',
        amount: data.amount / 100,
        currency: data.currency || 'EUR',
        frequency: ScheduleFrequency.MONTHLY,
        startDate: new Date(data.due_date),
        metadata: data.metadata,
      });

      return mapScheduleToResponse(schedule);
    } catch (e: unknown) {
      this.logger.error('CreateSchedule failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('PaymentService', 'GetSchedule')
  async getSchedule(data: GetByIdRequest): Promise<ScheduleResponse> {
    try {
      this.logger.log(`GetSchedule: ${data.id}`);

      const schedule = await this.schedulesService.getScheduleById(data.id);

      if (!schedule) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `Schedule ${data.id} not found`,
        });
      }

      return mapScheduleToResponse(schedule);
    } catch (e: unknown) {
      if (e instanceof RpcException) throw e;
      this.logger.error('GetSchedule failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('PaymentService', 'UpdateSchedule')
  async updateSchedule(data: UpdateScheduleRequest): Promise<ScheduleResponse> {
    try {
      this.logger.log(`UpdateSchedule: ${data.id}`);

      const schedule = await this.schedulesService.getScheduleById(data.id);

      if (!schedule) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `Schedule ${data.id} not found`,
        });
      }

      if (data.status === 'PAUSED') {
        return mapScheduleToResponse(await this.schedulesService.pauseSchedule(data.id));
      }

      if (data.status === 'ACTIVE') {
        return mapScheduleToResponse(await this.schedulesService.resumeSchedule(data.id));
      }

      if (data.status === 'CANCELLED') {
        return mapScheduleToResponse(await this.schedulesService.cancelSchedule(data.id));
      }

      return mapScheduleToResponse(schedule);
    } catch (e: unknown) {
      if (e instanceof RpcException) throw e;
      this.logger.error('UpdateSchedule failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('PaymentService', 'DeleteSchedule')
  async deleteSchedule(data: GetByIdRequest): Promise<DeleteResponse> {
    try {
      this.logger.log(`DeleteSchedule: ${data.id}`);

      await this.schedulesService.cancelSchedule(data.id);

      return {
        success: true,
        message: 'Schedule cancelled successfully',
      };
    } catch (e: unknown) {
      this.logger.error('DeleteSchedule failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('PaymentService', 'GetDueSchedules')
  async getDueSchedules(data: GetDueSchedulesRequest): Promise<ScheduleListResponse> {
    try {
      this.logger.log(`GetDueSchedules for org: ${data.organisation_id}`);

      const schedules = await this.schedulesService.getDueSchedules(
        data.organisation_id,
        data.before_date,
      );

      return {
        schedules: schedules.map((s) => mapScheduleToResponse(s)),
        total: schedules.length,
      };
    } catch (e: unknown) {
      this.logger.error('GetDueSchedules failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('PaymentService', 'CreatePaymentIntent')
  async createPaymentIntent(data: CreatePaymentIntentRequest): Promise<PaymentIntentResponse> {
    try {
      this.logger.log(`CreatePaymentIntent for societe: ${data.societe_id}`);

      const provider = mapPspNameToProvider(data.psp_name);

      const intent = await this.schedulesService.createPaymentIntent({
        scheduleId: data.schedule_id,
        clientId: '',
        societeId: data.societe_id,
        provider,
        amount: data.amount / 100,
        currency: data.currency || 'EUR',
        metadata: data.metadata,
      });

      return mapPaymentIntentToResponse(intent);
    } catch (e: unknown) {
      this.logger.error('CreatePaymentIntent failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('PaymentService', 'GetPaymentIntent')
  async getPaymentIntent(data: GetByIdRequest): Promise<PaymentIntentResponse> {
    try {
      this.logger.log(`GetPaymentIntent: ${data.id}`);

      const intent = await this.schedulesService.getPaymentIntentById(data.id);

      if (!intent) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `Payment intent ${data.id} not found`,
        });
      }

      return mapPaymentIntentToResponse(intent);
    } catch (e: unknown) {
      if (e instanceof RpcException) throw e;
      this.logger.error('GetPaymentIntent failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('PaymentService', 'UpdatePaymentIntent')
  async updatePaymentIntent(data: UpdatePaymentIntentRequest): Promise<PaymentIntentResponse> {
    try {
      this.logger.log(`UpdatePaymentIntent: ${data.id}`);

      const intentStatus = mapStatusStringToEnum(data.status ?? '');

      const intent = await this.schedulesService.updatePaymentIntentStatus(
        data.id,
        intentStatus,
        data.psp_payment_id,
        data.error_message,
      );

      if (intentStatus === PaymentIntentStatus.SUCCEEDED) {
        await this.handlePaymentSuccess(intent);
      } else if (intentStatus === PaymentIntentStatus.FAILED) {
        await this.handlePaymentRejection(intent, data);
      }

      return mapPaymentIntentToResponse(intent);
    } catch (e: unknown) {
      this.logger.error('UpdatePaymentIntent failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  private async handlePaymentSuccess(intent: PaymentIntentEntity): Promise<void> {
    try {
      const event: PaymentReceivedEvent = {
        event_id: uuidv4(),
        timestamp: Date.now(),
        correlation_id: '',
        payment_id: intent.id,
        schedule_id: intent.scheduleId ?? '',
        client_id: intent.clientId ?? '',
        montant: intent.amount,
        date_reception: { seconds: Math.floor(Date.now() / 1000), nanos: 0 },
      };

      await this.natsService.publishProto(PAYMENT_RECEIVED_SUBJECT, event, PaymentReceivedEvent);
      this.logger.log(`Published PaymentReceivedEvent: ${event.event_id} for payment ${intent.id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to publish PaymentReceivedEvent for payment ${intent.id}: ${errorMessage}`);
    }
  }

  private async handlePaymentRejection(
    intent: PaymentIntentEntity,
    data: UpdatePaymentIntentRequest,
  ): Promise<void> {
    const organisationId = intent.metadata?.organisationId;
    if (!organisationId) return;

    const scheduleId = intent.scheduleId ?? '';
    const clientId = intent.clientId ?? '';
    if (!scheduleId || !clientId) return;

    try {
      await this.retryClient.handlePaymentRejected({
        event_id: intent.id,
        organisation_id: organisationId,
        societe_id: intent.societeId,
        payment_id: intent.id,
        schedule_id: scheduleId,
        client_id: clientId,
        reason_code: data.error_code ?? 'PAYMENT_FAILED',
        reason_message: data.error_message ?? intent.failureReason ?? 'Payment failed',
        amount_cents: Math.round(intent.amount * 100),
        currency: intent.currency,
        psp_name: intent.provider?.toUpperCase() || 'STRIPE',
        psp_payment_id: intent.providerPaymentId ?? undefined,
        rejected_at: { seconds: Math.floor(Date.now() / 1000), nanos: 0 },
        event_timestamp: { seconds: Math.floor(Date.now() / 1000), nanos: 0 },
        idempotency_key: `${intent.id}:manual_failed`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to enqueue retry schedule for payment ${intent.id}: ${errorMessage}`,
      );
    }
  }
}
