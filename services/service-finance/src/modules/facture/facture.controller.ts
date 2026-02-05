import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { FactureService } from './facture.service';

import type {
  CreateFactureRequest,
  UpdateFactureRequest,
  GetFactureRequest,
  GetFactureByNumeroRequest,
  ListFacturesRequest,
  DeleteFactureRequest,
  ValidateFactureRequest,
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

  @GrpcMethod('FactureService', 'Update')
  async updateFacture(data: UpdateFactureRequest) {
    return this.factureService.update({
      id: data.id,
      dateEmission: data.date_emission ? new Date(data.date_emission) : undefined,
      statutId: data.statut_id,
      emissionFactureId: data.emission_facture_id,
      adresseFacturationId: data.adresse_facturation_id,
    });
  }

  @GrpcMethod('FactureService', 'Get')
  async getFacture(data: GetFactureRequest) {
    return this.factureService.findById(data.id);
  }

  @GrpcMethod('FactureService', 'GetByNumero')
  async getFactureByNumero(data: GetFactureByNumeroRequest) {
    return this.factureService.findByNumero(data.organisation_id, data.numero);
  }

  @GrpcMethod('FactureService', 'List')
  async listFactures(data: ListFacturesRequest) {
    return this.factureService.findAll({
      organisationId: data.organisation_id,
      clientBaseId: data.client_base_id,
      contratId: data.contrat_id,
      statutId: data.statut_id,
      dateFrom: data.date_from ? new Date(data.date_from) : undefined,
      dateTo: data.date_to ? new Date(data.date_to) : undefined,
      pagination: {
        page: data.pagination?.page,
        limit: data.pagination?.limit,
        sort_by: data.pagination?.sort_by,
        sort_order: data.pagination?.sort_order,
      },
    });
  }

  @GrpcMethod('FactureService', 'Delete')
  async deleteFacture(data: DeleteFactureRequest) {
    const success = await this.factureService.delete(data.id);
    return { success };
  }

  @GrpcMethod('FactureService', 'Validate')
  async validateFacture(data: ValidateFactureRequest) {
    return this.factureService.validate(data.id);
  }
}
