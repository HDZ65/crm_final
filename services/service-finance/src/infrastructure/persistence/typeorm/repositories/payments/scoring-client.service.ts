import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RiskScoreEntity,
  RiskTier,
} from '../../../../../domain/payments/entities';

export interface EvaluateRiskParams {
  paymentId: string;
  contractId?: string | null;
  prevRejects: number;
  channel: string;
  contractAgeMonths: number;
  paymentHistoryCount: number;
  lotCode: string;
  provider: string;
  amountCents: number;
  preferredDebitDay: number;
}

export interface RiskScoreResult {
  score: number;
  riskTier: RiskTier;
  factors: Record<string, any>;
}

interface ScoringResponse {
  score: number;
  risk_tier: string;
  factors: Record<string, any>;
}

const FALLBACK_SCORE = 55;

@Injectable()
export class ScoringClientService {
  private readonly logger = new Logger(ScoringClientService.name);
  private readonly baseUrl: string;

  constructor(
    @InjectRepository(RiskScoreEntity)
    private readonly riskScoreRepository: Repository<RiskScoreEntity>,
  ) {
    this.baseUrl = process.env.SCORING_SERVICE_URL ?? 'http://localhost:8000';
  }

  async evaluateRisk(params: EvaluateRiskParams): Promise<RiskScoreResult> {
    const endpoint = `${this.baseUrl.replace(/\/$/, '')}/predict`;

    const requestBody = {
      prev_rejects: params.prevRejects,
      channel: params.channel,
      contract_age_months: params.contractAgeMonths,
      payment_history_count: params.paymentHistoryCount,
      lot_code: params.lotCode,
      provider: params.provider,
      amount_cents: params.amountCents,
      preferred_debit_day: params.preferredDebitDay,
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Scoring service error: ${response.status} ${response.statusText} - ${errorBody}`,
        );
      }

      const payload = (await response.json()) as ScoringResponse;

      const score = this.clampScore(payload.score);
      const riskTier = this.normalizeTier(payload.risk_tier);
      const factors = this.normalizeFactors(payload.factors);

      await this.saveRiskScore({
        paymentId: params.paymentId,
        contractId: params.contractId,
        score,
        riskTier,
        factors,
      });

      return { score, riskTier, factors };
    } catch (error) {
      this.logger.warn(
        `Scoring service unavailable, applying MEDIUM fallback for payment ${params.paymentId}: ${error instanceof Error ? error.message : String(error)}`,
      );

      return this.applyFallback(params.paymentId, params.contractId);
    }
  }

  async getRiskScore(paymentId: string): Promise<RiskScoreEntity | null> {
    return this.riskScoreRepository.findOne({ where: { paymentId } });
  }

  private async applyFallback(
    paymentId: string,
    contractId?: string | null,
  ): Promise<RiskScoreResult> {
    const factors = {
      fallback_reason: 'SCORING_SERVICE_UNAVAILABLE',
    };

    await this.saveRiskScore({
      paymentId,
      contractId,
      score: FALLBACK_SCORE,
      riskTier: RiskTier.MEDIUM,
      factors,
    });

    return {
      score: FALLBACK_SCORE,
      riskTier: RiskTier.MEDIUM,
      factors,
    };
  }

  private async saveRiskScore(params: {
    paymentId: string;
    contractId?: string | null;
    score: number;
    riskTier: RiskTier;
    factors: Record<string, any>;
  }): Promise<RiskScoreEntity> {
    const existing = await this.riskScoreRepository.findOne({
      where: { paymentId: params.paymentId },
    });

    const riskScore =
      existing ??
      this.riskScoreRepository.create({
        paymentId: params.paymentId,
      });

    riskScore.contractId = params.contractId ?? null;
    riskScore.score = params.score;
    riskScore.riskTier = params.riskTier;
    riskScore.factors = params.factors;
    riskScore.evaluatedAt = new Date();

    return this.riskScoreRepository.save(riskScore);
  }

  private clampScore(score: unknown): number {
    const numericScore = Number(score);

    if (!Number.isFinite(numericScore)) {
      return FALLBACK_SCORE;
    }

    return Math.max(0, Math.min(100, Math.round(numericScore)));
  }

  private normalizeTier(value: unknown): RiskTier {
    const normalized = String(value ?? '').trim().toUpperCase();

    if (normalized === RiskTier.LOW) {
      return RiskTier.LOW;
    }

    if (normalized === RiskTier.HIGH) {
      return RiskTier.HIGH;
    }

    return RiskTier.MEDIUM;
  }

  private normalizeFactors(value: unknown): Record<string, any> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    const filtered: Record<string, any> = {};

    for (const [key, keyValue] of Object.entries(value as Record<string, unknown>)) {
      if (
        typeof keyValue === 'string' ||
        typeof keyValue === 'number' ||
        typeof keyValue === 'boolean'
      ) {
        filtered[key] = keyValue;
      }
    }

    return filtered;
  }
}
