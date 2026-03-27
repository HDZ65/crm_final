import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IAnalyticsAggregationRepository,
  RejectionTrendPoint,
  DayHeatmapPoint,
  ClientScorePoint,
  ClientScoreTrend,
  ForecastVsActualPoint,
} from '../../../../../domain/calendar/repositories';
import { PlannedDebitEntity } from '../../../../../domain/calendar/entities';
import {
  PaymentIntentEntity,
  PaymentIntentStatus,
  ScheduleEntity,
  RiskScoreEntity,
} from '../../../../../domain/payments/entities';
import { VolumeForecastEntity } from '../../../../../domain/calendar/entities';

@Injectable()
export class AnalyticsAggregationService implements IAnalyticsAggregationRepository {
  constructor(
    @InjectRepository(PaymentIntentEntity)
    private readonly paymentIntentRepo: Repository<PaymentIntentEntity>,
    @InjectRepository(PlannedDebitEntity)
    private readonly plannedDebitRepo: Repository<PlannedDebitEntity>,
    @InjectRepository(VolumeForecastEntity)
    private readonly volumeForecastRepo: Repository<VolumeForecastEntity>,
  ) {}

  async getRejectionTrends(
    organisationId: string,
    societeId: string,
    monthsBack: number,
  ): Promise<RejectionTrendPoint[]> {
    const normalizedMonths = Math.max(1, Math.min(monthsBack || 6, 12));
    const startDate = this.startOfMonthMonthsAgo(normalizedMonths - 1);

    const rows = await this.paymentIntentRepo
      .createQueryBuilder('pi')
      .innerJoin(ScheduleEntity, 'sch', 'sch.id = pi.schedule_id')
      .select('EXTRACT(YEAR FROM pi.created_at)', 'year')
      .addSelect('EXTRACT(MONTH FROM pi.created_at)', 'month')
      .addSelect('COUNT(*)', 'total_count')
      .addSelect(
        'SUM(CASE WHEN pi.status = :failedStatus THEN 1 ELSE 0 END)',
        'rejected_count',
      )
      .where('sch.organisation_id = :organisationId', { organisationId })
      .andWhere('sch.societe_id = :societeId', { societeId })
      .andWhere('pi.societe_id = :societeId', { societeId })
      .andWhere('pi.created_at >= :startDate', { startDate })
      .setParameter('failedStatus', PaymentIntentStatus.FAILED)
      .groupBy('EXTRACT(YEAR FROM pi.created_at)')
      .addGroupBy('EXTRACT(MONTH FROM pi.created_at)')
      .orderBy('year', 'ASC')
      .addOrderBy('month', 'ASC')
      .getRawMany();

    return rows.map((row) => {
      const totalCount = parseInt(row.total_count ?? '0', 10);
      const rejectedCount = parseInt(row.rejected_count ?? '0', 10);

      return {
        year: parseInt(row.year ?? '0', 10),
        month: parseInt(row.month ?? '0', 10),
        totalCount,
        rejectedCount,
        rejectionRate: totalCount > 0 ? (rejectedCount / totalCount) * 100 : 0,
      };
    });
  }

