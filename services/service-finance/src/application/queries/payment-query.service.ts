import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  PaymentIntentEntity,
  PaymentIntentStatus,
} from '../../domain/payments/entities/payment-intent.entity';
import { ScheduleEntity } from '../../domain/payments/entities/schedule.entity';
import { RiskScoreEntity } from '../../domain/payments/entities/risk-score.entity';
import type {
  ListPaymentsRequest,
  ListPaymentsResponse,
  PaymentItem,
  GetPaymentStatsRequest,
  GetPaymentStatsResponse,
} from '@proto/payment';

/**
 * PaymentQueryService — Read-side service for payment listing and stats.
 *
 * Supports 12 filters from ListPaymentsRequest with pagination.
 * Joins PaymentIntentEntity with ScheduleEntity and RiskScoreEntity
 * to enrich the response.
 *
 * Amounts are stored as decimal in DB but returned as cents (int64) per proto convention.
 */
@Injectable()
export class PaymentQueryService {
  private readonly logger = new Logger(PaymentQueryService.name);

  constructor(
    @InjectRepository(PaymentIntentEntity)
    private readonly paymentIntentRepo: Repository<PaymentIntentEntity>,
  ) {}

  /**
   * List payments with filtering, pagination, and enrichment via JOINs.
   */
  async listPayments(request: ListPaymentsRequest): Promise<ListPaymentsResponse> {
    const page = request.page && request.page > 0 ? request.page : 1;
    const limit = request.limit && request.limit > 0 ? Math.min(request.limit, 1000) : 20;
    const offset = (page - 1) * limit;

    const qb = this.paymentIntentRepo
      .createQueryBuilder('pi')
      .leftJoinAndSelect('pi.schedule', 'sch')
      .leftJoin(RiskScoreEntity, 'rs', 'rs.payment_id = pi.id')
      .addSelect(['rs.score', 'rs.riskTier']);

    // Always filter by company
    qb.where('pi.societe_id = :societeId', { societeId: request.societe_id });

    this.applyFilters(qb, request);

    // Get total count before pagination
    const total = await qb.getCount();

    // Apply ordering + pagination
    qb.orderBy('pi.created_at', 'DESC')
      .skip(offset)
      .take(limit);

    // Execute with raw results for risk score data
    const rawAndEntities = await qb.getRawAndEntities();

    const payments: PaymentItem[] = rawAndEntities.entities.map((pi, index) => {
      const raw = rawAndEntities.raw[index];
      return this.toPaymentItem(pi, raw);
    });

    return {
      payments,
      total,
      page,
      limit,
    };
  }

