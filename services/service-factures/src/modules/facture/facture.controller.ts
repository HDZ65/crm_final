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
      organisationId: data.organisationId,
      dateEmission: data.dateEmission ? new Date(data.dateEmission) : new Date(),
      statutId: data.statutId,
      emissionFactureId: data.emissionFactureId,
      clientBaseId: data.clientBaseId,
      contratId: data.contratId,
      clientPartenaireId: data.clientPartenaireId,
      adresseFacturationId: data.adresseFacturationId,
      lignes: data.lignes?.map((l) => ({
        produitId: l.produitId,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        description: l.description,
        tauxTVA: l.tauxTva,
      })),
    });
  }

  @GrpcMethod('FactureService', 'Update')
  async updateFacture(data: UpdateFactureRequest) {
    return this.factureService.update({
      id: data.id,
      dateEmission: data.dateEmission ? new Date(data.dateEmission) : undefined,
      statutId: data.statutId,
      emissionFactureId: data.emissionFactureId,
      adresseFacturationId: data.adresseFacturationId,
    });
  }

  @GrpcMethod('FactureService', 'Get')
  async getFacture(data: GetFactureRequest) {
    return this.factureService.findById(data.id);
  }

  @GrpcMethod('FactureService', 'GetByNumero')
  async getFactureByNumero(data: GetFactureByNumeroRequest) {
    return this.factureService.findByNumero(data.organisationId, data.numero);
  }

  @GrpcMethod('FactureService', 'List')
  async listFactures(data: ListFacturesRequest) {
    return this.factureService.findAll({
      organisationId: data.organisationId,
      clientBaseId: data.clientBaseId,
      contratId: data.contratId,
      statutId: data.statutId,
      dateFrom: data.dateFrom ? new Date(data.dateFrom) : undefined,
      dateTo: data.dateTo ? new Date(data.dateTo) : undefined,
      pagination: {
        page: data.pagination?.page,
        limit: data.pagination?.limit,
        sortBy: data.pagination?.sortBy,
        sortOrder: data.pagination?.sortOrder,
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
