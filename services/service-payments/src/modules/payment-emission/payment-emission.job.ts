import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { NatsService } from '@crm/nats-utils';
import { PaymentRejectedEvent } from '@crm/proto/events/payment';
import { PaymentIntentEntity, PaymentIntentStatus } from '../schedules/entities/payment-intent.entity';

const PAYMENT_REJECTED_SUBJECT = 'crm.events.payment.rejected';
const AM04_REJECTION_CODE = 'AM04';

// SEPA rejection code mapping (ISO 20022)
const SEPA_REJECTION_CODES = [
  AM04_REJECTION_CODE,
  'AC04', // Closed account
  'AC06', // Blocked account
  'AG01', // Transaction forbidden
  'AG02', // Invalid bank operation code
  'MD01', // No mandate
  'MD06', // Refund request by end customer (mandate cancelled)
  'MS02', // Not specified reason - customer
  'MS03', // Not specified reason - agent
];

@Injectable()
export class PaymentEmissionJob {
  private readonly logger = new Logger(PaymentEmissionJob.name);
  private isProcessing = false;

  constructor(
    @InjectRepository(PaymentIntentEntity)
    private readonly paymentIntentRepository: Repository<PaymentIntentEntity>,
    private readonly natsService: NatsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processRejectedPayments(): Promise<void> {
    if (this.isProcessing) {
      this.logger.debug('Already processing rejected payments, skipping...');
      return;
    }

    this.isProcessing = true;
    try {
      await this.scanAndPublishRejections();
    } finally {
      this.isProcessing = false;
    }
  }

  private async scanAndPublishRejections(): Promise<void> {
    const failedPayments = await this.paymentIntentRepository.find({
      where: { status: PaymentIntentStatus.FAILED },
      take: 100,
    });

    let publishedCount = 0;

    for (const payment of failedPayments) {
      if (this.isAM04Rejection(payment)) {
        const published = await this.publishPaymentRejectedEvent(payment);
        if (published) {
          publishedCount++;
        }
      }
    }

    if (publishedCount > 0) {
      this.logger.log(`Published ${publishedCount} payment.rejected events`);
    }
  }

  private isAM04Rejection(payment: PaymentIntentEntity): boolean {
    const failureReason = payment.failureReason?.toUpperCase() || '';
    const errorCode = String(payment.metadata?.errorCode || '').toUpperCase();

    const matchesSEPACode = SEPA_REJECTION_CODES.some(
      (code) => failureReason.includes(code) || errorCode === code,
    );

    if (matchesSEPACode) {
      return true;
    }

    return (
      failureReason.includes('INSUFFICIENT_FUNDS') ||
      failureReason.includes('ACCOUNT_CLOSED') ||
      failureReason.includes('NO_ACCOUNT')
    );
  }

  async publishPaymentRejectedEvent(payment: PaymentIntentEntity): Promise<boolean> {
    const alreadyPublished = payment.metadata?.rejectionEventPublished === true;
    if (alreadyPublished) {
      return false;
    }

    const scheduleId = payment.scheduleId ?? '';
    const clientId = payment.clientId ?? '';

    if (!scheduleId || !clientId) {
      this.logger.warn(`Payment ${payment.id} missing scheduleId or clientId, skipping rejection event`);
      return false;
    }

    const eventId = uuidv4();
    const event: PaymentRejectedEvent = {
      eventId,
      timestamp: Date.now(),
      correlationId: payment.id,
      paymentId: payment.id,
      scheduleId,
      clientId,
      motifRejet: this.extractRejectionCode(payment),
      dateRejet: { seconds: Math.floor(Date.now() / 1000), nanos: 0 },
    };

    try {
      await this.natsService.publishProto(PAYMENT_REJECTED_SUBJECT, event, PaymentRejectedEvent);

      const updatedMetadata = {
        ...payment.metadata,
        rejectionEventPublished: true,
        rejectionEventId: eventId,
        rejectionEventTimestamp: new Date().toISOString(),
      };
      payment.metadata = updatedMetadata;
      await this.paymentIntentRepository.save(payment);

      this.logger.log(
        `Published PaymentRejectedEvent: ${eventId} for payment ${payment.id} (motif: ${event.motifRejet})`,
      );
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to publish PaymentRejectedEvent for payment ${payment.id}: ${errorMessage}`);
      return false;
    }
  }

  private extractRejectionCode(payment: PaymentIntentEntity): string {
    const errorCode = payment.metadata?.errorCode;
    if (errorCode) {
      return String(errorCode);
    }

    const failureReason = payment.failureReason || '';

    const codePattern = SEPA_REJECTION_CODES.join('|');
    const codeMatch = failureReason.match(new RegExp(`\\b(${codePattern})\\b`, 'i'));
    if (codeMatch) {
      return codeMatch[1].toUpperCase();
    }

    if (failureReason.toLowerCase().includes('insufficient')) {
      return AM04_REJECTION_CODE;
    }

    return 'REJECTED';
  }
}
