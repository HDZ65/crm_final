import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type { GetKpisRequest, KpisResponse, Variation } from '@proto/dashboard';

const EMPTY_VARIATION: Variation = {
  pourcentage: 0,
  tendance: 'stable',
};

@Controller()
export class DashboardKpisController {
  @GrpcMethod('DashboardKpisService', 'GetKpis')
  async getKpis(_: GetKpisRequest): Promise<KpisResponse> {
    return {
      contrats_actifs: 0,
      contrats_actifs_variation: EMPTY_VARIATION,
      mrr: 0,
      mrr_variation: EMPTY_VARIATION,
      taux_churn: 0,
      taux_churn_variation: EMPTY_VARIATION,
      taux_impayes: 0,
      taux_impayes_variation: EMPTY_VARIATION,
    };
  }
}
