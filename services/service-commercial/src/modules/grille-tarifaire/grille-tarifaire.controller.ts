import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GrilleTarifaireService } from './grille-tarifaire.service';

import type {
  CreateGrilleTarifaireRequest,
  UpdateGrilleTarifaireRequest,
  GetGrilleTarifaireRequest,
  GetGrilleTarifaireActiveRequest,
  ListGrillesTarifairesRequest,
  DeleteGrilleTarifaireRequest,
  SetGrilleParDefautRequest,
} from '@crm/proto/products';

@Controller()
export class GrilleTarifaireController {
  constructor(private readonly grilleService: GrilleTarifaireService) {}

  @GrpcMethod('GrilleTarifaireService', 'Create')
  async create(data: CreateGrilleTarifaireRequest) {
    return this.grilleService.create(data);
  }

  @GrpcMethod('GrilleTarifaireService', 'Update')
  async update(data: UpdateGrilleTarifaireRequest) {
    return this.grilleService.update(data);
  }

  @GrpcMethod('GrilleTarifaireService', 'Get')
  async get(data: GetGrilleTarifaireRequest) {
    return this.grilleService.findById(data);
  }

  @GrpcMethod('GrilleTarifaireService', 'GetActive')
  async getActive(data: GetGrilleTarifaireActiveRequest) {
    return this.grilleService.findActive(data);
  }

  @GrpcMethod('GrilleTarifaireService', 'List')
  async list(data: ListGrillesTarifairesRequest) {
    return this.grilleService.findAll(data);
  }

  @GrpcMethod('GrilleTarifaireService', 'Delete')
  async delete(data: DeleteGrilleTarifaireRequest) {
    const success = await this.grilleService.delete(data);
    return { success };
  }

  @GrpcMethod('GrilleTarifaireService', 'SetParDefaut')
  async setParDefaut(data: SetGrilleParDefautRequest) {
    return this.grilleService.setParDefaut(data);
  }
}
