import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type { GetAlertesRequest, AlertesResponse } from '@proto/dashboard';

@Controller()
export class AlertesController {
  @GrpcMethod('AlertesService', 'GetAlertes')
  async getAlertes(_: GetAlertesRequest): Promise<AlertesResponse> {
    return {
      alertes: [],
      total: 0,
      nombre_critiques: 0,
      nombre_avertissements: 0,
      nombre_infos: 0,
    };
  }
}
