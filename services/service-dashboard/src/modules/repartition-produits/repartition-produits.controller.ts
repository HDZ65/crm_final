import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RepartitionProduitsService } from './repartition-produits.service';

import type { GetRepartitionProduitsRequest } from '@crm/proto/dashboard';

@Controller()
export class RepartitionProduitsController {
  constructor(private readonly repartitionService: RepartitionProduitsService) {}

  @GrpcMethod('RepartitionProduitsService', 'GetRepartitionProduits')
  async getRepartitionProduits(data: GetRepartitionProduitsRequest) {
    return this.repartitionService.getRepartitionProduits({
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
