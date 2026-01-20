import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import { RegleRelanceService } from './modules/regle-relance/regle-relance.service';
import { HistoriqueRelanceService } from './modules/historique-relance/historique-relance.service';
import { RelanceEngineService, RelanceEventData } from './modules/engine/relance-engine.service';

import {
  RegleRelanceEntity,
  RelanceDeclencheur,
  RelanceActionType,
  Priorite,
} from './modules/regle-relance/entities/regle-relance.entity';
import {
  HistoriqueRelanceEntity,
  RelanceResultat,
} from './modules/historique-relance/entities/historique-relance.entity';

import type {
  CreateRegleRelanceRequest,
  UpdateRegleRelanceRequest,
  GetRegleRelanceRequest,
  ListReglesRelanceRequest,
  ListReglesRelanceResponse,
  DeleteRegleRelanceRequest,
  DeleteRegleRelanceResponse,
  ActivateRegleRequest,
  DeactivateRegleRequest,
  RegleRelance,
  CreateHistoriqueRelanceRequest,
  GetHistoriqueRelanceRequest,
  ListHistoriquesRelanceRequest,
  ListHistoriquesRelanceResponse,
  DeleteHistoriqueRelanceRequest,
  DeleteHistoriqueRelanceResponse,
  ExistsForTodayRequest,
  ExistsForTodayResponse,
  HistoriqueRelance,
  ExecuteRelancesRequest,
  ExecuteRelancesResponse,
  ExecuteRegleRequest,
  ExecuteRegleResponse,
  ProcessEventRequest,
  ProcessEventResponse,
  GetStatistiquesRequest,
  GetStatistiquesResponse,
  RelanceDeclencheur as ProtoDeclencheur,
  RelanceActionType as ProtoActionType,
  Priorite as ProtoPriorite,
  RelanceResultat as ProtoResultat,
} from '@proto/relance/relance';

// ===== HELPER FUNCTIONS =====

function declencheurToProto(d: RelanceDeclencheur): number {
  const map: Record<RelanceDeclencheur, number> = {
    [RelanceDeclencheur.IMPAYE]: 1,
    [RelanceDeclencheur.CONTRAT_BIENTOT_EXPIRE]: 2,
    [RelanceDeclencheur.CONTRAT_EXPIRE]: 3,
    [RelanceDeclencheur.NOUVEAU_CLIENT]: 4,
    [RelanceDeclencheur.INACTIVITE_CLIENT]: 5,
  };
  return map[d] || 0;
}

function protoToDeclencheur(p: number): RelanceDeclencheur {
  const map: Record<number, RelanceDeclencheur> = {
    1: RelanceDeclencheur.IMPAYE,
    2: RelanceDeclencheur.CONTRAT_BIENTOT_EXPIRE,
    3: RelanceDeclencheur.CONTRAT_EXPIRE,
    4: RelanceDeclencheur.NOUVEAU_CLIENT,
    5: RelanceDeclencheur.INACTIVITE_CLIENT,
  };
  return map[p] || RelanceDeclencheur.IMPAYE;
}

function actionTypeToProto(a: RelanceActionType): number {
  const map: Record<RelanceActionType, number> = {
    [RelanceActionType.CREER_TACHE]: 1,
    [RelanceActionType.ENVOYER_EMAIL]: 2,
    [RelanceActionType.NOTIFICATION]: 3,
    [RelanceActionType.TACHE_ET_EMAIL]: 4,
  };
  return map[a] || 0;
}

function protoToActionType(p: number): RelanceActionType {
  const map: Record<number, RelanceActionType> = {
    1: RelanceActionType.CREER_TACHE,
    2: RelanceActionType.ENVOYER_EMAIL,
    3: RelanceActionType.NOTIFICATION,
    4: RelanceActionType.TACHE_ET_EMAIL,
  };
  return map[p] || RelanceActionType.CREER_TACHE;
}

