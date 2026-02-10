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
      nouveaux_clients_mois: 0,
      nouveaux_clients_variation: EMPTY_VARIATION,
      taux_conversion: 0,
      taux_conversion_variation: EMPTY_VARIATION,
      panier_moyen: 0,
      panier_moyen_variation: EMPTY_VARIATION,
      ca_previsionnel_3_mois: 0,
      classement_par_ventes: [],
      classement_par_ca: [],
      classement_par_conversion: [],
    };
  }
}