  async getDayHeatmap(
    organisationId: string,
    societeId: string,
    monthsBack: number,
  ): Promise<DayHeatmapPoint[]> {
    const normalizedMonths = Math.max(1, Math.min(monthsBack || 6, 12));
    const startDate = this.startOfMonthMonthsAgo(normalizedMonths - 1);

    const totalRows = await this.plannedDebitRepo
      .createQueryBuilder('pd')
      .select('EXTRACT(DAY FROM pd.plannedDebitDate)', 'day_of_month')
      .addSelect('COUNT(*)', 'total_count')
      .where('pd.organisationId = :organisationId', { organisationId })
      .andWhere('pd.societeId = :societeId', { societeId })
      .andWhere('pd.plannedDebitDate >= :startDate', { startDate })
      .groupBy('EXTRACT(DAY FROM pd.plannedDebitDate)')
      .orderBy('day_of_month', 'ASC')
      .getRawMany();

    const rejectedRows = await this.paymentIntentRepo
      .createQueryBuilder('pi')
      .innerJoin(ScheduleEntity, 'sch', 'sch.id = pi.schedule_id')
      .select('EXTRACT(DAY FROM sch.planned_debit_date)', 'day_of_month')
      .addSelect('COUNT(*)', 'rejected_count')
      .where('sch.organisation_id = :organisationId', { organisationId })
      .andWhere('sch.societe_id = :societeId', { societeId })
      .andWhere('pi.societe_id = :societeId', { societeId })
      .andWhere('sch.planned_debit_date >= :startDate', { startDate })
      .andWhere('pi.status = :failedStatus', { failedStatus: PaymentIntentStatus.FAILED })
      .groupBy('EXTRACT(DAY FROM sch.planned_debit_date)')
      .orderBy('day_of_month', 'ASC')
      .getRawMany();

    const totalsByDay = new Map<number, number>();
    const rejectedByDay = new Map<number, number>();

    for (const row of totalRows) {
      totalsByDay.set(
        parseInt(row.day_of_month ?? '0', 10),
        parseInt(row.total_count ?? '0', 10),
      );
    }

    for (const row of rejectedRows) {
      rejectedByDay.set(
        parseInt(row.day_of_month ?? '0', 10),
        parseInt(row.rejected_count ?? '0', 10),
      );
    }

    const points: DayHeatmapPoint[] = [];
    for (let day = 1; day <= 28; day += 1) {
      const totalCount = totalsByDay.get(day) ?? 0;
      const rejectedCount = rejectedByDay.get(day) ?? 0;

      points.push({
        dayOfMonth: day,
        totalCount,
        rejectedCount,
        rejectionRate: totalCount > 0 ? (rejectedCount / totalCount) * 100 : 0,
      });
    }

    return points;
  }

  async getClientScores(
    organisationId: string,
    societeId: string,
    limit: number,
    sortBy: string,
  ): Promise<ClientScorePoint[]> {
    const normalizedLimit = Math.max(1, Math.min(limit || 20, 100));
    const lastThreeMonthsStart = this.startOfMonthMonthsAgo(2);
    const previousThreeMonthsStart = this.startOfMonthMonthsAgo(5);

    const qb = this.paymentIntentRepo
      .createQueryBuilder('pi')
      .innerJoin(ScheduleEntity, 'sch', 'sch.id = pi.schedule_id')
      .leftJoin(RiskScoreEntity, 'rs', 'rs.payment_id = pi.id')
      .select('pi.client_id', 'client_id')
      .addSelect("COALESCE(MAX(sch.metadata->>'client_name'), pi.client_id)", 'client_name')
      .addSelect('COUNT(*)', 'total_payments')
      .addSelect(
        'SUM(CASE WHEN pi.status = :failedStatus THEN 1 ELSE 0 END)',
        'rejected_count',
      )
      .addSelect('COALESCE(AVG(rs.score), 0)', 'avg_score')
      .addSelect(
        'SUM(CASE WHEN pi.created_at >= :lastThreeMonthsStart THEN 1 ELSE 0 END)',
        'last_period_total',
      )
      .addSelect(
        'SUM(CASE WHEN pi.created_at >= :lastThreeMonthsStart AND pi.status = :failedStatus THEN 1 ELSE 0 END)',
        'last_period_rejected',
      )
      .addSelect(
        'SUM(CASE WHEN pi.created_at >= :previousThreeMonthsStart AND pi.created_at < :lastThreeMonthsStart THEN 1 ELSE 0 END)',
        'previous_period_total',
      )
      .addSelect(
        'SUM(CASE WHEN pi.created_at >= :previousThreeMonthsStart AND pi.created_at < :lastThreeMonthsStart AND pi.status = :failedStatus THEN 1 ELSE 0 END)',
        'previous_period_rejected',
      )
      .where('sch.organisation_id = :organisationId', { organisationId })
      .andWhere('sch.societe_id = :societeId', { societeId })
      .andWhere('pi.societe_id = :societeId', { societeId })
      .setParameters({
        failedStatus: PaymentIntentStatus.FAILED,
        lastThreeMonthsStart,
        previousThreeMonthsStart,
      })
      .groupBy('pi.client_id')
      .having('COUNT(*) >= 3');

    const sortColumnMap: Record<string, string> = {
      totalPayments: 'total_payments',
      rejectedCount: 'rejected_count',
      successRate: 'success_rate',
      riskTier: 'avg_score',
      clientId: 'client_id',
    };
    const sortColumn = sortColumnMap[sortBy] ?? 'rejected_count';

    if (sortColumn === 'success_rate') {
      qb.addSelect(
        '(CASE WHEN COUNT(*) > 0 THEN ((COUNT(*) - SUM(CASE WHEN pi.status = :failedStatus THEN 1 ELSE 0 END)) * 100.0 / COUNT(*)) ELSE 0 END)',
        'success_rate',
      );
    }

    qb.orderBy(sortColumn, sortColumn === 'client_id' ? 'ASC' : 'DESC').limit(normalizedLimit);

    const rows = await qb.getRawMany();

    return rows.map((row) => {
      const totalPayments = parseInt(row.total_payments ?? '0', 10);
      const rejectedCount = parseInt(row.rejected_count ?? '0', 10);
      const successRate = totalPayments > 0
        ? ((totalPayments - rejectedCount) / totalPayments) * 100
        : 0;

      const avgScore = parseFloat(row.avg_score ?? '0');
      const lastPeriodTotal = parseInt(row.last_period_total ?? '0', 10);
      const lastPeriodRejected = parseInt(row.last_period_rejected ?? '0', 10);
      const previousPeriodTotal = parseInt(row.previous_period_total ?? '0', 10);
      const previousPeriodRejected = parseInt(row.previous_period_rejected ?? '0', 10);

      const lastRate = lastPeriodTotal > 0 ? lastPeriodRejected / lastPeriodTotal : 0;
      const previousRate = previousPeriodTotal > 0 ? previousPeriodRejected / previousPeriodTotal : 0;

      return {
        clientId: row.client_id,
        clientName: row.client_name,
        totalPayments,
        rejectedCount,
        successRate,
        riskTier: this.toRiskTier(avgScore),
        trend: this.toTrend(lastRate, previousRate),
      };
    });
  }

