import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import {
  PaymentIntentEntity,
  PaymentIntentStatus,
  CustomerInteractionEntity,
  PortalPaymentSessionEntity,
  PortalSessionStatus,
} from '../../../../../domain/payments/entities';
import { PaymentArchiveEntity } from '../../../../../domain/payments/entities/payment-archive.entity';

export interface ArchiveResult {
  archivedCount: number;
  errors: string[];
}

export interface ArchivePolicy {
  paymentRetentionDays: number;
  interactionRetentionDays: number;
  portalSessionRetentionDays: number;
}

const DEFAULT_ARCHIVE_POLICY: ArchivePolicy = {
  paymentRetentionDays: 30,
  interactionRetentionDays: 90,
  portalSessionRetentionDays: 7,
};

/** Final statuses eligible for archival (CDC Section 3.4) */
const ARCHIVABLE_STATUSES: PaymentIntentStatus[] = [
  PaymentIntentStatus.SUCCEEDED,   // PAID
  PaymentIntentStatus.REFUNDED,    // REFUNDED
  PaymentIntentStatus.CANCELLED,   // CANCELLED
  PaymentIntentStatus.FAILED,      // REJECT_OTHER
];

/**
 * ArchiveSchedulerService — Automatic archival of finalized payments,
 * customer interactions, and expired portal sessions.
 *
 * CDC Annexe F.3: Daily execution at 03:00
 * - Payments with final status older than J+30 → payment_archives
 * - Customer interactions older than J+90 → deleted
 * - Expired portal sessions older than J+7 → deleted
 */
@Injectable()
export class ArchiveSchedulerService {
  private readonly logger = new Logger(ArchiveSchedulerService.name);

  constructor(
    @InjectRepository(PaymentIntentEntity)
    private readonly paymentIntentRepository: Repository<PaymentIntentEntity>,
    @InjectRepository(PaymentArchiveEntity)
    private readonly paymentArchiveRepository: Repository<PaymentArchiveEntity>,
    @InjectRepository(CustomerInteractionEntity)
    private readonly customerInteractionRepository: Repository<CustomerInteractionEntity>,
    @InjectRepository(PortalPaymentSessionEntity)
    private readonly portalSessionRepository: Repository<PortalPaymentSessionEntity>,
  ) {}

  // ── Scheduled execution ────────────────────────────────────────────

  /**
   * Daily archive job at 03:00 (CDC Annexe F.3)
   */
  @Cron('0 3 * * *')
  async handleDailyArchive(): Promise<void> {
    this.logger.log('Starting daily archive job...');

    try {
      const paymentResult = await this.archivePayments();
      this.logger.log(
        `Payments archived: ${paymentResult.archivedCount}, errors: ${paymentResult.errors.length}`,
      );

      const interactionCount = await this.archiveInteractions();
      this.logger.log(`Interactions archived (deleted): ${interactionCount}`);

      const portalCount = await this.archivePortalSessions();
      this.logger.log(`Portal sessions archived (deleted): ${portalCount}`);

      this.logger.log('Daily archive job completed successfully.');
    } catch (error) {
      this.logger.error('Daily archive job failed', error instanceof Error ? error.stack : error);
    }
  }

  // ── Payment archival ───────────────────────────────────────────────

