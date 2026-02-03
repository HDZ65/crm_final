import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { KpisCommerciauxService } from './kpis-commerciaux.service';

import type { GetKpisCommerciauxRequest } from '@crm/proto/dashboard';

@Controller()
export class KpisCommerciauxController {
  constructor(private readonly kpisCommerciauxService: KpisCommerciauxService) {}

  @GrpcMethod('KpisCommerciauxService', 'GetKpisCommerciaux')
  async getKpisCommerciaux(data: GetKpisCommerciauxRequest) {
    return this.kpisCommerciauxService.getKpisCommerciaux({
      organisationId: data.filters?.organisationId ?? '',
      societeId: data.filters?.societeId,
      produitId: data.filters?.produitId,
      canal: data.filters?.canal,
      dateDebut: data.filters?.dateDebut,
      dateFin: data.filters?.dateFin,
      periodeRapide: data.filters?.periodeRapide,
    });
  }
}
