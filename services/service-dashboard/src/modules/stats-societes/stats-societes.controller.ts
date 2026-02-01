import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { StatsSocietesService } from './stats-societes.service';

import type { GetStatsSocietesRequest } from '@crm/proto/dashboard';

@Controller()
export class StatsSocietesController {
  constructor(private readonly statsService: StatsSocietesService) {}

  @GrpcMethod('StatsSocietesService', 'GetStatsSocietes')
  async getStatsSocietes(data: GetStatsSocietesRequest) {
    return this.statsService.getStatsSocietes({
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
