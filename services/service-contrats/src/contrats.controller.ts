import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import type {
  CreateStatutContratRequest,
  UpdateStatutContratRequest,
  GetStatutContratRequest,
  GetStatutContratByCodeRequest,
  ListStatutContratRequest,
  DeleteStatutContratRequest,
  CreateContratRequest,
  UpdateContratRequest,
  GetContratRequest,
  GetContratByReferenceRequest,
  ListContratRequest,
  DeleteContratRequest,
  CreateLigneContratRequest,
  UpdateLigneContratRequest,
  GetLigneContratRequest,
  ListLigneContratByContratRequest,
  DeleteLigneContratRequest,
  CreateHistoriqueStatutContratRequest,
  GetHistoriqueStatutContratRequest,
  ListHistoriqueByContratRequest,
  DeleteHistoriqueStatutContratRequest,
  OrchestrationRequest,
  GetOrchestrationHistoryRequest,
} from '@proto/contrats/contrats';

import { StatutContratService } from './modules/statut-contrat/statut-contrat.service';
import { ContratService } from './modules/contrat/contrat.service';
import { LigneContratService } from './modules/ligne-contrat/ligne-contrat.service';
import { HistoriqueStatutContratService } from './modules/historique-statut-contrat/historique-statut-contrat.service';
import { OrchestrationService } from './modules/orchestration/orchestration.service';

@Controller()
export class ContratsController {
  constructor(
    private readonly statutContratService: StatutContratService,
    private readonly contratService: ContratService,
    private readonly ligneContratService: LigneContratService,
    private readonly historiqueStatutService: HistoriqueStatutContratService,
    private readonly orchestrationService: OrchestrationService,
  ) {}

  @GrpcMethod('StatutContratService', 'Create')
  async createStatutContrat(data: CreateStatutContratRequest) {
    return this.statutContratService.create({
      code: data.code,
      nom: data.nom,
      description: data.description,
      ordreAffichage: data.ordreAffichage,
    });
  }

  @GrpcMethod('StatutContratService', 'Update')
  async updateStatutContrat(data: UpdateStatutContratRequest) {
    return this.statutContratService.update({
      id: data.id,
      code: data.code,
      nom: data.nom,
      description: data.description,
      ordreAffichage: data.ordreAffichage,
    });
  }

  @GrpcMethod('StatutContratService', 'Get')
  async getStatutContrat(data: GetStatutContratRequest) {
    return this.statutContratService.findById(data.id);
  }

  @GrpcMethod('StatutContratService', 'GetByCode')
  async getStatutContratByCode(data: GetStatutContratByCodeRequest) {
    return this.statutContratService.findByCode(data.code);
  }

  @GrpcMethod('StatutContratService', 'List')
  async listStatutsContrat(data: ListStatutContratRequest) {
    return this.statutContratService.findAll(data.pagination);
  }

  @GrpcMethod('StatutContratService', 'Delete')
  async deleteStatutContrat(data: DeleteStatutContratRequest) {
    const success = await this.statutContratService.delete(data.id);
    return { success };
  }

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

  @GrpcMethod('LigneContratService', 'Create')
  async createLigneContrat(data: CreateLigneContratRequest) {
    return this.ligneContratService.create({
      contratId: data.contratId,
      produitId: data.produitId,
      periodeFacturationId: data.periodeFacturationId,
      quantite: data.quantite,
      prixUnitaire: data.prixUnitaire,
    });
  }

  @GrpcMethod('LigneContratService', 'Update')
  async updateLigneContrat(data: UpdateLigneContratRequest) {
    return this.ligneContratService.update({
      id: data.id,
      produitId: data.produitId,
      periodeFacturationId: data.periodeFacturationId,
      quantite: data.quantite,
      prixUnitaire: data.prixUnitaire,
    });
  }

  @GrpcMethod('LigneContratService', 'Get')
  async getLigneContrat(data: GetLigneContratRequest) {
    return this.ligneContratService.findById(data.id);
  }

