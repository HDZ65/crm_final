import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AlertesService } from './alertes.service';

import type { GetAlertesRequest } from '@crm/proto/dashboard';

@Controller()
export class AlertesController {
  constructor(private readonly alertesService: AlertesService) {}

  @GrpcMethod('AlertesService', 'GetAlertes')
  async getAlertes(data: GetAlertesRequest) {
    return this.alertesService.getAlertes({
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