function prioriteToProto(p: Priorite): number {
  const map: Record<Priorite, number> = {
    [Priorite.HAUTE]: 1,
    [Priorite.MOYENNE]: 2,
    [Priorite.BASSE]: 3,
  };
  return map[p] || 2;
}

function protoToPriorite(p: number): Priorite {
  const map: Record<number, Priorite> = {
    1: Priorite.HAUTE,
    2: Priorite.MOYENNE,
    3: Priorite.BASSE,
  };
  return map[p] || Priorite.MOYENNE;
}

function resultatToProto(r: RelanceResultat): number {
  const map: Record<RelanceResultat, number> = {
    [RelanceResultat.SUCCES]: 1,
    [RelanceResultat.ECHEC]: 2,
    [RelanceResultat.IGNORE]: 3,
  };
  return map[r] || 0;
}

function protoToResultat(p: number): RelanceResultat {
  const map: Record<number, RelanceResultat> = {
    1: RelanceResultat.SUCCES,
    2: RelanceResultat.ECHEC,
    3: RelanceResultat.IGNORE,
  };
  return map[p] || RelanceResultat.SUCCES;
}

function toProtoRegleRelance(regle: RegleRelanceEntity): RegleRelance {
  return {
    id: regle.id,
    organisationId: regle.organisationId,
    nom: regle.nom,
    description: regle.description || '',
    declencheur: declencheurToProto(regle.declencheur),
    delaiJours: regle.delaiJours,
    actionType: actionTypeToProto(regle.actionType),
    prioriteTache: prioriteToProto(regle.prioriteTache),
    templateEmailId: regle.templateEmailId || '',
    templateTitreTache: regle.templateTitreTache || '',
    templateDescriptionTache: regle.templateDescriptionTache || '',
    assigneParDefaut: regle.assigneParDefaut || '',
    actif: regle.actif,
    ordre: regle.ordre,
    metadata: regle.metadata ? JSON.stringify(regle.metadata) : '',
    createdAt: regle.createdAt?.toISOString() || '',
    updatedAt: regle.updatedAt?.toISOString() || '',
  };
}

function toProtoHistoriqueRelance(historique: HistoriqueRelanceEntity): HistoriqueRelance {
  return {
    id: historique.id,
    organisationId: historique.organisationId,
    regleRelanceId: historique.regleRelanceId,
    clientId: historique.clientId || '',
    contratId: historique.contratId || '',
    factureId: historique.factureId || '',
    tacheCreeeId: historique.tacheCreeeId || '',
    dateExecution: historique.dateExecution?.toISOString() || '',
    resultat: resultatToProto(historique.resultat),
    messageErreur: historique.messageErreur || '',
    metadata: historique.metadata ? JSON.stringify(historique.metadata) : '',
    createdAt: historique.createdAt?.toISOString() || '',
    updatedAt: historique.updatedAt?.toISOString() || '',
    regle: historique.regle ? toProtoRegleRelance(historique.regle) : undefined,
  };
}

// ===== CONTROLLER =====

@Controller()
export class RelanceController {
  constructor(
    private readonly regleRelanceService: RegleRelanceService,
    private readonly historiqueRelanceService: HistoriqueRelanceService,
    private readonly engineService: RelanceEngineService,
  ) {}

  // ===== REGLE RELANCE SERVICE =====

  @GrpcMethod('RegleRelanceService', 'Create')
  async createRegle(data: CreateRegleRelanceRequest): Promise<RegleRelance> {
    const regle = await this.regleRelanceService.create({
      organisationId: data.organisationId,
      nom: data.nom,
      description: data.description,
      declencheur: protoToDeclencheur(data.declencheur),
      delaiJours: data.delaiJours,
      actionType: protoToActionType(data.actionType),
      prioriteTache: data.prioriteTache ? protoToPriorite(data.prioriteTache) : undefined,
      templateEmailId: data.templateEmailId,
      templateTitreTache: data.templateTitreTache,
      templateDescriptionTache: data.templateDescriptionTache,
      assigneParDefaut: data.assigneParDefaut,
      ordre: data.ordre,
    });
    return toProtoRegleRelance(regle);
  }

