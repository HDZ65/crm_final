import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ContratService, type EnrichedContrat } from '../../persistence/typeorm/repositories/contrats/contrat.service';
import type {
  CreateContratRequest,
  UpdateContratRequest,
  GetContratRequest,
  GetContratByReferenceRequest,
  ListContratRequest,
  DeleteContratRequest,
} from '@proto/contrats';

/**
 * Map an EnrichedContrat entity to proto-compatible response shape.
 * Adds jour_prelevement + prochaine_date_prelevement from calendar enrichment.
 */
function mapContratToResponse(entity: EnrichedContrat) {
  return {
    id: entity.id,
    organisation_id: entity.organisationId,
    reference: entity.reference,
    titre: entity.titre,
    description: entity.description,
    type: entity.type,
    statut: entity.statut,
    date_debut: entity.dateDebut,
    date_fin: entity.dateFin,
    date_signature: entity.dateSignature,
    montant: entity.montant,
    devise: entity.devise,
    frequence_facturation: entity.frequenceFacturation,
    document_url: entity.documentUrl,
    fournisseur: entity.fournisseur,
    client_id: entity.clientId,
    commercial_id: entity.commercialId,
    societe_id: entity.societeId,
    notes: entity.notes,
    created_at: entity.createdAt?.toISOString?.() ?? entity.createdAt,
    updated_at: entity.updatedAt?.toISOString?.() ?? entity.updatedAt,
    jour_prelevement: entity.jour_prelevement ?? null,
    prochaine_date_prelevement: entity.prochaine_date_prelevement ?? null,
  };
}

@Controller()
export class ContratController {
  private readonly logger = new Logger(ContratController.name);

  constructor(
    private readonly contratService: ContratService,
  ) {}

  @GrpcMethod('ContratService', 'Create')
  async createContrat(data: CreateContratRequest) {
    const result = await this.contratService.create({
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
      jourPrelevement: data.jour_prelevement ?? undefined,
    });
    return mapContratToResponse(result);
  }

  @GrpcMethod('ContratService', 'Update')
  async updateContrat(data: UpdateContratRequest) {
    const result = await this.contratService.update({
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
      jourPrelevement: data.jour_prelevement ?? undefined,
    });
    return mapContratToResponse(result);
  }

  @GrpcMethod('ContratService', 'Get')
  async getContrat(data: GetContratRequest) {
    const result = await this.contratService.findById(data.id);
    return mapContratToResponse(result);
  }

  @GrpcMethod('ContratService', 'GetByReference')
  async getContratByReference(data: GetContratByReferenceRequest) {
    const result = await this.contratService.findByReference(data.organisation_id, data.reference);
    return mapContratToResponse(result);
  }

  @GrpcMethod('ContratService', 'GetWithDetails')
  async getContratWithDetails(data: GetContratRequest) {
    const entity = await this.contratService.findByIdWithDetails(data.id);
    return {
      contrat: mapContratToResponse(entity),
      lignes: entity.lignes ?? [],
      historique: entity.historique ?? [],
    };
  }

  @GrpcMethod('ContratService', 'List')
  async listContrats(data: ListContratRequest) {
    const result = await this.contratService.findAll(
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
    return {
      contrats: result.contrats.map(mapContratToResponse),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('ContratService', 'Delete')
  async deleteContrat(data: DeleteContratRequest) {
    const success = await this.contratService.delete(data.id);
    return { success };
  }
}