  @GrpcMethod('LigneContratService', 'ListByContrat')
  async listLignesContrat(data: ListLigneContratByContratRequest) {
    return this.ligneContratService.findByContrat(data.contratId, data.pagination);
  }

  @GrpcMethod('LigneContratService', 'Delete')
  async deleteLigneContrat(data: DeleteLigneContratRequest) {
    const success = await this.ligneContratService.delete(data.id);
    return { success };
  }

  @GrpcMethod('HistoriqueStatutContratService', 'Create')
  async createHistoriqueStatut(data: CreateHistoriqueStatutContratRequest) {
    return this.historiqueStatutService.create({
      contratId: data.contratId,
      ancienStatutId: data.ancienStatutId,
      nouveauStatutId: data.nouveauStatutId,
      dateChangement: data.dateChangement,
    });
  }

  @GrpcMethod('HistoriqueStatutContratService', 'Get')
  async getHistoriqueStatut(data: GetHistoriqueStatutContratRequest) {
    return this.historiqueStatutService.findById(data.id);
  }

  @GrpcMethod('HistoriqueStatutContratService', 'ListByContrat')
  async listHistoriqueByContrat(data: ListHistoriqueByContratRequest) {
    return this.historiqueStatutService.findByContrat(data.contratId, data.pagination);
  }

  @GrpcMethod('HistoriqueStatutContratService', 'Delete')
  async deleteHistoriqueStatut(data: DeleteHistoriqueStatutContratRequest) {
    const success = await this.historiqueStatutService.delete(data.id);
    return { success };
  }

  @GrpcMethod('ContractOrchestrationService', 'Activate')
  async activateContract(data: OrchestrationRequest) {
    const payload = data.payload ? JSON.parse(data.payload) : undefined;
    const history = await this.orchestrationService.activate(data.contractId, payload);
    return {
      success: history.status === 'success',
      message: history.status === 'success' ? 'Contract activated successfully' : history.errorMessage ?? '',
      historyId: history.id,
    };
  }

  @GrpcMethod('ContractOrchestrationService', 'Suspend')
  async suspendContract(data: OrchestrationRequest) {
    const payload = data.payload ? JSON.parse(data.payload) : undefined;
    const history = await this.orchestrationService.suspend(data.contractId, payload);
    return {
      success: history.status === 'success',
      message: history.status === 'success' ? 'Contract suspended successfully' : history.errorMessage ?? '',
      historyId: history.id,
    };
  }

  @GrpcMethod('ContractOrchestrationService', 'Terminate')
  async terminateContract(data: OrchestrationRequest) {
    const payload = data.payload ? JSON.parse(data.payload) : undefined;
    const history = await this.orchestrationService.terminate(data.contractId, payload);
    return {
      success: history.status === 'success',
      message: history.status === 'success' ? 'Contract terminated successfully' : history.errorMessage ?? '',
      historyId: history.id,
    };
  }

  @GrpcMethod('ContractOrchestrationService', 'PortIn')
  async portInContract(data: OrchestrationRequest) {
    const payload = data.payload ? JSON.parse(data.payload) : undefined;
    const history = await this.orchestrationService.portIn(data.contractId, payload);
    return {
      success: history.status === 'success',
      message: history.status === 'success' ? 'Contract port-in completed successfully' : history.errorMessage ?? '',
      historyId: history.id,
    };
  }

  @GrpcMethod('ContractOrchestrationService', 'GetHistory')
  async getOrchestrationHistory(data: GetOrchestrationHistoryRequest) {
    const result = await this.orchestrationService.getHistory(data.contractId, data.pagination);
    return {
      history: result.history.map((h) => ({
        ...h,
        payload: h.payload ? JSON.stringify(h.payload) : '',
        responsePayload: h.responsePayload ? JSON.stringify(h.responsePayload) : '',
      })),
      pagination: result.pagination,
    };
  }
}
