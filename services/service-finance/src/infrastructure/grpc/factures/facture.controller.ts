import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { FactureService } from '../../persistence/typeorm/repositories/factures/facture.service';
import {
  CreateFactureRequest,
  CreateAvoirRequest,
  DeleteFactureRequest,
  GetFactureRequest,
  ListFacturesRequest,
  ListAvoirsByFactureRequest,
} from '@proto/factures';

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

  @GrpcMethod('FactureService', 'CreateAvoir')
  async createAvoir(data: CreateAvoirRequest) {
    return this.factureService.createAvoir({
      organisationId: data.organisation_id,
      factureOrigineId: data.facture_origine_id,
      statutId: data.statut_id,
      emissionFactureId: data.emission_facture_id,
      clientBaseId: data.client_base_id,
      clientPartenaireId: data.client_partenaire_id,
      adresseFacturationId: data.adresse_facturation_id,
      motifAvoir: data.motif_avoir,
      lignes: data.lignes?.map((l) => ({
        produitId: l.produit_id,
        quantite: l.quantite,
        prixUnitaire: l.prix_unitaire,
        description: l.description,
        tauxTVA: l.taux_tva,
      })) || [],
    });
  }

  @GrpcMethod('FactureService', 'ListAvoirsByFacture')
  async listAvoirsByFacture(data: ListAvoirsByFactureRequest) {
    const result = await this.factureService.listAvoirsByFacture(
      data.facture_origine_id,
      {
        page: data.pagination?.page,
        limit: data.pagination?.limit,
      },
    );
    return result;
  }
}
