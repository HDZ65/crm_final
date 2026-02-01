import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { LigneFactureService } from './ligne-facture.service';

import type {
  CreateLigneFactureRequest,
  UpdateLigneFactureRequest,
  GetLigneFactureRequest,
  ListLignesFactureRequest,
  DeleteLigneFactureRequest,
} from '@crm/proto/factures';

@Controller()
export class LigneFactureController {
  constructor(private readonly ligneService: LigneFactureService) {}

  @GrpcMethod('LigneFactureService', 'Create')
  async createLigne(data: CreateLigneFactureRequest) {
    return this.ligneService.create(data);
  }

  @GrpcMethod('LigneFactureService', 'Update')
  async updateLigne(data: UpdateLigneFactureRequest) {
    return this.ligneService.update({
      id: data.id,
      produitId: data.produitId,
      quantite: data.quantite,
      prixUnitaire: data.prixUnitaire,
      description: data.description,
      tauxTVA: data.tauxTva,
      ordreAffichage: data.ordreAffichage,
    });
  }

  @GrpcMethod('LigneFactureService', 'Get')
  async getLigne(data: GetLigneFactureRequest) {
    return this.ligneService.findById(data.id);
  }

  @GrpcMethod('LigneFactureService', 'List')
  async listLignes(data: ListLignesFactureRequest) {
    return this.ligneService.findByFacture(data.factureId, {
      page: data.pagination?.page,
      limit: data.pagination?.limit,
    });
  }

  @GrpcMethod('LigneFactureService', 'Delete')
  async deleteLigne(data: DeleteLigneFactureRequest) {
    const success = await this.ligneService.delete(data.id);
    return { success };
  }
}
