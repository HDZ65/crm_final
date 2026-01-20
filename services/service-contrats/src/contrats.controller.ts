import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import type {
  StatutContrat,
  CreateStatutContratRequest,
  UpdateStatutContratRequest,
  GetStatutContratRequest,
  GetStatutContratByCodeRequest,
  ListStatutContratRequest,
  ListStatutContratResponse,
  DeleteStatutContratRequest,
  Contrat,
  ContratWithDetails,
  CreateContratRequest,
  UpdateContratRequest,
  GetContratRequest,
  GetContratByReferenceRequest,
  ListContratRequest,
  ListContratResponse,
  DeleteContratRequest,
  LigneContrat,
  CreateLigneContratRequest,
  UpdateLigneContratRequest,
  GetLigneContratRequest,
  ListLigneContratByContratRequest,
  ListLigneContratResponse,
  DeleteLigneContratRequest,
  HistoriqueStatutContrat,
  CreateHistoriqueStatutContratRequest,
  GetHistoriqueStatutContratRequest,
  ListHistoriqueByContratRequest,
  ListHistoriqueStatutContratResponse,
  DeleteHistoriqueStatutContratRequest,
  OrchestrationRequest,
  OrchestrationResponse,
  OrchestrationHistory,
  GetOrchestrationHistoryRequest,
  ListOrchestrationHistoryResponse,
  DeleteResponse,
} from '@proto/contrats/contrats';

import { StatutContratService } from './modules/statut-contrat/statut-contrat.service';
import { ContratService } from './modules/contrat/contrat.service';
import { LigneContratService } from './modules/ligne-contrat/ligne-contrat.service';
import { HistoriqueStatutContratService } from './modules/historique-statut-contrat/historique-statut-contrat.service';
import { OrchestrationService } from './modules/orchestration/orchestration.service';

