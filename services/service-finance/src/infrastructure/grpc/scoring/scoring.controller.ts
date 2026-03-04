import { Controller } from '@nestjs/common';
import {
  PredictRiskRequest,
  PredictRiskResponse,
  ScoringServiceController,
  ScoringServiceControllerMethods,
} from '@proto/scoring';
import { ScoringClientService } from '../../persistence/typeorm/repositories/payments/scoring-client.service';

@Controller()
@ScoringServiceControllerMethods()
export class ScoringController implements ScoringServiceController {
  constructor(private readonly scoringClientService: ScoringClientService) {}

  async predictRisk(request: PredictRiskRequest): Promise<PredictRiskResponse> {
    const result = await this.scoringClientService.evaluateRisk({
      paymentId: crypto.randomUUID(),
      prevRejects: request.prev_rejects,
      channel: request.channel,
      contractAgeMonths: request.contract_age_months,
      paymentHistoryCount: request.payment_history_count,
      lotCode: request.lot_code,
      provider: request.provider,
      amountCents: request.amount_cents,
      preferredDebitDay: request.preferred_debit_day,
    });

    const factors: Record<string, number> = {};

    for (const [key, value] of Object.entries(result.factors)) {
      const numericValue = Number(value);
      if (Number.isFinite(numericValue)) {
        factors[key] = numericValue;
      }
    }

    return {
      score: result.score,
      risk_tier: result.riskTier,
      factors,
    };
  }
}
