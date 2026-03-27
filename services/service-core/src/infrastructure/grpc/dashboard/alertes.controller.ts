import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type { AlertesResponse, GetAlertesRequest } from '@proto/dashboard';

@Controller()
export class AlertesController {
  @GrpcMethod('AlertesService', 'GetAlertes')
  async getAlertes(_: GetAlertesRequest): Promise<AlertesResponse> {
    return {
      alertes: [],
      total: 0,
      nombreCritiques: 0,
      nombreAvertissements: 0,
      nombreInfos: 0,
    };
  }
}