  /**
   * Archive payments with final status older than retention period.
   * Copies to payment_archives table, does NOT delete originals.
   *
   * @param companyId Optional — scope to a single company
   */
  async archivePayments(companyId?: string): Promise<ArchiveResult> {
    const policy = await this.getArchivePolicy(companyId);
    const cutoffDate = this.getCutoffDate(policy.paymentRetentionDays);
    const errors: string[] = [];

    const whereCondition: Record<string, any> = {
      status: In(ARCHIVABLE_STATUSES),
      updatedAt: LessThan(cutoffDate),
    };

    if (companyId) {
      whereCondition.societeId = companyId;
    }

    const payments = await this.paymentIntentRepository.find({
      where: whereCondition,
    });

    if (payments.length === 0) {
      this.logger.debug('No payments eligible for archival.');
      return { archivedCount: 0, errors };
    }

    let archivedCount = 0;

    for (const payment of payments) {
      try {
        // Check if already archived
        const existing = await this.paymentArchiveRepository.findOne({
          where: { originalPaymentId: payment.id },
        });

        if (existing) {
          this.logger.debug(`Payment ${payment.id} already archived, skipping.`);
          continue;
        }

        // Copy to archive
        const archive = this.paymentArchiveRepository.create({
          originalPaymentId: payment.id,
          archivedAt: new Date(),
          archivedBy: 'SYSTEM',
          scheduleId: payment.scheduleId,
          clientId: payment.clientId,
          societeId: payment.societeId,
          factureId: payment.factureId,
          provider: payment.provider,
          providerPaymentId: payment.providerPaymentId,
          providerCustomerId: payment.providerCustomerId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          failureReason: payment.failureReason,
          refundedAmount: payment.refundedAmount,
          metadata: payment.metadata,
          idempotencyKey: payment.idempotencyKey,
          paidAt: payment.paidAt,
          originalCreatedAt: payment.createdAt,
          originalUpdatedAt: payment.updatedAt,
        });

        await this.paymentArchiveRepository.save(archive);
        archivedCount++;
      } catch (error) {
        const msg = `Failed to archive payment ${payment.id}: ${error instanceof Error ? error.message : String(error)}`;
        this.logger.error(msg);
        errors.push(msg);
      }
    }

    this.logger.log(
      `Archived ${archivedCount}/${payments.length} payments (company: ${companyId ?? 'all'})`,
    );

    return { archivedCount, errors };
  }

  // ── Interaction archival ───────────────────────────────────────────

  /**
   * Archive (delete) customer interactions older than J+90.
   * CDC Annexe F.4: interactions linked to archived payments or independent > 90 days.
   *
   * @param companyId Optional — scope to a single company
   */
  async archiveInteractions(companyId?: string): Promise<number> {
    const policy = await this.getArchivePolicy(companyId);
    const cutoffDate = this.getCutoffDate(policy.interactionRetentionDays);

    const whereCondition: Record<string, any> = {
      createdAt: LessThan(cutoffDate),
    };

    if (companyId) {
      whereCondition.companyId = companyId;
    }

    const interactions = await this.customerInteractionRepository.find({
      where: whereCondition,
    });

    if (interactions.length === 0) {
      return 0;
    }

    const ids = interactions.map((i) => i.id);
    await this.customerInteractionRepository.delete(ids);

    this.logger.log(
      `Archived ${ids.length} customer interactions (company: ${companyId ?? 'all'})`,
    );

    return ids.length;
  }

  // ── Portal session archival ────────────────────────────────────────

  /**
   * Archive (delete) expired portal sessions older than J+7.
   * CDC Annexe F.8: expired sessions cleaned up, tokens removed.
   *
   * @param companyId Optional — scope to a single company
   */
  async archivePortalSessions(companyId?: string): Promise<number> {
    const policy = await this.getArchivePolicy(companyId);
    const cutoffDate = this.getCutoffDate(policy.portalSessionRetentionDays);

    const whereCondition: Record<string, any> = {
      expiresAt: LessThan(cutoffDate),
      status: In([
        PortalSessionStatus.EXPIRED,
        PortalSessionStatus.COMPLETED,
        PortalSessionStatus.FAILED,
        PortalSessionStatus.CANCELLED,
      ]),
    };

    if (companyId) {
      whereCondition.societeId = companyId;
    }

    const sessions = await this.portalSessionRepository.find({
      where: whereCondition,
    });

    if (sessions.length === 0) {
      return 0;
    }

    const ids = sessions.map((s) => s.id);
    await this.portalSessionRepository.delete(ids);

    this.logger.log(
      `Archived ${ids.length} portal sessions (company: ${companyId ?? 'all'})`,
    );

    return ids.length;
  }

  // ── Archive policy ─────────────────────────────────────────────────

  /**
   * Get archive policy for a company. Returns defaults if no custom policy.
   * CDC Annexe F.3: "Paramétrable par société (company_settings.archive_policy)"
   *
   * @param companyId Optional company ID
   */
  async getArchivePolicy(companyId?: string): Promise<ArchivePolicy> {
    // TODO: Load company-specific policy from company_settings when available
    // For now, return default policy
    if (companyId) {
      this.logger.debug(
        `Using default archive policy for company ${companyId} (custom policies not yet implemented)`,
      );
    }

    return { ...DEFAULT_ARCHIVE_POLICY };
  }

  // ── Helpers ────────────────────────────────────────────────────────

  private getCutoffDate(retentionDays: number): Date {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    return cutoff;
  }
}
