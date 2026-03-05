import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  ClientDebitConfigurationEntity,
  DateShiftStrategy,
  DebitDateMode,
  DebitLotEntity,
} from '../../../../../domain/calendar/entities';
import {
  ApplyOptimizationSuggestionInput,
  ApplyOptimizationSuggestionResult,
  GetOptimizationSuggestionsInput,
  IOptimizationSuggestionRepository,
  OptimizationSuggestion,
} from '../../../../../domain/calendar/repositories/IOptimizationSuggestionRepository';
import { PaymentIntentStatus } from '../../../../../domain/payments/entities/payment-intent.entity';

interface LotMetrics {
  total: number;
  rejected: number;
}

interface ClientMetrics {
  clientName: string;
  total: number;
  lots: Map<string, LotMetrics>;
}

@Injectable()
export class OptimizationSuggestionService implements IOptimizationSuggestionRepository {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ClientDebitConfigurationEntity)
    private readonly clientConfigRepo: Repository<ClientDebitConfigurationEntity>,
    @InjectRepository(DebitLotEntity)
    private readonly debitLotRepo: Repository<DebitLotEntity>,
  ) {}

  async getOptimizationSuggestions(
    input: GetOptimizationSuggestionsInput,
  ): Promise<OptimizationSuggestion[]> {
    const analysisMonths = input.analysisMonths && input.analysisMonths > 0
      ? input.analysisMonths
      : 6;
    const windowStart = new Date();
    windowStart.setMonth(windowStart.getMonth() - analysisMonths);

    const lots = await this.debitLotRepo
      .createQueryBuilder('lot')
      .where('lot.organisation_id = :orgId', { orgId: input.organisationId })
      .andWhere('lot.societe_id = :societeId', { societeId: input.societeId })
      .andWhere('lot.is_active = true')
      .orderBy('lot.display_order', 'ASC')
      .getMany();

    if (lots.length === 0) {
      return [];
    }

    const lotById = new Map(lots.map((lot) => [lot.id, lot]));

    const paymentRows = await this.dataSource.query(
        `
        SELECT
          pi.client_id AS "clientId",
          COALESCE(MAX(pi.metadata->>'client_name'), MAX(sch.metadata->>'client_name'), pi.client_id) AS "clientName",
          EXTRACT(DAY FROM COALESCE(sch.planned_debit_date, pi.created_at))::int AS "paymentDay",
          CASE WHEN pi.status = $1 THEN 1 ELSE 0 END AS "isRejected"
        FROM payment_intents pi
        INNER JOIN schedules sch ON sch.id = pi.schedule_id
        WHERE sch.organisation_id = $2
          AND sch.societe_id = $3
          AND pi.created_at >= $4
        GROUP BY pi.id, pi.client_id, sch.planned_debit_date, pi.created_at, pi.status
      `,
      [PaymentIntentStatus.FAILED, input.organisationId, input.societeId, windowStart],
    );

    const metricsByClient = new Map<string, ClientMetrics>();

    for (const row of paymentRows as Array<Record<string, unknown>>) {
      const clientId = String(row.clientId ?? '');
      const paymentDay = Number(row.paymentDay ?? 0);
      if (!clientId || paymentDay < 1 || paymentDay > 31) {
        continue;
      }

      const lot = lots.find((entry) => entry.containsDay(paymentDay));
      if (!lot) {
        continue;
      }

      const existing = metricsByClient.get(clientId) ?? {
        clientName: String(row.clientName ?? clientId),
        total: 0,
        lots: new Map<string, LotMetrics>(),
      };

      existing.total += 1;
      const lotMetrics = existing.lots.get(lot.id) ?? { total: 0, rejected: 0 };
      lotMetrics.total += 1;
      lotMetrics.rejected += Number(row.isRejected ?? 0) > 0 ? 1 : 0;
      existing.lots.set(lot.id, lotMetrics);
      metricsByClient.set(clientId, existing);
    }

    const currentLotRows = await this.dataSource.query(
        `
        SELECT
          cdc.client_id AS "clientId",
          cdc.lot_id AS "lotId"
        FROM client_debit_configuration cdc
        LEFT JOIN debit_lot lot ON lot.id = cdc.lot_id
        WHERE cdc.organisation_id = $1
          AND (lot.societe_id = $2 OR cdc.lot_id IS NULL)
          AND cdc.is_active = true
      `,
      [input.organisationId, input.societeId],
    );

    const explicitLotByClient = new Map<string, string>();
    for (const row of currentLotRows as Array<Record<string, unknown>>) {
      if (row.clientId && row.lotId) {
        explicitLotByClient.set(String(row.clientId), String(row.lotId));
      }
    }

    const suggestions: OptimizationSuggestion[] = [];

    for (const [clientId, metrics] of metricsByClient.entries()) {
      if (metrics.total < 3) {
        continue;
      }

      let currentLotId = explicitLotByClient.get(clientId) ?? '';
      if (!currentLotId) {
        currentLotId = this.pickMostFrequentLot(metrics.lots);
      }

      const currentMetrics = metrics.lots.get(currentLotId);
      if (!currentMetrics || currentMetrics.total === 0) {
        continue;
      }

      const currentRate = (currentMetrics.rejected / currentMetrics.total) * 100;
      if (currentRate <= 20) {
        continue;
      }

      const best = this.findBestLot(metrics.lots, currentLotId);
      if (!best || best.lotId === currentLotId) {
        continue;
      }

      const confidence = Math.min((currentMetrics.total / 20) * 100, 95);
      const currentLot = lotById.get(currentLotId);
      const suggestedLot = lotById.get(best.lotId);
      const impactPoints = Math.max(0, currentRate - best.rate);

      suggestions.push({
        clientId,
        clientName: metrics.clientName,
        currentLotId,
        currentLotName: currentLot?.name ?? 'Lot actuel',
        suggestedLotId: best.lotId,
        suggestedLotName: suggestedLot?.name ?? 'Lot suggere',
        reason: `Taux de rejet de ${currentRate.toFixed(1)}% dans lot actuel vs ${best.rate.toFixed(1)}% dans lot suggere`,
        confidence: Math.round(confidence * 100) / 100,
        estimatedImpact: `Reduction estimee de ${impactPoints.toFixed(1)} points de rejet`,
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  async applyOptimizationSuggestion(
    input: ApplyOptimizationSuggestionInput,
  ): Promise<ApplyOptimizationSuggestionResult> {
    const targetLot = await this.debitLotRepo
      .createQueryBuilder('lot')
      .where('lot.organisation_id = :orgId', { orgId: input.organisationId })
      .andWhere('lot.id = :lotId', { lotId: input.suggestedLotId })
      .andWhere('lot.is_active = true')
      .getOne();

    if (!targetLot) {
      throw new NotFoundException('Suggested lot not found for organisation');
    }

    if (!input.clientId) {
      throw new BadRequestException('clientId is required');
    }

    let config = await this.clientConfigRepo
      .createQueryBuilder('cdc')
      .where('cdc.organisation_id = :orgId', { orgId: input.organisationId })
      .andWhere('cdc.client_id = :clientId', { clientId: input.clientId })
      .getOne();

    if (!config) {
      config = this.clientConfigRepo.create({
        organisationId: input.organisationId,
        clientId: input.clientId,
        mode: DebitDateMode.BATCH,
        shiftStrategy: DateShiftStrategy.NEXT_BUSINESS_DAY,
        isActive: true,
      });
    }

    config.lotId = input.suggestedLotId;
    config.mode = config.mode ?? DebitDateMode.BATCH;
    config.shiftStrategy = config.shiftStrategy ?? DateShiftStrategy.NEXT_BUSINESS_DAY;
    config.isActive = true;

    const updatedConfig = await this.clientConfigRepo.save(config);

    return {
      success: true,
      updatedConfig,
    };
  }

  private pickMostFrequentLot(lotMetrics: Map<string, LotMetrics>): string {
    let selectedLotId = '';
    let maxCount = -1;

    for (const [lotId, stats] of lotMetrics.entries()) {
      if (stats.total > maxCount) {
        selectedLotId = lotId;
        maxCount = stats.total;
      }
    }

    return selectedLotId;
  }

  private findBestLot(
    lotMetrics: Map<string, LotMetrics>,
    currentLotId: string,
  ): { lotId: string; rate: number } | null {
    let bestLotId = '';
    let bestRate = Number.POSITIVE_INFINITY;
    let bestSample = -1;

    for (const [lotId, stats] of lotMetrics.entries()) {
      if (lotId === currentLotId || stats.total === 0) {
        continue;
      }

      const rejectionRate = (stats.rejected / stats.total) * 100;
      if (
        rejectionRate < bestRate ||
        (Math.abs(rejectionRate - bestRate) < 0.0001 && stats.total > bestSample)
      ) {
        bestLotId = lotId;
        bestRate = rejectionRate;
        bestSample = stats.total;
      }
    }

    if (!bestLotId) {
      return null;
    }

    return { lotId: bestLotId, rate: bestRate };
  }
}
