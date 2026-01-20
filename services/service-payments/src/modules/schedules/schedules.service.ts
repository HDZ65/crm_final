import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import {
  ScheduleEntity,
  ScheduleStatus,
  ScheduleFrequency,
  PaymentProvider,
} from './entities/schedule.entity.js';
import {
  PaymentIntentEntity,
  PaymentIntentStatus,
} from './entities/payment-intent.entity.js';
import {
  PaymentEventEntity,
  PaymentEventType,
} from './entities/payment-event.entity.js';
import { IdempotencyService, IdempotencyKeyConflictError } from './idempotency.service.js';

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(
    @InjectRepository(ScheduleEntity)
    private readonly scheduleRepository: Repository<ScheduleEntity>,
    @InjectRepository(PaymentIntentEntity)
    private readonly paymentIntentRepository: Repository<PaymentIntentEntity>,
    @InjectRepository(PaymentEventEntity)
    private readonly paymentEventRepository: Repository<PaymentEventEntity>,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  // ==================== Schedule Methods ====================

  async createSchedule(params: {
    organisationId?: string;
    clientId: string;
    societeId: string;
    contratId?: string;
    factureId?: string;
    provider: PaymentProvider;
    providerAccountId: string;
    providerSubscriptionId?: string;
    providerCustomerId?: string;
    amount: number;
    currency?: string;
    frequency: ScheduleFrequency;
    startDate: Date;
    endDate?: Date;
    metadata?: Record<string, any>;
  }): Promise<ScheduleEntity> {
    const schedule = this.scheduleRepository.create({
      ...params,
      currency: params.currency || 'EUR',
      status: ScheduleStatus.ACTIVE,
      nextPaymentDate: params.startDate,
      plannedDebitDate: params.startDate,
      metadata: {
        ...params.metadata,
        organisationId: params.organisationId ?? params.metadata?.organisationId,
      },
    });


    const savedSchedule = await this.scheduleRepository.save(schedule);

    await this.createEvent({
      scheduleId: savedSchedule.id,
      societeId: params.societeId,
      provider: params.provider,
      eventType: PaymentEventType.SCHEDULE_CREATED,
      payload: { scheduleId: savedSchedule.id },
    });

    return savedSchedule;
  }

  async getScheduleById(id: string): Promise<ScheduleEntity | null> {
    return this.scheduleRepository.findOne({ where: { id } });
  }

  async getSchedulesByClientId(
    societeId: string,
    clientId: string,
  ): Promise<ScheduleEntity[]> {
    return this.scheduleRepository.find({
      where: { societeId, clientId },
      order: { createdAt: 'DESC' },
    });
  }

  async getActiveSchedules(societeId: string): Promise<ScheduleEntity[]> {
    return this.scheduleRepository.find({
      where: { societeId, status: ScheduleStatus.ACTIVE },
    });
  }

  async getDueSchedules(
    organisationId?: string,
    beforeDate?: string,
  ): Promise<ScheduleEntity[]> {
    const cutoffDate = beforeDate ? new Date(beforeDate) : new Date();

    const where: Record<string, any> = {
      status: ScheduleStatus.ACTIVE,
      plannedDebitDate: LessThanOrEqual(cutoffDate),
    };

    if (organisationId) {
      where.organisationId = organisationId;
    }

    return this.scheduleRepository.find({
      where,
      order: { plannedDebitDate: 'ASC' },
    });
  }


  async pauseSchedule(id: string): Promise<ScheduleEntity> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    schedule.status = ScheduleStatus.PAUSED;
    const updated = await this.scheduleRepository.save(schedule);

    await this.createEvent({
      scheduleId: id,
      societeId: schedule.societeId,
      provider: schedule.provider,
      eventType: PaymentEventType.SCHEDULE_PAUSED,
    });

    return updated;
  }

  async resumeSchedule(id: string): Promise<ScheduleEntity> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    schedule.status = ScheduleStatus.ACTIVE;
    const updated = await this.scheduleRepository.save(schedule);

    await this.createEvent({
      scheduleId: id,
      societeId: schedule.societeId,
      provider: schedule.provider,
      eventType: PaymentEventType.SCHEDULE_RESUMED,
    });

    return updated;
  }

  async cancelSchedule(id: string): Promise<ScheduleEntity> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    schedule.status = ScheduleStatus.CANCELLED;
    const updated = await this.scheduleRepository.save(schedule);

    await this.createEvent({
      scheduleId: id,
      societeId: schedule.societeId,
      provider: schedule.provider,
      eventType: PaymentEventType.SCHEDULE_CANCELLED,
    });

    return updated;
  }

  async updateNextPaymentDate(id: string): Promise<void> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) return;

    const nextDate = this.calculateNextPaymentDate(
      schedule.nextPaymentDate || new Date(),
      schedule.frequency,
    );

    // Check if we've reached the end date
    if (schedule.endDate && nextDate > schedule.endDate) {
      schedule.status = ScheduleStatus.COMPLETED;
      schedule.nextPaymentDate = undefined as unknown as Date;
    } else {
      schedule.lastPaymentDate = schedule.nextPaymentDate;
      schedule.nextPaymentDate = nextDate;
    }

    await this.scheduleRepository.save(schedule);
  }

  private calculateNextPaymentDate(
    currentDate: Date,
    frequency: ScheduleFrequency,
  ): Date {
    const next = new Date(currentDate);

    switch (frequency) {
      case ScheduleFrequency.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case ScheduleFrequency.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      case ScheduleFrequency.QUARTERLY:
        next.setMonth(next.getMonth() + 3);
        break;
      case ScheduleFrequency.YEARLY:
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next;
  }

  // ==================== Payment Intent Methods ====================

  async createPaymentIntent(params: {
    scheduleId?: string;
    clientId: string;
    societeId: string;
    factureId?: string;
    provider: PaymentProvider;
    providerPaymentId?: string;
    providerCustomerId?: string;
    amount: number;
    currency?: string;
    metadata?: Record<string, any>;
    idempotencyKey?: string;
  }): Promise<PaymentIntentEntity> {
    const idempotencyKey = params.idempotencyKey || this.idempotencyService.generateKey({
      societeId: params.societeId,
      clientId: params.clientId,
      amount: params.amount,
      currency: params.currency || 'EUR',
      scheduleId: params.scheduleId,
    });

    const existingIntent = await this.idempotencyService.findByKey(idempotencyKey);
    if (existingIntent) {
      this.logger.warn(`Idempotency key ${idempotencyKey} already exists, returning existing intent`);
      return existingIntent;
    }

    const intent = this.paymentIntentRepository.create({
      ...params,
      currency: params.currency || 'EUR',
      status: PaymentIntentStatus.PENDING,
      idempotencyKey,
    });

    const saved = await this.paymentIntentRepository.save(intent);

    await this.createEvent({
      paymentIntentId: saved.id,
      scheduleId: params.scheduleId,
      societeId: params.societeId,
      provider: params.provider,
      eventType: PaymentEventType.PAYMENT_CREATED,
      payload: { paymentIntentId: saved.id, idempotencyKey },
    });

    return saved;
  }

  async getPaymentIntentById(id: string): Promise<PaymentIntentEntity | null> {
    return this.paymentIntentRepository.findOne({ where: { id } });
  }

  async getPaymentIntentByProviderPaymentId(
    providerPaymentId: string,
  ): Promise<PaymentIntentEntity | null> {
    return this.paymentIntentRepository.findOne({
      where: { providerPaymentId },
    });
  }

  async getPaymentIntentsByClientId(
    societeId: string,
    clientId: string,
  ): Promise<PaymentIntentEntity[]> {
    return this.paymentIntentRepository.find({
      where: { societeId, clientId },
      order: { createdAt: 'DESC' },
    });
  }

  async updatePaymentIntentStatus(
    id: string,
    status: PaymentIntentStatus,
    providerPaymentId?: string,
    failureReason?: string,
  ): Promise<PaymentIntentEntity> {
    const intent = await this.paymentIntentRepository.findOne({ where: { id } });
    if (!intent) {
      throw new NotFoundException('Payment intent not found');
    }

    intent.status = status;
    if (providerPaymentId) {
      intent.providerPaymentId = providerPaymentId;
    }
    if (failureReason) {
      intent.failureReason = failureReason;
    }
    if (status === PaymentIntentStatus.SUCCEEDED) {
      intent.paidAt = new Date();
    }

    const updated = await this.paymentIntentRepository.save(intent);

    const eventType =
      status === PaymentIntentStatus.SUCCEEDED
        ? PaymentEventType.PAYMENT_SUCCEEDED
        : status === PaymentIntentStatus.FAILED
          ? PaymentEventType.PAYMENT_FAILED
          : PaymentEventType.PAYMENT_PROCESSING;

    await this.createEvent({
      paymentIntentId: id,
      scheduleId: intent.scheduleId,
      societeId: intent.societeId,
      provider: intent.provider,
      eventType,
      payload: { status, failureReason },
    });

    return updated;
  }

  async createRefund(
    paymentIntentId: string,
    amount: number,
    providerRefundId?: string,
  ): Promise<PaymentIntentEntity> {
    const intent = await this.paymentIntentRepository.findOne({
      where: { id: paymentIntentId },
    });
    if (!intent) {
      throw new NotFoundException('Payment intent not found');
    }

    if (!intent.canRefund()) {
      throw new Error('Cannot refund this payment');
    }

    const remainingRefundable = intent.getRemainingRefundableAmount();
    if (amount > remainingRefundable) {
      throw new Error(`Cannot refund more than ${remainingRefundable}`);
    }

    intent.refundedAmount = Number(intent.refundedAmount) + amount;

    if (intent.refundedAmount >= intent.amount) {
      intent.status = PaymentIntentStatus.REFUNDED;
    } else {
      intent.status = PaymentIntentStatus.PARTIALLY_REFUNDED;
    }

    const updated = await this.paymentIntentRepository.save(intent);

    await this.createEvent({
      paymentIntentId,
      societeId: intent.societeId,
      provider: intent.provider,
      eventType: PaymentEventType.REFUND_SUCCEEDED,
      payload: { amount, providerRefundId },
    });

    return updated;
  }

  // ==================== Event Methods ====================

  async createEvent(params: {
    paymentIntentId?: string;
    scheduleId?: string;
    societeId: string;
    provider?: PaymentProvider;
    eventType: PaymentEventType;
    providerEventId?: string;
    payload?: Record<string, any>;
    errorMessage?: string;
  }): Promise<PaymentEventEntity> {
    const event = this.paymentEventRepository.create({
      ...params,
      processed: true,
    });

    return this.paymentEventRepository.save(event);
  }

  async getEventsByPaymentIntentId(
    paymentIntentId: string,
  ): Promise<PaymentEventEntity[]> {
    return this.paymentEventRepository.find({
      where: { paymentIntentId },
      order: { createdAt: 'DESC' },
    });
  }

  async getEventsByScheduleId(
    scheduleId: string,
  ): Promise<PaymentEventEntity[]> {
    return this.paymentEventRepository.find({
      where: { scheduleId },
      order: { createdAt: 'DESC' },
    });
  }

  async getRecentEvents(
    societeId: string,
    limit: number = 50,
  ): Promise<PaymentEventEntity[]> {
    return this.paymentEventRepository.find({
      where: { societeId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