function toProtoDate(date: Date | null | undefined): string {
  return date ? date.toISOString() : '';
}

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
  async createStatutContrat(data: CreateStatutContratRequest): Promise<StatutContrat> {
    const entity = await this.statutContratService.create({
      code: data.code,
      nom: data.nom,
      description: data.description,
      ordreAffichage: data.ordreAffichage,
    });
    return this.mapStatutContrat(entity);
  }

  @GrpcMethod('StatutContratService', 'Update')
  async updateStatutContrat(data: UpdateStatutContratRequest): Promise<StatutContrat> {
    const entity = await this.statutContratService.update({
      id: data.id,
      code: data.code,
      nom: data.nom,
      description: data.description,
      ordreAffichage: data.ordreAffichage,
    });
    return this.mapStatutContrat(entity);
  }

  @GrpcMethod('StatutContratService', 'Get')
  async getStatutContrat(data: GetStatutContratRequest): Promise<StatutContrat> {
    const entity = await this.statutContratService.findById(data.id);
    return this.mapStatutContrat(entity);
  }

  @GrpcMethod('StatutContratService', 'GetByCode')
  async getStatutContratByCode(data: GetStatutContratByCodeRequest): Promise<StatutContrat> {
    const entity = await this.statutContratService.findByCode(data.code);
    return this.mapStatutContrat(entity);
  }

  @GrpcMethod('StatutContratService', 'List')
  async listStatutsContrat(data: ListStatutContratRequest): Promise<ListStatutContratResponse> {
    const result = await this.statutContratService.findAll(data.pagination);
    return {
      statuts: result.statuts.map((s) => this.mapStatutContrat(s)),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('StatutContratService', 'Delete')
  async deleteStatutContrat(data: DeleteStatutContratRequest): Promise<DeleteResponse> {
    const success = await this.statutContratService.delete(data.id);
    return { success };
  }

  private mapStatutContrat(entity: any): StatutContrat {
    return {
      id: entity.id,
      code: entity.code,
      nom: entity.nom,
      description: entity.description || '',
      ordreAffichage: entity.ordreAffichage || 0,
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  @GrpcMethod('ContratService', 'Create')
  async createContrat(data: CreateContratRequest): Promise<Contrat> {
    const entity = await this.contratService.create({
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
    return this.mapContrat(entity);
  }

  @GrpcMethod('ContratService', 'Update')
  async updateContrat(data: UpdateContratRequest): Promise<Contrat> {
    const entity = await this.contratService.update({
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
    return this.mapContrat(entity);
  }

  @GrpcMethod('ContratService', 'Get')
  async getContrat(data: GetContratRequest): Promise<Contrat> {
    const entity = await this.contratService.findById(data.id);
    return this.mapContrat(entity);
  }

  @GrpcMethod('ContratService', 'GetByReference')
  async getContratByReference(data: GetContratByReferenceRequest): Promise<Contrat> {
    const entity = await this.contratService.findByReference(data.organisationId, data.reference);
    return this.mapContrat(entity);
  }

  @GrpcMethod('ContratService', 'GetWithDetails')
  async getContratWithDetails(data: GetContratRequest): Promise<ContratWithDetails> {
    const entity = await this.contratService.findByIdWithDetails(data.id);
    return {
      contrat: this.mapContrat(entity),
      lignes: entity.lignes?.map((l) => this.mapLigneContrat(l)) || [],
      historique: entity.historique?.map((h) => this.mapHistoriqueStatut(h)) || [],
    };
  }

  @GrpcMethod('ContratService', 'List')
  async listContrats(data: ListContratRequest): Promise<ListContratResponse> {
    const result = await this.contratService.findAll(
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
    return {
      contrats: result.contrats.map((c) => this.mapContrat(c)),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('ContratService', 'Delete')
  async deleteContrat(data: DeleteContratRequest): Promise<DeleteResponse> {
    const success = await this.contratService.delete(data.id);
    return { success };
  }

  private mapContrat(entity: any): Contrat {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      reference: entity.reference,
      titre: entity.titre || '',
      description: entity.description || '',
      type: entity.type || '',
      statut: entity.statut,
      dateDebut: entity.dateDebut,
      dateFin: entity.dateFin || '',
      dateSignature: entity.dateSignature || '',
      montant: entity.montant ? parseFloat(entity.montant) : 0,
      devise: entity.devise,
      frequenceFacturation: entity.frequenceFacturation || '',
      documentUrl: entity.documentUrl || '',
      fournisseur: entity.fournisseur || '',
      clientId: entity.clientId,
      commercialId: entity.commercialId,
      societeId: entity.societeId || '',
      notes: entity.notes || '',
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  @GrpcMethod('LigneContratService', 'Create')
  async createLigneContrat(data: CreateLigneContratRequest): Promise<LigneContrat> {
    const entity = await this.ligneContratService.create({
      contratId: data.contratId,
      produitId: data.produitId,
      periodeFacturationId: data.periodeFacturationId,
      quantite: data.quantite,
      prixUnitaire: data.prixUnitaire,
    });
    return this.mapLigneContrat(entity);
  }

  @GrpcMethod('LigneContratService', 'Update')
  async updateLigneContrat(data: UpdateLigneContratRequest): Promise<LigneContrat> {
    const entity = await this.ligneContratService.update({
      id: data.id,
      produitId: data.produitId,
      periodeFacturationId: data.periodeFacturationId,
      quantite: data.quantite,
      prixUnitaire: data.prixUnitaire,
    });
    return this.mapLigneContrat(entity);
  }

  @GrpcMethod('LigneContratService', 'Get')
  async getLigneContrat(data: GetLigneContratRequest): Promise<LigneContrat> {
    const entity = await this.ligneContratService.findById(data.id);
    return this.mapLigneContrat(entity);
  }

  @GrpcMethod('LigneContratService', 'ListByContrat')
  async listLignesContrat(data: ListLigneContratByContratRequest): Promise<ListLigneContratResponse> {
    const result = await this.ligneContratService.findByContrat(data.contratId, data.pagination);
    return {
      lignes: result.lignes.map((l) => this.mapLigneContrat(l)),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('LigneContratService', 'Delete')
  async deleteLigneContrat(data: DeleteLigneContratRequest): Promise<DeleteResponse> {
    const success = await this.ligneContratService.delete(data.id);
    return { success };
  }

  private mapLigneContrat(entity: any): LigneContrat {
    return {
      id: entity.id,
      contratId: entity.contratId,
      produitId: entity.produitId,
      periodeFacturationId: entity.periodeFacturationId,
      quantite: entity.quantite,
      prixUnitaire: entity.prixUnitaire ? parseFloat(entity.prixUnitaire) : 0,
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  @GrpcMethod('HistoriqueStatutContratService', 'Create')
  async createHistoriqueStatut(data: CreateHistoriqueStatutContratRequest): Promise<HistoriqueStatutContrat> {
    const entity = await this.historiqueStatutService.create({
      contratId: data.contratId,
      ancienStatutId: data.ancienStatutId,
      nouveauStatutId: data.nouveauStatutId,
      dateChangement: data.dateChangement,
    });
    return this.mapHistoriqueStatut(entity);
  }

  @GrpcMethod('HistoriqueStatutContratService', 'Get')
  async getHistoriqueStatut(data: GetHistoriqueStatutContratRequest): Promise<HistoriqueStatutContrat> {
    const entity = await this.historiqueStatutService.findById(data.id);
    return this.mapHistoriqueStatut(entity);
  }

  @GrpcMethod('HistoriqueStatutContratService', 'ListByContrat')
  async listHistoriqueByContrat(data: ListHistoriqueByContratRequest): Promise<ListHistoriqueStatutContratResponse> {
    const result = await this.historiqueStatutService.findByContrat(data.contratId, data.pagination);
    return {
      historique: result.historique.map((h) => this.mapHistoriqueStatut(h)),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('HistoriqueStatutContratService', 'Delete')
  async deleteHistoriqueStatut(data: DeleteHistoriqueStatutContratRequest): Promise<DeleteResponse> {
    const success = await this.historiqueStatutService.delete(data.id);
    return { success };
  }

  private mapHistoriqueStatut(entity: any): HistoriqueStatutContrat {
    return {
      id: entity.id,
      contratId: entity.contratId,
      ancienStatutId: entity.ancienStatutId,
      nouveauStatutId: entity.nouveauStatutId,
      dateChangement: entity.dateChangement,
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  @GrpcMethod('ContractOrchestrationService', 'Activate')
  async activateContract(data: OrchestrationRequest): Promise<OrchestrationResponse> {
    const payload = data.payload ? JSON.parse(data.payload) : undefined;
    const history = await this.orchestrationService.activate(data.contractId, payload);
    return {
      success: history.status === 'success',
      message: history.status === 'success' ? 'Contract activated successfully' : history.errorMessage || '',
      historyId: history.id,
    };
  }

  @GrpcMethod('ContractOrchestrationService', 'Suspend')
  async suspendContract(data: OrchestrationRequest): Promise<OrchestrationResponse> {
    const payload = data.payload ? JSON.parse(data.payload) : undefined;
    const history = await this.orchestrationService.suspend(data.contractId, payload);
    return {
      success: history.status === 'success',
      message: history.status === 'success' ? 'Contract suspended successfully' : history.errorMessage || '',
      historyId: history.id,
    };
  }

  @GrpcMethod('ContractOrchestrationService', 'Terminate')
  async terminateContract(data: OrchestrationRequest): Promise<OrchestrationResponse> {
    const payload = data.payload ? JSON.parse(data.payload) : undefined;
    const history = await this.orchestrationService.terminate(data.contractId, payload);
    return {
      success: history.status === 'success',
      message: history.status === 'success' ? 'Contract terminated successfully' : history.errorMessage || '',
      historyId: history.id,
    };
  }

  @GrpcMethod('ContractOrchestrationService', 'PortIn')
  async portInContract(data: OrchestrationRequest): Promise<OrchestrationResponse> {
    const payload = data.payload ? JSON.parse(data.payload) : undefined;
    const history = await this.orchestrationService.portIn(data.contractId, payload);
    return {
      success: history.status === 'success',
      message: history.status === 'success' ? 'Contract port-in completed successfully' : history.errorMessage || '',
      historyId: history.id,
    };
  }

  @GrpcMethod('ContractOrchestrationService', 'GetHistory')
  async getOrchestrationHistory(data: GetOrchestrationHistoryRequest): Promise<ListOrchestrationHistoryResponse> {
    const result = await this.orchestrationService.getHistory(data.contractId, data.pagination);
    return {
      history: result.history.map((h) => this.mapOrchestrationHistory(h)),
      pagination: result.pagination,
    };
  }

  private mapOrchestrationHistory(entity: any): OrchestrationHistory {
    return {
      id: entity.id,
      contractId: entity.contractId,
      operation: entity.operation,
      status: entity.status,
      payload: entity.payload ? JSON.stringify(entity.payload) : '',
      responsePayload: entity.responsePayload ? JSON.stringify(entity.responsePayload) : '',
      errorMessage: entity.errorMessage || '',
      startedAt: toProtoDate(entity.startedAt),
      finishedAt: toProtoDate(entity.finishedAt),
      createdAt: toProtoDate(entity.createdAt),
    };
  }
}