  @GrpcMethod('RegleRelanceService', 'Update')
  async updateRegle(data: UpdateRegleRelanceRequest): Promise<RegleRelance> {
    const regle = await this.regleRelanceService.update({
      id: data.id,
      nom: data.nom,
      description: data.description,
      declencheur: data.declencheur ? protoToDeclencheur(data.declencheur) : undefined,
      delaiJours: data.delaiJours,
      actionType: data.actionType ? protoToActionType(data.actionType) : undefined,
      prioriteTache: data.prioriteTache ? protoToPriorite(data.prioriteTache) : undefined,
      templateEmailId: data.templateEmailId,
      templateTitreTache: data.templateTitreTache,
      templateDescriptionTache: data.templateDescriptionTache,
      assigneParDefaut: data.assigneParDefaut,
      actif: data.actif,
      ordre: data.ordre,
    });
    return toProtoRegleRelance(regle);
  }

  @GrpcMethod('RegleRelanceService', 'Get')
  async getRegle(data: GetRegleRelanceRequest): Promise<RegleRelance> {
    const regle = await this.regleRelanceService.findById(data.id);
    return toProtoRegleRelance(regle);
  }

  @GrpcMethod('RegleRelanceService', 'List')
  async listRegles(data: ListReglesRelanceRequest): Promise<ListReglesRelanceResponse> {
    const result = await this.regleRelanceService.findAll({
      organisationId: data.organisationId,
      actif: data.actif,
      declencheur: data.declencheur ? protoToDeclencheur(data.declencheur) : undefined,
      pagination: data.pagination
        ? {
            page: data.pagination.page,
            limit: data.pagination.limit,
            sortBy: data.pagination.sortBy,
            sortOrder: data.pagination.sortOrder,
          }
        : undefined,
    });
    return {
      regles: result.regles.map(toProtoRegleRelance),
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
      },
    };
  }

  @GrpcMethod('RegleRelanceService', 'Delete')
  async deleteRegle(data: DeleteRegleRelanceRequest): Promise<DeleteRegleRelanceResponse> {
    const success = await this.regleRelanceService.delete(data.id);
    return { success };
  }

  @GrpcMethod('RegleRelanceService', 'Activate')
  async activateRegle(data: ActivateRegleRequest): Promise<RegleRelance> {
    const regle = await this.regleRelanceService.activate(data.id);
    return toProtoRegleRelance(regle);
  }

  @GrpcMethod('RegleRelanceService', 'Deactivate')
  async deactivateRegle(data: DeactivateRegleRequest): Promise<RegleRelance> {
    const regle = await this.regleRelanceService.deactivate(data.id);
    return toProtoRegleRelance(regle);
  }

  // ===== HISTORIQUE RELANCE SERVICE =====

  @GrpcMethod('HistoriqueRelanceService', 'Create')
  async createHistorique(data: CreateHistoriqueRelanceRequest): Promise<HistoriqueRelance> {
    const historique = await this.historiqueRelanceService.create({
      organisationId: data.organisationId,
      regleRelanceId: data.regleRelanceId,
      clientId: data.clientId,
      contratId: data.contratId,
      factureId: data.factureId,
      tacheCreeeId: data.tacheCreeeId,
      resultat: protoToResultat(data.resultat),
      messageErreur: data.messageErreur,
      metadata: data.metadata,
    });
    return toProtoHistoriqueRelance(historique);
  }

  @GrpcMethod('HistoriqueRelanceService', 'Get')
  async getHistorique(data: GetHistoriqueRelanceRequest): Promise<HistoriqueRelance> {
    const historique = await this.historiqueRelanceService.findById(data.id);
    return toProtoHistoriqueRelance(historique);
  }

  @GrpcMethod('HistoriqueRelanceService', 'List')
  async listHistoriques(data: ListHistoriquesRelanceRequest): Promise<ListHistoriquesRelanceResponse> {
    const result = await this.historiqueRelanceService.findAll({
      organisationId: data.organisationId,
      regleRelanceId: data.regleRelanceId,
      clientId: data.clientId,
      contratId: data.contratId,
      factureId: data.factureId,
      resultat: data.resultat ? protoToResultat(data.resultat) : undefined,
      dateFrom: data.dateFrom ? new Date(data.dateFrom) : undefined,
      dateTo: data.dateTo ? new Date(data.dateTo) : undefined,
      pagination: data.pagination
        ? {
            page: data.pagination.page,
            limit: data.pagination.limit,
            sortBy: data.pagination.sortBy,
            sortOrder: data.pagination.sortOrder,
          }
        : undefined,
    });
    return {
      historiques: result.historiques.map(toProtoHistoriqueRelance),
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
      },
    };
  }

  @GrpcMethod('HistoriqueRelanceService', 'Delete')
  async deleteHistorique(data: DeleteHistoriqueRelanceRequest): Promise<DeleteHistoriqueRelanceResponse> {
    const success = await this.historiqueRelanceService.delete(data.id);
    return { success };
  }

  @GrpcMethod('HistoriqueRelanceService', 'ExistsForToday')
  async existsForToday(data: ExistsForTodayRequest): Promise<ExistsForTodayResponse> {
    const exists = await this.historiqueRelanceService.existsForToday(
      data.regleRelanceId,
      data.clientId,
      data.contratId,
      data.factureId,
    );
    return { exists };
  }

  // ===== RELANCE ENGINE SERVICE =====

  @GrpcMethod('RelanceEngineService', 'ExecuteRelances')
  async executeRelances(data: ExecuteRelancesRequest): Promise<ExecuteRelancesResponse> {
    const result = await this.engineService.executeRelances(data.organisationId);
    return {
      success: result.success,
      message: result.message,
      relancesExecutees: result.relancesExecutees,
      relancesEchouees: result.relancesEchouees,
    };
  }

  @GrpcMethod('RelanceEngineService', 'ExecuteRegle')
  async executeRegle(data: ExecuteRegleRequest): Promise<ExecuteRegleResponse> {
    const regle = await this.regleRelanceService.findById(data.regleId);
    const result = await this.engineService.executeRegle(regle);
    return {
      success: result.success,
      message: result.success ? 'Regle executed' : 'Execution failed',
      actionsCreees: result.actionsCreees,
    };
  }

  @GrpcMethod('RelanceEngineService', 'ProcessEvent')
  async processEvent(data: ProcessEventRequest): Promise<ProcessEventResponse> {
    let metadata: Record<string, unknown> | undefined;
    if (data.event?.metadata) {
      try {
        metadata = JSON.parse(data.event.metadata);
      } catch {
        metadata = undefined;
      }
    }

    const eventData: RelanceEventData = {
      organisationId: data.event?.organisationId || '',
      declencheur: protoToDeclencheur(data.event?.declencheur || 0),
      clientId: data.event?.clientId,
      contratId: data.event?.contratId,
      factureId: data.event?.factureId,
      metadata,
    };

    const result = await this.engineService.processEvent(eventData);
    return {
      success: result.success,
      message: result.message,
      actionsCreated: result.actionsCreated.map((a) => JSON.stringify(a)),
    };
  }

  @GrpcMethod('RelanceEngineService', 'GetStatistiques')
  async getStatistiques(data: GetStatistiquesRequest): Promise<GetStatistiquesResponse> {
    const stats = await this.engineService.getStatistiques(
      data.organisationId,
      data.dateFrom ? new Date(data.dateFrom) : undefined,
      data.dateTo ? new Date(data.dateTo) : undefined,
    );
    return {
      totalRelances: stats.total,
      relancesSucces: stats.succes,
      relancesEchec: stats.echec,
      relancesIgnore: stats.ignore,
      statsParDeclencheur: stats.parDeclencheur.map((s) => ({
        declencheur: declencheurToProto(s.declencheur as RelanceDeclencheur),
        count: s.count,
        succes: s.succes,
        echec: s.echec,
      })),
    };
  }
}
