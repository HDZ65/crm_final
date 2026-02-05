import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { randomUUID } from 'crypto';
import { NatsService } from '@crm/nats-utils';
import { ContractSignedEvent } from '@crm/proto/events/contract';
import { ContratService } from '../../../../infrastructure/persistence/typeorm/repositories/contrats/contrat.service';

import type {
  CreateContratRequest,
  UpdateContratRequest,
  GetContratRequest,
  GetContratByReferenceRequest,
  ListContratRequest,
  DeleteContratRequest,
} from '@crm/proto/contrats';

const CONTRACT_SIGNED_SUBJECT = 'crm.events.contract.signed';

@Controller()
export class ContratController {
  private readonly logger = new Logger(ContratController.name);

  constructor(
    private readonly contratService: ContratService,
    private readonly natsService: NatsService,
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
    const contratBeforeUpdate = await this.contratService.findById(data.id);
    const wasNotSignedBefore = contratBeforeUpdate.statut !== 'SIGNE';

    const contrat = await this.contratService.update({
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

    const contractJustSigned = wasNotSignedBefore && contrat.statut === 'SIGNE' && contrat.dateSignature;
    if (contractJustSigned) {
      const signatureDate = new Date(contrat.dateSignature!);
      const event: ContractSignedEvent = {
        event_id: randomUUID(),
        timestamp: Date.now(),
        correlation_id: '',
        contrat_id: contrat.id,
        client_id: contrat.clientId,
        produit_id: '',
        montant_total: contrat.montant ?? 0,
        date_signature: {
          seconds: Math.floor(signatureDate.getTime() / 1000),
          nanos: 0,
        },
      };

      await this.natsService.publishProto(CONTRACT_SIGNED_SUBJECT, event, ContractSignedEvent);
      this.logger.log(`Published contract.signed event for contrat ${contrat.id}`);
    }

    return contrat;
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
