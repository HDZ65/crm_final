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
      produitId: data.produit_id,
      quantite: data.quantite,
      prixUnitaire: data.prix_unitaire,
      description: data.description,
      tauxTVA: data.taux_tva,
      ordreAffichage: data.ordre_affichage,
    });
  }

  @GrpcMethod('LigneFactureService', 'Get')
  async getLigne(data: GetLigneFactureRequest) {
    return this.ligneService.findById(data.id);
  }

  @GrpcMethod('LigneFactureService', 'List')
  async listLignes(data: ListLignesFactureRequest) {
    return this.ligneService.findByFacture(data.facture_id, {
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
