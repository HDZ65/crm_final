import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { EvolutionCaService } from './evolution-ca.service';

import type { GetEvolutionCaRequest } from '@crm/proto/dashboard';

@Controller()
export class EvolutionCaController {
  constructor(private readonly evolutionCaService: EvolutionCaService) {}

  @GrpcMethod('EvolutionCaService', 'GetEvolutionCa')
  async getEvolutionCa(data: GetEvolutionCaRequest) {
    return this.evolutionCaService.getEvolutionCa({
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
