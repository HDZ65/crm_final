import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';
import { NatsService } from '@crm/nats-utils';
import { ContractSignedEvent } from '@crm/proto/events/contract';
import { ContratService } from './contrat.service';

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
    const contratBeforeUpdate = await this.contratService.findById(data.id);
    const wasNotSignedBefore = contratBeforeUpdate.statut !== 'SIGNE';

    const contrat = await this.contratService.update({
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

    const contractJustSigned = wasNotSignedBefore && contrat.statut === 'SIGNE' && contrat.dateSignature;
    if (contractJustSigned) {
      const signatureDate = new Date(contrat.dateSignature!);
      const event: ContractSignedEvent = {
        eventId: uuidv4(),
        timestamp: Date.now(),
        correlationId: '',
        contratId: contrat.id,
        clientId: contrat.clientId,
        produitId: '',
        montantTotal: contrat.montant ?? 0,
        dateSignature: {
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