  /**
   * Get payment statistics aggregated by status.
   * Uses raw SQL aggregation for performance.
   */
  async getPaymentStats(request: GetPaymentStatsRequest): Promise<GetPaymentStatsResponse> {
    const qb = this.paymentIntentRepo
      .createQueryBuilder('pi')
      .select('COUNT(*)', 'total_payments')
      .addSelect('COALESCE(SUM(pi.amount * 100), 0)', 'total_amount')
      .addSelect(
        `SUM(CASE WHEN pi.status = :succeeded THEN 1 ELSE 0 END)`,
        'paid_count',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN pi.status = :succeeded THEN pi.amount * 100 ELSE 0 END), 0)`,
        'paid_amount',
      )
      .addSelect(
        `SUM(CASE WHEN pi.status IN (:...pendingStatuses) THEN 1 ELSE 0 END)`,
        'pending_count',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN pi.status IN (:...pendingStatuses) THEN pi.amount * 100 ELSE 0 END), 0)`,
        'pending_amount',
      )
      .addSelect(
        `SUM(CASE WHEN pi.status = :failed THEN 1 ELSE 0 END)`,
        'rejected_count',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN pi.status = :failed THEN pi.amount * 100 ELSE 0 END), 0)`,
        'rejected_amount',
      )
      .setParameters({
        succeeded: PaymentIntentStatus.SUCCEEDED,
        pendingStatuses: [PaymentIntentStatus.PENDING, PaymentIntentStatus.PROCESSING],
        failed: PaymentIntentStatus.FAILED,
      })
      .where('pi.societe_id = :societeId', { societeId: request.societe_id });

    // Optional date range filters
    if (request.date_from) {
      qb.andWhere('pi.created_at >= :dateFrom', { dateFrom: request.date_from });
    }
    if (request.date_to) {
      qb.andWhere('pi.created_at <= :dateTo', { dateTo: request.date_to });
    }

    const raw = await qb.getRawOne();

    const totalPayments = parseInt(raw?.total_payments ?? '0', 10);
    const rejectedCount = parseInt(raw?.rejected_count ?? '0', 10);
    const totalAmount = parseInt(raw?.total_amount ?? '0', 10);
    const rejectRate = totalPayments > 0
      ? (rejectedCount / totalPayments) * 100
      : 0;
    const averageAmount = totalPayments > 0
      ? totalAmount / totalPayments
      : 0;

    return {
      total_payments: totalPayments,
      total_amount: totalAmount,
      paid_count: parseInt(raw?.paid_count ?? '0', 10),
      paid_amount: parseInt(raw?.paid_amount ?? '0', 10),
      pending_count: parseInt(raw?.pending_count ?? '0', 10),
      pending_amount: parseInt(raw?.pending_amount ?? '0', 10),
      rejected_count: rejectedCount,
      rejected_amount: parseInt(raw?.rejected_amount ?? '0', 10),
      reject_rate: Math.round(rejectRate * 100) / 100,
      average_amount: Math.round(averageAmount),
    };
  }

  // ── Private helpers ───────────────────────────────────────────────

  /**
   * Apply all 12 optional filters from ListPaymentsRequest to the query builder.
   */
  private applyFilters(
    qb: SelectQueryBuilder<PaymentIntentEntity>,
    request: ListPaymentsRequest,
  ): void {
    // 1. Global text search across client_id, facture_id, provider_payment_id
    if (request.search) {
      qb.andWhere(
        `(pi.client_id ILIKE :search OR pi.facture_id ILIKE :search OR pi.provider_payment_id ILIKE :search OR CAST(pi.id AS TEXT) ILIKE :search)`,
        { search: `%${request.search}%` },
      );
    }

    // 2. Status filter — map proto status string to entity enum
    if (request.status) {
      const mappedStatus = this.mapProtoStatusToEntity(request.status);
      if (mappedStatus) {
        qb.andWhere('pi.status = :status', { status: mappedStatus });
      }
    }

    // 3. PSP provider filter
    if (request.psp_provider) {
      qb.andWhere('UPPER(pi.provider) = UPPER(:provider)', {
        provider: request.psp_provider,
      });
    }

    // 4. Payment method filter — stored in schedule or metadata
    if (request.payment_method) {
      qb.andWhere(
        `(sch.metadata->>'payment_method' ILIKE :paymentMethod OR pi.metadata->>'payment_method' ILIKE :paymentMethod)`,
        { paymentMethod: request.payment_method },
      );
    }

    // 5. Debit lot filter — stored in schedule metadata
    if (request.debit_lot) {
      qb.andWhere(
        `(sch.metadata->>'debit_lot' = :debitLot OR pi.metadata->>'debit_lot' = :debitLot)`,
        { debitLot: request.debit_lot },
      );
    }

    // 6. Risk tier filter — join to risk_scores
    if (request.risk_tier) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM risk_scores rs2 WHERE rs2.payment_id = pi.id AND rs2.risk_tier = :riskTier)`,
        { riskTier: request.risk_tier },
      );
    }

    // 7. Source channel filter — stored in metadata
    if (request.source_channel) {
      qb.andWhere(
        `(sch.metadata->>'source_channel' ILIKE :sourceChannel OR pi.metadata->>'source_channel' ILIKE :sourceChannel)`,
        { sourceChannel: request.source_channel },
      );
    }

    // 8. Date from filter
    if (request.date_from) {
      qb.andWhere('pi.created_at >= :dateFrom', { dateFrom: request.date_from });
    }

    // 9. Date to filter
    if (request.date_to) {
      qb.andWhere('pi.created_at <= :dateTo', { dateTo: request.date_to });
    }

    // 10. Min amount filter (request in cents, DB in decimal)
    if (request.min_amount !== undefined && request.min_amount !== 0) {
      qb.andWhere('pi.amount >= :minAmount', { minAmount: request.min_amount / 100 });
    }

    // 11. Max amount filter (request in cents, DB in decimal)
    if (request.max_amount !== undefined && request.max_amount !== 0) {
      qb.andWhere('pi.amount <= :maxAmount', { maxAmount: request.max_amount / 100 });
    }
  }

  /**
   * Map a PaymentIntentEntity (with joined data) to a PaymentItem proto response.
   */
  private toPaymentItem(pi: PaymentIntentEntity, raw: Record<string, any>): PaymentItem {
    const metadata = pi.metadata ?? {};
    const schedule = pi.schedule;
    const scheduleMetadata = schedule?.metadata ?? {};

    // Amount: DB stores decimal, proto expects cents (int64)
    const amountCents = Math.round(Number(pi.amount) * 100);

    return {
      id: pi.id,
      payment_reference: pi.providerPaymentId ?? pi.idempotencyKey ?? pi.id,
      // Relations — enriched from metadata or schedule
      client_id: pi.clientId ?? '',
      client_name: metadata.client_name ?? scheduleMetadata.client_name ?? '',
      contract_id: schedule?.contratId ?? metadata.contract_id ?? '',
      contract_reference: metadata.contract_reference ?? scheduleMetadata.contract_reference ?? '',
      company: metadata.company ?? scheduleMetadata.company ?? '',
      // Financial
      amount: amountCents,
      currency: pi.currency ?? 'EUR',
      payment_method: metadata.payment_method ?? scheduleMetadata.payment_method ?? '',
      // Status
      status: this.mapEntityStatusToProto(pi.status),
      payment_type: metadata.payment_type ?? 'EMISSION',
      // PSP
      psp_provider: pi.provider ?? '',
      psp_transaction_id: pi.providerPaymentId ?? undefined,
      // Calendar
      planned_debit_date: schedule?.plannedDebitDate?.toISOString?.()
        ?? metadata.planned_debit_date
        ?? pi.createdAt.toISOString(),
      actual_debit_date: pi.paidAt?.toISOString?.() ?? undefined,
      debit_lot: metadata.debit_lot ?? scheduleMetadata.debit_lot ?? undefined,
      // Risk
      risk_score: raw?.rs_score ?? undefined,
      risk_tier: raw?.rs_risk_tier ?? undefined,
      // Retry
      retry_count: schedule?.retryCount ?? undefined,
      // SEPA
      rum: metadata.rum ?? scheduleMetadata.rum ?? undefined,
      iban_masked: metadata.iban_masked ?? scheduleMetadata.iban_masked ?? undefined,
      // Timestamps
      created_at: pi.createdAt.toISOString(),
      updated_at: pi.updatedAt.toISOString(),
    };
  }

  /**
   * Map proto status string (PENDING, SUBMITTED, PAID, REJECTED, etc.)
   * to PaymentIntentStatus enum.
   */
  private mapProtoStatusToEntity(protoStatus: string): PaymentIntentStatus | null {
    const normalized = protoStatus.trim().toUpperCase();
    const mapping: Record<string, PaymentIntentStatus> = {
      PENDING: PaymentIntentStatus.PENDING,
      SUBMITTED: PaymentIntentStatus.PROCESSING,
      PAID: PaymentIntentStatus.SUCCEEDED,
      REJECTED: PaymentIntentStatus.FAILED,
      REFUNDED: PaymentIntentStatus.REFUNDED,
      CANCELLED: PaymentIntentStatus.CANCELLED,
      FAILED: PaymentIntentStatus.FAILED,
      PROCESSING: PaymentIntentStatus.PROCESSING,
      SUCCEEDED: PaymentIntentStatus.SUCCEEDED,
      PARTIALLY_REFUNDED: PaymentIntentStatus.PARTIALLY_REFUNDED,
    };
    return mapping[normalized] ?? null;
  }

  /**
   * Map PaymentIntentStatus enum to proto-friendly status string.
   */
  private mapEntityStatusToProto(status: PaymentIntentStatus): string {
    const mapping: Record<PaymentIntentStatus, string> = {
      [PaymentIntentStatus.PENDING]: 'PENDING',
      [PaymentIntentStatus.PROCESSING]: 'SUBMITTED',
      [PaymentIntentStatus.SUCCEEDED]: 'PAID',
      [PaymentIntentStatus.FAILED]: 'REJECTED',
      [PaymentIntentStatus.CANCELLED]: 'CANCELLED',
      [PaymentIntentStatus.REFUNDED]: 'REFUNDED',
      [PaymentIntentStatus.PARTIALLY_REFUNDED]: 'PARTIALLY_REFUNDED',
    };
    return mapping[status] ?? status;
  }
}
