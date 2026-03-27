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
      contratsActifs: 0,
      contratsActifsVariation: EMPTY_VARIATION,
      mrr: 0,
      mrrVariation: EMPTY_VARIATION,
      tauxChurn: 0,
      tauxChurnVariation: EMPTY_VARIATION,
      tauxImpayes: 0,
      tauxImpayesVariation: EMPTY_VARIATION,
    };
  }
}
