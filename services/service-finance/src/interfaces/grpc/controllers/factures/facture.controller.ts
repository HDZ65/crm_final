import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { FactureService } from '../../../../infrastructure/persistence/typeorm/repositories/factures/facture.service';

import type {
  CreateFactureRequest,
  GetFactureRequest,
  ListFacturesRequest,
  DeleteFactureRequest,
} from '@crm/proto/factures';

@Controller()
export class FactureController {
  constructor(private readonly factureService: FactureService) {}

  @GrpcMethod('FactureService', 'Create')
  async createFacture(data: CreateFactureRequest) {
    return this.factureService.create({
      organisationId: data.organisation_id,
      dateEmission: data.date_emission ? new Date(data.date_emission) : new Date(),
      statutId: data.statut_id,
      emissionFactureId: data.emission_facture_id,
      clientBaseId: data.client_base_id,
      contratId: data.contrat_id,
      clientPartenaireId: data.client_partenaire_id,
      adresseFacturationId: data.adresse_facturation_id,
      lignes: data.lignes?.map((l) => ({
        produitId: l.produit_id,
        quantite: l.quantite,
        prixUnitaire: l.prix_unitaire,
        description: l.description,
        tauxTVA: l.taux_tva,
      })),
    });
  }

  @GrpcMethod('FactureService', 'Get')
  async getFacture(data: GetFactureRequest) {
    return this.factureService.findById(data.id);
  }

  @GrpcMethod('FactureService', 'List')
  async listFactures(data: ListFacturesRequest) {
    const result = await this.factureService.findByOrganisation(
      data.organisation_id,
      {
        page: data.pagination?.page,
        limit: data.pagination?.limit,
      },
    );
    return result;
  }

  @GrpcMethod('FactureService', 'Delete')
  async deleteFacture(data: DeleteFactureRequest) {
    const success = await this.factureService.delete(data.id);
    return { success };
  }
}
