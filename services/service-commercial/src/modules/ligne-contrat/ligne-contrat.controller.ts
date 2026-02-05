import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { LigneContratService } from './ligne-contrat.service';

import type {
  CreateLigneContratRequest,
  UpdateLigneContratRequest,
  GetLigneContratRequest,
  ListLigneContratByContratRequest,
  DeleteLigneContratRequest,
} from '@crm/proto/contrats';

@Controller()
export class LigneContratController {
  constructor(private readonly ligneContratService: LigneContratService) {}

  @GrpcMethod('LigneContratService', 'Create')
  async createLigneContrat(data: CreateLigneContratRequest) {
    return this.ligneContratService.create({
      contratId: data.contrat_id,
      produitId: data.produit_id,
      periodeFacturationId: data.periode_facturation_id,
      quantite: data.quantite,
      prixUnitaire: data.prix_unitaire,
    });
  }

  @GrpcMethod('LigneContratService', 'Update')
  async updateLigneContrat(data: UpdateLigneContratRequest) {
    return this.ligneContratService.update({
      id: data.id,
      produitId: data.produit_id,
      periodeFacturationId: data.periode_facturation_id,
      quantite: data.quantite,
      prixUnitaire: data.prix_unitaire,
    });
  }

  @GrpcMethod('LigneContratService', 'Get')
  async getLigneContrat(data: GetLigneContratRequest) {
    return this.ligneContratService.findById(data.id);
  }

  @GrpcMethod('LigneContratService', 'ListByContrat')
  async listLignesContrat(data: ListLigneContratByContratRequest) {
    return this.ligneContratService.findByContrat(data.contrat_id, data.pagination);
  }

  @GrpcMethod('LigneContratService', 'Delete')
  async deleteLigneContrat(data: DeleteLigneContratRequest) {
    const success = await this.ligneContratService.delete(data.id);
    return { success };
  }
}
