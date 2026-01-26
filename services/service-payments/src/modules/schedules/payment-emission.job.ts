import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In } from 'typeorm';
import { ScheduleEntity, ScheduleStatus, PaymentProvider } from './entities/schedule.entity';
import { PaymentIntentEntity, PaymentIntentStatus } from './entities/payment-intent.entity';
import { PaymentEventEntity, PaymentEventType } from './entities/payment-event.entity';
import { GoCardlessService } from '../gocardless/gocardless.service.js';
import { StripeService } from '../stripe/stripe.service.js';
import { CalendarClientService } from '../calendar/calendar-client.service.js';
import { RetryClientService } from '../retry/retry-client.service.js';

interface EmissionResult {
  scheduleId: string;
  paymentIntentId: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
  providerPaymentId?: string;
}

interface EmissionSummary {
  executedAt: Date;
  cutoffTime: string;
  totalSchedules: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  results: EmissionResult[];
}

@Injectable()
export class PaymentEmissionJob {
  private readonly logger = new Logger(PaymentEmissionJob.name);
  private isRunning = false;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(ScheduleEntity)
    private readonly scheduleRepository: Repository<ScheduleEntity>,
    @InjectRepository(PaymentIntentEntity)
    private readonly paymentIntentRepository: Repository<PaymentIntentEntity>,
    @InjectRepository(PaymentEventEntity)
    private readonly paymentEventRepository: Repository<PaymentEventEntity>,
    private readonly goCardlessService: GoCardlessService,
    private readonly stripeService: StripeService,
    private readonly calendarClient: CalendarClientService,
    private readonly retryClient: RetryClientService,
  ) {}

  private getCutoffHour(): number {
    return this.configService.get<number>('PAYMENT_EMISSION_CUTOFF_HOUR', 6);
  }

  private getCutoffMinute(): number {
    return this.configService.get<number>('PAYMENT_EMISSION_CUTOFF_MINUTE', 0);
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async handleDailyEmission(): Promise<void> {
    await this.executeEmission('automatic');
  }

  async executeEmission(trigger: 'automatic' | 'manual'): Promise<EmissionSummary> {
    if (this.isRunning) {
      this.logger.warn('Emission already running, skipping');
      return this.createEmptySummary(1);
    }

    this.isRunning = true;
    const startTime = new Date();
    this.logger.log(`Starting ${trigger} payment emission at ${startTime.toISOString()}`);

    const results: EmissionResult[] = [];

    try {
      const dueSchedules = await this.getDueSchedules();
      this.logger.log(`Found ${dueSchedules.length} due schedules`);

      for (const schedule of dueSchedules) {
        const result = await this.processSchedule(schedule);
        results.push(result);
      }
    } finally {
      this.isRunning = false;
    }

    const summary = this.createSummary(startTime, results);

    this.logger.log(
      `Emission completed: ${summary.succeeded} succeeded, ${summary.failed} failed, ${summary.skipped} skipped`,
    );

    return summary;
  }

  private createEmptySummary(skipped: number): EmissionSummary {
    return {
      executedAt: new Date(),
      cutoffTime: `${this.getCutoffHour()}:${this.getCutoffMinute().toString().padStart(2, '0')}`,
      totalSchedules: 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped,
      results: [],
    };
  }

  private createSummary(startTime: Date, results: EmissionResult[]): EmissionSummary {
    return {
      executedAt: startTime,
      cutoffTime: `${this.getCutoffHour()}:${this.getCutoffMinute().toString().padStart(2, '0')}`,
      totalSchedules: results.length,
      processed: results.filter((r) => r.status !== 'skipped').length,
      succeeded: results.filter((r) => r.status === 'success').length,
      failed: results.filter((r) => r.status === 'failed').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      results,
    };
  }

  private async getDueSchedules(): Promise<ScheduleEntity[]> {
    const today = new Date();
    this.logger.debug(`Selecting due schedules up to ${today.toISOString()}`);

    const candidates = await this.scheduleRepository.find({
      where: {
        status: ScheduleStatus.ACTIVE,
        plannedDebitDate: LessThanOrEqual(today),
      },
      order: { plannedDebitDate: 'ASC' },
    });

    const toUpdate = candidates.filter((schedule) => !schedule.plannedDebitDate && schedule.nextPaymentDate);
    if (toUpdate.length === 0) {
      return candidates;
    }

    this.logger.debug(`Backfilling plannedDebitDate for ${toUpdate.length} schedules`);

    const updates = await Promise.all(
      toUpdate.map(async (schedule) => {
        const planned = await this.calculateNextPlannedDate(schedule);
        schedule.plannedDebitDate = planned;
        schedule.nextPaymentDate = planned;
        return schedule;
      }),
    );

    await this.scheduleRepository.save(updates);

    return this.scheduleRepository.find({
      where: {
        status: ScheduleStatus.ACTIVE,
        plannedDebitDate: LessThanOrEqual(today),
      },
      order: { plannedDebitDate: 'ASC' },
    });
  }

  private async processSchedule(schedule: ScheduleEntity): Promise<EmissionResult> {
    const existingPendingIntent = await this.findExistingPendingIntent(schedule);
    if (existingPendingIntent) {
      return {
        scheduleId: schedule.id,
        paymentIntentId: existingPendingIntent.id,
        status: 'skipped',
        error: 'Pending payment intent already exists (idempotency)',
      };
    }

    const paymentIntent = await this.createPaymentIntent(schedule);

    try {
      const providerResult = await this.submitToProvider(schedule, paymentIntent);

      paymentIntent.providerPaymentId = providerResult.paymentId;
      paymentIntent.status = PaymentIntentStatus.PROCESSING;
      await this.paymentIntentRepository.save(paymentIntent);

      await this.createEvent(paymentIntent, PaymentEventType.PAYMENT_PROCESSING, {
        providerPaymentId: providerResult.paymentId,
      });

      await this.updateScheduleNextPaymentDate(schedule);

      return {
        scheduleId: schedule.id,
        paymentIntentId: paymentIntent.id,
        status: 'success',
        providerPaymentId: providerResult.paymentId,
      };
    } catch (error: any) {
      paymentIntent.status = PaymentIntentStatus.FAILED;
      paymentIntent.failureReason = error.message;
      await this.paymentIntentRepository.save(paymentIntent);

      await this.createEvent(paymentIntent, PaymentEventType.PAYMENT_FAILED, {
        error: error.message,
      });

      const organisationId = schedule.organisationId || schedule.metadata?.organisationId;
      if (organisationId) {
        try {
          await this.retryClient.handlePaymentRejected({
            eventId: paymentIntent.id,
            organisationId,
            societeId: schedule.societeId,
            paymentId: paymentIntent.id,
            scheduleId: schedule.id,
            factureId: schedule.factureId ?? undefined,
            contratId: schedule.contratId ?? undefined,
            clientId: schedule.clientId,
            reasonCode: 'EMISSION_FAILED',
            reasonMessage: error.message,
            amountCents: Math.round(paymentIntent.amount * 100),
            currency: paymentIntent.currency,
            pspName: schedule.provider.toUpperCase(),
            pspPaymentId: paymentIntent.providerPaymentId ?? undefined,
            rejectedAt: { seconds: Math.floor(Date.now() / 1000), nanos: 0 },
            idempotencyKey: `${paymentIntent.id}:emission_failed`,
          });
        } catch (retryError: any) {
          this.logger.error(
            `Failed to enqueue retry schedule for payment ${paymentIntent.id}: ${retryError?.message ?? retryError}`,
          );
        }
      }

      return {
        scheduleId: schedule.id,
        paymentIntentId: paymentIntent.id,
        status: 'failed',
        error: error.message,
      };
    }
  }

  private async findExistingPendingIntent(
    schedule: ScheduleEntity,
  ): Promise<PaymentIntentEntity | null> {
    return this.paymentIntentRepository.findOne({
      where: {
        scheduleId: schedule.id,
        status: In([PaymentIntentStatus.PENDING, PaymentIntentStatus.PROCESSING]),
      },
    });
  }

  private async createPaymentIntent(schedule: ScheduleEntity): Promise<PaymentIntentEntity> {
    const intent = this.paymentIntentRepository.create({
      scheduleId: schedule.id,
      clientId: schedule.clientId,
      societeId: schedule.societeId,
      provider: schedule.provider,
      amount: schedule.amount,
      currency: schedule.currency,
      status: PaymentIntentStatus.PENDING,
      metadata: {
        scheduleFrequency: schedule.frequency,
        emissionDate: new Date().toISOString(),
      },
    });

    const saved = await this.paymentIntentRepository.save(intent);

    await this.createEvent(saved, PaymentEventType.PAYMENT_CREATED, {
      scheduleId: schedule.id,
      amount: schedule.amount,
    });

    return saved;
  }

  private async submitToProvider(
    schedule: ScheduleEntity,
    paymentIntent: PaymentIntentEntity,
  ): Promise<{ paymentId: string; status: string }> {
    switch (schedule.provider) {
      case PaymentProvider.GOCARDLESS:
        return this.submitToGoCardless(schedule, paymentIntent);
      case PaymentProvider.STRIPE:
        return this.submitToStripe(schedule, paymentIntent);
      case PaymentProvider.SLIMPAY:
      case PaymentProvider.MULTISAFEPAY:
      case PaymentProvider.EMERCHANTPAY:
      case PaymentProvider.PAYPAL:
      default:
        throw new Error(`Unsupported provider: ${schedule.provider}`);
    }
  }

  private async submitToGoCardless(
    schedule: ScheduleEntity,
    paymentIntent: PaymentIntentEntity,
  ): Promise<{ paymentId: string; status: string }> {
    const mandate = await this.goCardlessService.getActiveMandate(
      schedule.societeId,
      schedule.clientId,
    );

    if (!mandate) {
      throw new Error('No active GoCardless mandate found');
    }

    const result = await this.goCardlessService.createPayment(schedule.societeId, {
      mandateId: mandate.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      description: `Payment for schedule ${schedule.id}`,
      metadata: {
        paymentIntentId: paymentIntent.id,
        scheduleId: schedule.id,
      },
    });

    return { paymentId: result.paymentId, status: result.status };
  }

  private async submitToStripe(
    schedule: ScheduleEntity,
    paymentIntent: PaymentIntentEntity,
  ): Promise<{ paymentId: string; status: string }> {
    if (!schedule.providerCustomerId) {
      throw new Error('No Stripe customer ID on schedule');
    }

    const result = await this.stripeService.createPaymentIntent(schedule.societeId, {
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      customerId: schedule.providerCustomerId,
      metadata: {
        paymentIntentId: paymentIntent.id,
        scheduleId: schedule.id,
      },
      confirm: true,
    });

    return { paymentId: result.id, status: result.status };
  }

  private async updateScheduleNextPaymentDate(schedule: ScheduleEntity): Promise<void> {
    const nextDate = await this.calculateNextPlannedDate(schedule);
    this.logger.debug(`Next planned date for schedule ${schedule.id}: ${nextDate.toISOString()}`);

    if (schedule.endDate && nextDate > schedule.endDate) {
      schedule.status = ScheduleStatus.COMPLETED;
      schedule.plannedDebitDate = undefined as unknown as Date;
      schedule.nextPaymentDate = undefined as unknown as Date;
    } else {
      schedule.lastPaymentDate = schedule.plannedDebitDate || schedule.nextPaymentDate;
      schedule.plannedDebitDate = nextDate;
      schedule.nextPaymentDate = nextDate;
    }

    await this.scheduleRepository.save(schedule);
  }

  private async calculateNextPlannedDate(schedule: ScheduleEntity): Promise<Date> {
    const current = schedule.plannedDebitDate || schedule.nextPaymentDate || new Date();
    const next = new Date(current);

    switch (schedule.frequency) {
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    const organisationId = schedule.organisationId || schedule.metadata?.organisationId;
    if (!organisationId) {
      return next;
    }

    try {
      const response = await this.calendarClient.calculatePlannedDate({
        organisationId,
        contratId: schedule.contratId ?? '',
        clientId: schedule.clientId ?? '',
        societeId: schedule.societeId ?? '',
        referenceDate: current.toISOString().slice(0, 10),
        targetMonth: next.getMonth() + 1,
        targetYear: next.getFullYear(),
        includeResolutionTrace: false,
      });

      return new Date(response.plannedDebitDate);
    } catch (error: any) {
      this.logger.error(`Calendar calculation failed for schedule ${schedule.id}: ${error?.message ?? error}`);
      return next;
    }
  }

  private async createEvent(
    paymentIntent: PaymentIntentEntity,
    eventType: PaymentEventType,
    payload: Record<string, any>,
  ): Promise<void> {
    const event = this.paymentEventRepository.create({
      paymentIntentId: paymentIntent.id,
      scheduleId: paymentIntent.scheduleId,
      societeId: paymentIntent.societeId,
      provider: paymentIntent.provider,
      eventType,
      payload,
      processed: true,
    });

    await this.paymentEventRepository.save(event);
  }
}
