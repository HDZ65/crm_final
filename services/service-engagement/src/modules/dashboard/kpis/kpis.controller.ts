import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { KpisService } from './kpis.service';

import type { GetKpisRequest } from '@crm/proto/dashboard';

@Controller()
export class KpisController {
  constructor(private readonly kpisService: KpisService) {}

  @GrpcMethod('DashboardKpisService', 'GetKpis')
  async getKpis(data: GetKpisRequest) {
    return this.kpisService.getKpis({
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
