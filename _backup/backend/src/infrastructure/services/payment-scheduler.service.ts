import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScheduleEntity as ScheduleOrm } from '../db/entities/schedule.entity';
import { PaymentIntentEntity as PaymentIntentOrm } from '../db/entities/payment-intent.entity';
import { PaymentEventEntity as PaymentEventOrm } from '../db/entities/payment-event.entity';
import { ContratEntity as ContratOrm } from '../db/entities/contrat.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In } from 'typeorm';
import { ScheduleStatus, PaymentIntentStatus, PaymentEventType, PSPName } from '../../core/domain/payment.enums';
import { StripeService } from './stripe/stripe.service';
import { GoCardlessService } from './gocardless.service';
import { v4 as uuidv4 } from 'uuid';

// Code du statut "Expiré" pour les contrats
const STATUT_CONTRAT_EXPIRE_CODE = 'EXPIRE';

export interface PaymentResult {
  success: boolean;
  pspPaymentId?: string;
  errorCode?: string;
  errorMessage?: string;
}

@Injectable()
export class PaymentSchedulerService {
  private readonly logger = new Logger(PaymentSchedulerService.name);
  private isProcessing = false;

  constructor(
    @InjectRepository(ScheduleOrm)
    private readonly scheduleRepository: Repository<ScheduleOrm>,
    @InjectRepository(PaymentIntentOrm)
    private readonly paymentIntentRepository: Repository<PaymentIntentOrm>,
    @InjectRepository(PaymentEventOrm)
    private readonly paymentEventRepository: Repository<PaymentEventOrm>,
    @InjectRepository(ContratOrm)
    private readonly contratRepository: Repository<ContratOrm>,
    private readonly stripeService: StripeService,
    private readonly goCardlessService: GoCardlessService,
  ) {}

  /**
   * CRON job that runs every hour to process due payments
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processDuePayments(): Promise<void> {
    if (this.isProcessing) {
      this.logger.warn('Payment processing already in progress, skipping...');
      return;
    }

    this.isProcessing = true;
    this.logger.log('Starting scheduled payment processing...');

    try {
      // Find all schedules that are due
      const dueSchedules = await this.findDueSchedules();
      this.logger.log(`Found ${dueSchedules.length} due schedule(s) to process`);

      for (const schedule of dueSchedules) {
        await this.processSchedule(schedule);
      }

      // Also retry failed payments
      const failedSchedules = await this.findRetryableSchedules();
      this.logger.log(`Found ${failedSchedules.length} failed schedule(s) to retry`);

      for (const schedule of failedSchedules) {
        await this.processSchedule(schedule);
      }

      this.logger.log('Scheduled payment processing completed');
    } catch (error) {
      this.logger.error('Error during payment processing', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Find all schedules that are due for payment
   */
  private async findDueSchedules(): Promise<ScheduleOrm[]> {
    const now = new Date();
    return this.scheduleRepository.find({
      where: [
        {
          status: ScheduleStatus.PLANNED,
          dueDate: LessThanOrEqual(now),
        },
        {
          status: ScheduleStatus.PLANNED,
          nextDueDate: LessThanOrEqual(now),
        },
      ],
    });
  }

  /**
   * Find schedules that failed but can be retried
   */
  private async findRetryableSchedules(): Promise<ScheduleOrm[]> {
    return this.scheduleRepository
      .createQueryBuilder('schedule')
      .where('schedule.status = :status', { status: ScheduleStatus.FAILED })
      .andWhere('schedule.retryCount < schedule.maxRetries')
      .getMany();
  }

  /**
   * Process a single schedule: create PaymentIntent and call PSP
   */
  async processSchedule(schedule: ScheduleOrm): Promise<void> {
    this.logger.log(`Processing schedule ${schedule.id} for ${schedule.pspName}`);

    // Check if contract has expired (needs explicit renewal)
    if (schedule.contractEndDate && new Date() > schedule.contractEndDate) {
      this.logger.warn(`Schedule ${schedule.id} contract has expired, marking as EXPIRED`);
      await this.scheduleRepository.update(schedule.id, {
        status: ScheduleStatus.EXPIRED,
      });

      // Also update the associated Contrat status to "Expiré"
      if (schedule.contratId) {
        await this.contratRepository.update(schedule.contratId, {
          statut: STATUT_CONTRAT_EXPIRE_CODE,
        });
        this.logger.log(`Contrat ${schedule.contratId} marked as EXPIRED`);
      }
      return;
    }

    // Update status to processing
    await this.scheduleRepository.update(schedule.id, {
      status: ScheduleStatus.PROCESSING,
    });

    // Create PaymentIntent
    const paymentIntent = await this.createPaymentIntent(schedule);

    // Record payment initiated event
    await this.createPaymentEvent(
      paymentIntent.id,
      schedule.organisationId,
      PaymentEventType.PAYMENT_INITIATED,
      { scheduleId: schedule.id },
    );

    // Call the appropriate PSP
    const result = await this.callPSP(schedule, paymentIntent);

    if (result.success) {
      await this.handlePaymentSuccess(schedule, paymentIntent, result);
    } else {
      await this.handlePaymentFailure(schedule, paymentIntent, result);
    }
  }

