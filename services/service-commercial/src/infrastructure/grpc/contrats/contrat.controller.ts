import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ContratService } from '../../persistence/typeorm/repositories/contrats/contrat.service';
import type {
  CreateContratRequest,
  UpdateContratRequest,
  GetContratRequest,
  GetContratByReferenceRequest,
  ListContratRequest,
  DeleteContratRequest,
} from '@proto/contrats';

@Controller()
export class ContratController {
  private readonly logger = new Logger(ContratController.name);

  constructor(
    private readonly contratService: ContratService,
  ) {}

  @GrpcMethod('ContratService', 'Create')
  async createContrat(data: CreateContratRequest) {
    return this.contratService.create({
      organisationId: data.organisation_id,
      reference: data.reference,
      titre: data.titre,
      description: data.description,
      type: data.type,
      statut: data.statut,
      dateDebut: data.date_debut,
      dateFin: data.date_fin,
      dateSignature: data.date_signature,
      montant: data.montant,
      devise: data.devise,
      frequenceFacturation: data.frequence_facturation,
      documentUrl: data.document_url,
      fournisseur: data.fournisseur,
      clientId: data.client_id,
      commercialId: data.commercial_id,
      societeId: data.societe_id,
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
      dateDebut: data.date_debut,
      dateFin: data.date_fin,
      dateSignature: data.date_signature,
      montant: data.montant,
      devise: data.devise,
      frequenceFacturation: data.frequence_facturation,
      documentUrl: data.document_url,
      fournisseur: data.fournisseur,
      clientId: data.client_id,
      commercialId: data.commercial_id,
      societeId: data.societe_id,
      notes: data.notes,
    });
  }

  @GrpcMethod('ContratService', 'Get')
  async getContrat(data: GetContratRequest) {
    return this.contratService.findById(data.id);
  }

  @GrpcMethod('ContratService', 'GetByReference')
  async getContratByReference(data: GetContratByReferenceRequest) {
    return this.contratService.findByReference(data.organisation_id, data.reference);
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
        organisationId: data.organisation_id,
        clientId: data.client_id,
        commercialId: data.commercial_id,
        societeId: data.societe_id,
        statut: data.statut,
        search: data.search,
      },
      {
        page: data.pagination?.page,
        limit: data.pagination?.limit,
        sortBy: data.pagination?.sort_by,
        sortOrder: data.pagination?.sort_order,
      },
    );
  }

  @GrpcMethod('ContratService', 'Delete')
  async deleteContrat(data: DeleteContratRequest) {
    const success = await this.contratService.delete(data.id);
    return { success };
  }
}
