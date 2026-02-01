import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ContratService } from './contrat.service';

import type {
  CreateContratRequest,
  UpdateContratRequest,
  GetContratRequest,
  GetContratByReferenceRequest,
  ListContratRequest,
  DeleteContratRequest,
} from '@crm/proto/contrats';

@Controller()
export class ContratController {
  constructor(private readonly contratService: ContratService) {}

  @GrpcMethod('ContratService', 'Create')
  async createContrat(data: CreateContratRequest) {
    return this.contratService.create({
      organisationId: data.organisationId,
      reference: data.reference,
      titre: data.titre,
      description: data.description,
      type: data.type,
      statut: data.statut,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      dateSignature: data.dateSignature,
      montant: data.montant,
      devise: data.devise,
      frequenceFacturation: data.frequenceFacturation,
      documentUrl: data.documentUrl,
      fournisseur: data.fournisseur,
      clientId: data.clientId,
      commercialId: data.commercialId,
      societeId: data.societeId,
      notes: data.notes,
    });
  }

  @GrpcMethod('ContratService', 'Update')
  async updateContrat(data: UpdateContratRequest) {
    return this.contratService.update({
      id: data.id,
      reference: data.reference,
      titre: data.titre,
      description: data.description,
      type: data.type,
      statut: data.statut,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      dateSignature: data.dateSignature,
      montant: data.montant,
      devise: data.devise,
      frequenceFacturation: data.frequenceFacturation,
      documentUrl: data.documentUrl,
      fournisseur: data.fournisseur,
      clientId: data.clientId,
      commercialId: data.commercialId,
      societeId: data.societeId,
      notes: data.notes,
    });
  }

  @GrpcMethod('ContratService', 'Get')
  async getContrat(data: GetContratRequest) {
    return this.contratService.findById(data.id);
  }

  @GrpcMethod('ContratService', 'GetByReference')
  async getContratByReference(data: GetContratByReferenceRequest) {
    return this.contratService.findByReference(data.organisationId, data.reference);
  }

  @GrpcMethod('ContratService', 'GetWithDetails')
  async getContratWithDetails(data: GetContratRequest) {
    const entity = await this.contratService.findByIdWithDetails(data.id);
    return {
      contrat: entity,
      lignes: entity.lignes ?? [],
      historique: entity.historique ?? [],
    };
  }

  @GrpcMethod('ContratService', 'List')
  async listContrats(data: ListContratRequest) {
    return this.contratService.findAll(
      {
        organisationId: data.organisationId,
        clientId: data.clientId,
        commercialId: data.commercialId,
        societeId: data.societeId,
        statut: data.statut,
        search: data.search,
      },
      {
        page: data.pagination?.page,
        limit: data.pagination?.limit,
        sortBy: data.pagination?.sortBy,
        sortOrder: data.pagination?.sortOrder,
      },
    );
  }

  @GrpcMethod('ContratService', 'Delete')
  async deleteContrat(data: DeleteContratRequest) {
    const success = await this.contratService.delete(data.id);
    return { success };
  }
}
