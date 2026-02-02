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
  organisationId: schedule.organisationId ?? '',
  societeId: schedule.societeId,
  contratId: schedule.contratId,
  factureId: schedule.factureId,
  clientId: schedule.clientId,
  amount: Math.round(schedule.amount * 100),
  currency: schedule.currency,
  dueDate: schedule.plannedDebitDate?.toISOString()
    || schedule.nextPaymentDate?.toISOString()
    || schedule.startDate?.toISOString()
    || '',
  status: schedule.status.toUpperCase(),
  lastAttemptAt: schedule.lastPaymentDate?.toISOString(),
  retryCount: schedule.retryCount ?? 0,
});

const mapPaymentIntentToResponse = (intent: PaymentIntentEntity): PaymentIntentResponse => ({
  id: intent.id,
  organisationId: intent.metadata?.organisationId ?? '',
  societeId: intent.societeId,
  scheduleId: intent.scheduleId,
  pspName: intent.provider?.toUpperCase() || 'STRIPE',
  pspPaymentId: intent.providerPaymentId,
  amount: Math.round(intent.amount * 100),
  currency: intent.currency,
  status: intent.status.toUpperCase(),
  errorMessage: intent.failureReason,
  createdAt: intent.createdAt?.toISOString() || '',
  updatedAt: intent.updatedAt?.toISOString() || '',
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
      this.logger.log(`CreateSchedule for societe: ${data.societeId}`);

      const schedule = await this.schedulesService.createSchedule({
        organisationId: data.organisationId,
        clientId: data.clientId ?? '',
        societeId: data.societeId,
        contratId: data.contratId,
        factureId: data.factureId,
        provider: PaymentProvider.STRIPE,
        providerAccountId: '',
        amount: data.amount / 100,
        currency: data.currency || 'EUR',
        frequency: ScheduleFrequency.MONTHLY,
        startDate: new Date(data.dueDate),
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
      this.logger.log(`GetDueSchedules for org: ${data.organisationId}`);

      const schedules = await this.schedulesService.getDueSchedules(
        data.organisationId,
        data.beforeDate,
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
      this.logger.log(`CreatePaymentIntent for societe: ${data.societeId}`);

      const provider = mapPspNameToProvider(data.pspName);

      const intent = await this.schedulesService.createPaymentIntent({
        scheduleId: data.scheduleId,
        clientId: '',
        societeId: data.societeId,
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
        data.pspPaymentId,
        data.errorMessage,
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
        eventId: uuidv4(),
        timestamp: Date.now(),
        correlationId: '',
        paymentId: intent.id,
        scheduleId: intent.scheduleId ?? '',
        clientId: intent.clientId ?? '',
        montant: intent.amount,
        dateReception: { seconds: Math.floor(Date.now() / 1000), nanos: 0 },
      };

      await this.natsService.publishProto(PAYMENT_RECEIVED_SUBJECT, event, PaymentReceivedEvent);
      this.logger.log(`Published PaymentReceivedEvent: ${event.eventId} for payment ${intent.id}`);
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
        eventId: intent.id,
        organisationId,
        societeId: intent.societeId,
        paymentId: intent.id,
        scheduleId,
        clientId,
        reasonCode: data.errorCode ?? 'PAYMENT_FAILED',
        reasonMessage: data.errorMessage ?? intent.failureReason ?? 'Payment failed',
        amountCents: Math.round(intent.amount * 100),
        currency: intent.currency,
        pspName: intent.provider?.toUpperCase() || 'STRIPE',
        pspPaymentId: intent.providerPaymentId ?? undefined,
        rejectedAt: { seconds: Math.floor(Date.now() / 1000), nanos: 0 },
        eventTimestamp: { seconds: Math.floor(Date.now() / 1000), nanos: 0 },
        idempotencyKey: `${intent.id}:manual_failed`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to enqueue retry schedule for payment ${intent.id}: ${errorMessage}`,
      );
    }
  }
}
