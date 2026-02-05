import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import {
  ScheduleEntity,
  ScheduleStatus,
  ScheduleFrequency,
  PaymentProvider,
  PaymentIntentEntity,
  PaymentIntentStatus,
  PaymentEventEntity,
  PaymentEventType,
} from '../../../../../domain/payments/entities';

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
  ) {}

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

  async getSchedulesByClientId(societeId: string, clientId: string): Promise<ScheduleEntity[]> {
    return this.scheduleRepository.find({
      where: { societeId, clientId },
      order: { createdAt: 'DESC' },
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
}
