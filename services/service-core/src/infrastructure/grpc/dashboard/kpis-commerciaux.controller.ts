import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type { GetKpisCommerciauxRequest, KpisCommerciauxResponse, Variation } from '@proto/dashboard';

const EMPTY_VARIATION: Variation = {
  pourcentage: 0,
  tendance: 'stable',
};

@Controller()
export class KpisCommerciauxController {
  @GrpcMethod('KpisCommerciauxService', 'GetKpisCommerciaux')
  async getKpisCommerciaux(_: GetKpisCommerciauxRequest): Promise<KpisCommerciauxResponse> {
    return {
      nouveauxClientsMois: 0,
      nouveauxClientsVariation: EMPTY_VARIATION,
      tauxConversion: 0,
      tauxConversionVariation: EMPTY_VARIATION,
      panierMoyen: 0,
      panierMoyenVariation: EMPTY_VARIATION,
      caPrevisionnel3Mois: 0,
      classementParVentes: [],
      classementParCa: [],
      classementParConversion: [],
    };
  }
}