  async getForecastVsActual(
    organisationId: string,
    societeId: string,
    monthsBack: number,
  ): Promise<ForecastVsActualPoint[]> {
    const normalizedMonths = Math.max(1, Math.min(monthsBack || 6, 24));
    const startDate = this.startOfMonthMonthsAgo(normalizedMonths - 1);

    const rows = await this.volumeForecastRepo
      .createQueryBuilder('vf')
      .select('vf.year', 'year')
      .addSelect('vf.month', 'month')
      .addSelect('COALESCE(SUM(vf.expectedTransactionCount), 0)', 'expected_count')
      .addSelect('COALESCE(SUM(vf.actualTransactionCount), 0)', 'actual_count')
      .addSelect('COALESCE(SUM(vf.expectedAmountCents), 0)', 'expected_amount')
      .addSelect('COALESCE(SUM(vf.actualAmountCents), 0)', 'actual_amount')
      .where('vf.organisationId = :organisationId', { organisationId })
      .andWhere('vf.societeId = :societeId', { societeId })
      .andWhere("make_date(vf.year, vf.month, 1) >= :startDate", { startDate })
      .groupBy('vf.year')
      .addGroupBy('vf.month')
      .orderBy('vf.year', 'ASC')
      .addOrderBy('vf.month', 'ASC')
      .getRawMany();

    return rows.map((row) => ({
      year: parseInt(row.year ?? '0', 10),
      month: parseInt(row.month ?? '0', 10),
      expectedCount: parseInt(row.expected_count ?? '0', 10),
      actualCount: parseInt(row.actual_count ?? '0', 10),
      expectedAmount: parseInt(row.expected_amount ?? '0', 10),
      actualAmount: parseInt(row.actual_amount ?? '0', 10),
    }));
  }

  private startOfMonthMonthsAgo(monthsAgo: number): Date {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    date.setMonth(date.getMonth() - monthsAgo);
    return date;
  }

  private toRiskTier(score: number): string {
    if (score >= 67) {
      return 'HIGH';
    }
    if (score >= 34) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  private toTrend(lastRate: number, previousRate: number): ClientScoreTrend {
    const delta = lastRate - previousRate;
    if (Math.abs(delta) <= 0.02) {
      return 'stable';
    }
    return delta < 0 ? 'improving' : 'degrading';
  }
}