  /**
   * Create a PaymentIntent record
   */
  private async createPaymentIntent(schedule: ScheduleOrm): Promise<PaymentIntentOrm> {
    const paymentIntent = this.paymentIntentRepository.create({
      organisationId: schedule.organisationId,
      scheduleId: schedule.id,
      societeId: schedule.societeId,
      pspName: schedule.pspName,
      amount: schedule.amount,
      currency: schedule.currency,
      status: PaymentIntentStatus.PENDING,
      idempotencyKey: uuidv4(),
      mandateReference: schedule.pspMandateId,
      metadata: {
        clientId: schedule.clientId,
        produitId: schedule.produitId,
      },
    });

    return this.paymentIntentRepository.save(paymentIntent);
  }

  /**
   * Call the appropriate PSP based on pspName
   */
  private async callPSP(schedule: ScheduleOrm, paymentIntent: PaymentIntentOrm): Promise<PaymentResult> {
    try {
      switch (schedule.pspName) {
        case PSPName.STRIPE:
          return await this.processStripePayment(schedule, paymentIntent);

        case PSPName.GOCARDLESS:
          return await this.processGoCardlessPayment(schedule, paymentIntent);

        // Add other PSPs here as needed
        case PSPName.SLIMPAY:
        case PSPName.MULTISAFEPAY:
        case PSPName.EMERCHANTPAY:
          this.logger.warn(`PSP ${schedule.pspName} not yet implemented`);
          return {
            success: false,
            errorCode: 'PSP_NOT_IMPLEMENTED',
            errorMessage: `PSP ${schedule.pspName} is not yet implemented`,
          };

        default:
          return {
            success: false,
            errorCode: 'UNKNOWN_PSP',
            errorMessage: `Unknown PSP: ${schedule.pspName}`,
          };
      }
    } catch (error) {
      this.logger.error(`PSP call failed for ${schedule.pspName}`, error);
      return {
        success: false,
        errorCode: 'PSP_ERROR',
        errorMessage: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Process payment via Stripe
   */
  private async processStripePayment(
    schedule: ScheduleOrm,
    paymentIntent: PaymentIntentOrm,
  ): Promise<PaymentResult> {
    if (!schedule.pspCustomerId) {
      return {
        success: false,
        errorCode: 'NO_CUSTOMER',
        errorMessage: 'No Stripe customer ID configured for this schedule',
      };
    }

    try {
      // Create a PaymentIntent in Stripe
      const stripeIntent = await this.stripeService.createPaymentIntent({
        amount: Math.round(Number(schedule.amount) * 100), // Convert to cents
        currency: schedule.currency.toLowerCase(),
        customerId: schedule.pspCustomerId,
        metadata: {
          scheduleId: schedule.id,
          paymentIntentId: paymentIntent.id,
        },
        description: `Scheduled payment for schedule ${schedule.id}`,
      });

      // For recurring payments with saved payment method, confirm immediately
      // This requires the customer to have a default payment method
      if (stripeIntent.status === 'requires_payment_method') {
        return {
          success: false,
          errorCode: 'REQUIRES_PAYMENT_METHOD',
          errorMessage: 'Customer has no default payment method',
        };
      }

      return {
        success: stripeIntent.status === 'succeeded' || stripeIntent.status === 'processing',
        pspPaymentId: stripeIntent.id,
      };
    } catch (error) {
      return {
        success: false,
        errorCode: error.code || 'STRIPE_ERROR',
        errorMessage: error.message,
      };
    }
  }

  /**
   * Process payment via GoCardless (SEPA Direct Debit)
   */
  private async processGoCardlessPayment(
    schedule: ScheduleOrm,
    paymentIntent: PaymentIntentOrm,
  ): Promise<PaymentResult> {
    if (!schedule.pspMandateId) {
      return {
        success: false,
        errorCode: 'NO_MANDATE',
        errorMessage: 'No GoCardless mandate ID configured for this schedule',
      };
    }

    try {
      const payment = await this.goCardlessService.createPayment(
        schedule.pspMandateId,
        Math.round(Number(schedule.amount) * 100), // Convert to cents
        schedule.currency,
        {
          reference: `SCHEDULE-${schedule.id.substring(0, 8)}`,
          metadata: {
            scheduleId: schedule.id,
            paymentIntentId: paymentIntent.id,
          },
        },
      );

      // GoCardless statuses: pending_submission, submitted, pending_customer_approval, confirmed, paid_out
      const successStatuses = ['pending_submission', 'submitted', 'pending_customer_approval', 'confirmed'];
      return {
        success: successStatuses.includes(payment.status),
        pspPaymentId: payment.id,
      };
    } catch (error) {
      return {
        success: false,
        errorCode: error.code || 'GOCARDLESS_ERROR',
        errorMessage: error.message,
      };
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(
    schedule: ScheduleOrm,
    paymentIntent: PaymentIntentOrm,
    result: PaymentResult,
  ): Promise<void> {
    this.logger.log(`Payment succeeded for schedule ${schedule.id}`);

    // Update PaymentIntent
    await this.paymentIntentRepository.update(paymentIntent.id, {
      status: PaymentIntentStatus.SUCCEEDED,
      pspPaymentId: result.pspPaymentId,
    });

    // Record success event
    await this.createPaymentEvent(
      paymentIntent.id,
      schedule.organisationId,
      PaymentEventType.PAYMENT_CONFIRMED,
      { pspPaymentId: result.pspPaymentId },
    );

    // Update schedule
    if (schedule.isRecurring) {
      // Calculate next due date
      const nextDueDate = this.calculateNextDueDate(schedule);
      await this.scheduleRepository.update(schedule.id, {
        status: ScheduleStatus.PLANNED,
        nextDueDate,
        retryCount: 0,
        lastFailureAt: null,
        lastFailureReason: null,
      });
      this.logger.log(`Recurring schedule ${schedule.id} next due: ${nextDueDate}`);
    } else {
      // One-time payment - mark as paid
      await this.scheduleRepository.update(schedule.id, {
        status: ScheduleStatus.PAID,
      });
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailure(
    schedule: ScheduleOrm,
    paymentIntent: PaymentIntentOrm,
    result: PaymentResult,
  ): Promise<void> {
    this.logger.error(`Payment failed for schedule ${schedule.id}: ${result.errorMessage}`);

    // Update PaymentIntent
    await this.paymentIntentRepository.update(paymentIntent.id, {
      status: PaymentIntentStatus.FAILED,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
    });

    // Record failure event
    await this.createPaymentEvent(
      paymentIntent.id,
      schedule.organisationId,
      PaymentEventType.PAYMENT_FAILED,
      { errorCode: result.errorCode, errorMessage: result.errorMessage },
    );

    // Update schedule
    const newRetryCount = (schedule.retryCount || 0) + 1;
    const maxRetries = schedule.maxRetries || 3;

    if (newRetryCount >= maxRetries) {
      // Max retries reached - mark as unpaid
      await this.scheduleRepository.update(schedule.id, {
        status: ScheduleStatus.UNPAID,
        retryCount: newRetryCount,
        lastFailureAt: new Date(),
        lastFailureReason: result.errorMessage,
      });
      this.logger.warn(`Schedule ${schedule.id} marked as UNPAID after ${maxRetries} retries`);
    } else {
      // Still has retries left
      await this.scheduleRepository.update(schedule.id, {
        status: ScheduleStatus.FAILED,
        retryCount: newRetryCount,
        lastFailureAt: new Date(),
        lastFailureReason: result.errorMessage,
      });
    }
  }

  /**
   * Calculate next due date based on interval
   */
  private calculateNextDueDate(schedule: ScheduleOrm): Date {
    const baseDate = schedule.nextDueDate ?? schedule.dueDate;
    const next = new Date(baseDate);
    const count = schedule.intervalCount ?? 1;

    switch (schedule.intervalUnit) {
      case 'day':
        next.setDate(next.getDate() + count);
        break;
      case 'week':
        next.setDate(next.getDate() + count * 7);
        break;
      case 'month':
        next.setMonth(next.getMonth() + count);
        break;
      case 'year':
        next.setFullYear(next.getFullYear() + count);
        break;
      default:
        next.setMonth(next.getMonth() + 1); // Default to monthly
    }

    return next;
  }

  /**
   * Create a PaymentEvent record
   */
  private async createPaymentEvent(
    paymentIntentId: string,
    organisationId: string,
    eventType: PaymentEventType,
    rawPayload: Record<string, any>,
  ): Promise<void> {
    const event = this.paymentEventRepository.create({
      paymentIntentId,
      organisationId,
      eventType,
      rawPayload,
      receivedAt: new Date(),
      processed: false,
    });
    await this.paymentEventRepository.save(event);
  }

  /**
   * Manually trigger payment processing (for testing or manual runs)
   */
  async triggerPaymentProcessing(): Promise<{ processed: number; failed: number }> {
    const dueSchedules = await this.findDueSchedules();
    let processed = 0;
    let failed = 0;

    for (const schedule of dueSchedules) {
      try {
        await this.processSchedule(schedule);
        processed++;
      } catch {
        failed++;
      }
    }

    return { processed, failed };
  }
}
