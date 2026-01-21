import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import { RegleRelanceService } from './modules/regle-relance/regle-relance.service';
import { HistoriqueRelanceService } from './modules/historique-relance/historique-relance.service';
import { RelanceEngineService, RelanceEventData } from './modules/engine/relance-engine.service';

import {
  RelanceDeclencheur,
  RelanceActionType,
  Priorite,
} from './modules/regle-relance/entities/regle-relance.entity';
import { RelanceResultat } from './modules/historique-relance/entities/historique-relance.entity';

import type {
  CreateRegleRelanceRequest,
  UpdateRegleRelanceRequest,
  GetRegleRelanceRequest,
  ListReglesRelanceRequest,
  DeleteRegleRelanceRequest,
  ActivateRegleRequest,
  DeactivateRegleRequest,
  CreateHistoriqueRelanceRequest,
  GetHistoriqueRelanceRequest,
  ListHistoriquesRelanceRequest,
  DeleteHistoriqueRelanceRequest,
  ExistsForTodayRequest,
  ExecuteRelancesRequest,
  ExecuteRegleRequest,
  ProcessEventRequest,
  GetStatistiquesRequest,
} from '@proto/relance/relance';

const declencheurFromProto: Record<number, RelanceDeclencheur> = {
  1: RelanceDeclencheur.IMPAYE,
  2: RelanceDeclencheur.CONTRAT_BIENTOT_EXPIRE,
  3: RelanceDeclencheur.CONTRAT_EXPIRE,
  4: RelanceDeclencheur.NOUVEAU_CLIENT,
  5: RelanceDeclencheur.INACTIVITE_CLIENT,
};

const actionTypeFromProto: Record<number, RelanceActionType> = {
  1: RelanceActionType.CREER_TACHE,
  2: RelanceActionType.ENVOYER_EMAIL,
  3: RelanceActionType.NOTIFICATION,
  4: RelanceActionType.TACHE_ET_EMAIL,
};

const prioriteFromProto: Record<number, Priorite> = {
  1: Priorite.HAUTE,
  2: Priorite.MOYENNE,
  3: Priorite.BASSE,
};

const resultatFromProto: Record<number, RelanceResultat> = {
  1: RelanceResultat.SUCCES,
  2: RelanceResultat.ECHEC,
  3: RelanceResultat.IGNORE,
};

@Controller()
export class RelanceController {
  constructor(
    private readonly regleRelanceService: RegleRelanceService,
    private readonly historiqueRelanceService: HistoriqueRelanceService,
    private readonly engineService: RelanceEngineService,
  ) {}

  @GrpcMethod('RegleRelanceService', 'Create')
  async createRegle(data: CreateRegleRelanceRequest) {
    return this.regleRelanceService.create({
      organisationId: data.organisationId,
      nom: data.nom,
      description: data.description,
      declencheur: declencheurFromProto[data.declencheur] || RelanceDeclencheur.IMPAYE,
      delaiJours: data.delaiJours,
      actionType: actionTypeFromProto[data.actionType] || RelanceActionType.CREER_TACHE,
      prioriteTache: data.prioriteTache ? prioriteFromProto[data.prioriteTache] : undefined,
      templateEmailId: data.templateEmailId,
      templateTitreTache: data.templateTitreTache,
      templateDescriptionTache: data.templateDescriptionTache,
      assigneParDefaut: data.assigneParDefaut,
      ordre: data.ordre,
    });
  }

  @GrpcMethod('RegleRelanceService', 'Update')
  async updateRegle(data: UpdateRegleRelanceRequest) {
    return this.regleRelanceService.update({
      id: data.id,
      nom: data.nom,
      description: data.description,
      declencheur: data.declencheur ? declencheurFromProto[data.declencheur] : undefined,
      delaiJours: data.delaiJours,
      actionType: data.actionType ? actionTypeFromProto[data.actionType] : undefined,
      prioriteTache: data.prioriteTache ? prioriteFromProto[data.prioriteTache] : undefined,
      templateEmailId: data.templateEmailId,
      templateTitreTache: data.templateTitreTache,
      templateDescriptionTache: data.templateDescriptionTache,
      assigneParDefaut: data.assigneParDefaut,
      actif: data.actif,
      ordre: data.ordre,
    });
  }

  @GrpcMethod('RegleRelanceService', 'Get')
  async getRegle(data: GetRegleRelanceRequest) {
    return this.regleRelanceService.findById(data.id);
  }

  @GrpcMethod('RegleRelanceService', 'List')
  async listRegles(data: ListReglesRelanceRequest) {
    return this.regleRelanceService.findAll({
      organisationId: data.organisationId,
      actif: data.actif,
      declencheur: data.declencheur ? declencheurFromProto[data.declencheur] : undefined,
      pagination: data.pagination
        ? {
            page: data.pagination.page,
            limit: data.pagination.limit,
            sortBy: data.pagination.sortBy,
            sortOrder: data.pagination.sortOrder,
          }
        : undefined,
    });
  }

  @GrpcMethod('RegleRelanceService', 'Delete')
  async deleteRegle(data: DeleteRegleRelanceRequest) {
    const success = await this.regleRelanceService.delete(data.id);
    return { success };
  }

  @GrpcMethod('RegleRelanceService', 'Activate')
  async activateRegle(data: ActivateRegleRequest) {
    return this.regleRelanceService.activate(data.id);
  }

  @GrpcMethod('RegleRelanceService', 'Deactivate')
  async deactivateRegle(data: DeactivateRegleRequest) {
    return this.regleRelanceService.deactivate(data.id);
  }

  @GrpcMethod('HistoriqueRelanceService', 'Create')
  async createHistorique(data: CreateHistoriqueRelanceRequest) {
    return this.historiqueRelanceService.create({
      organisationId: data.organisationId,
      regleRelanceId: data.regleRelanceId,
      clientId: data.clientId,
      contratId: data.contratId,
      factureId: data.factureId,
      tacheCreeeId: data.tacheCreeeId,
      resultat: resultatFromProto[data.resultat] || RelanceResultat.SUCCES,
      messageErreur: data.messageErreur,
      metadata: data.metadata,
    });
  }

  @GrpcMethod('HistoriqueRelanceService', 'Get')
  async getHistorique(data: GetHistoriqueRelanceRequest) {
    return this.historiqueRelanceService.findById(data.id);
  }

  @GrpcMethod('HistoriqueRelanceService', 'List')
  async listHistoriques(data: ListHistoriquesRelanceRequest) {
    return this.historiqueRelanceService.findAll({
      organisationId: data.organisationId,
      regleRelanceId: data.regleRelanceId,
      clientId: data.clientId,
      contratId: data.contratId,
      factureId: data.factureId,
      resultat: data.resultat ? resultatFromProto[data.resultat] : undefined,
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
  }

  @GrpcMethod('HistoriqueRelanceService', 'Delete')
  async deleteHistorique(data: DeleteHistoriqueRelanceRequest) {
    const success = await this.historiqueRelanceService.delete(data.id);
    return { success };
  }

  @GrpcMethod('HistoriqueRelanceService', 'ExistsForToday')
  async existsForToday(data: ExistsForTodayRequest) {
    const exists = await this.historiqueRelanceService.existsForToday(
      data.regleRelanceId,
      data.clientId,
      data.contratId,
      data.factureId,
    );
    return { exists };
  }

  @GrpcMethod('RelanceEngineService', 'ExecuteRelances')
  async executeRelances(data: ExecuteRelancesRequest) {
    return this.engineService.executeRelances(data.organisationId);
  }

  @GrpcMethod('RelanceEngineService', 'ExecuteRegle')
  async executeRegle(data: ExecuteRegleRequest) {
    const regle = await this.regleRelanceService.findById(data.regleId);
    const result = await this.engineService.executeRegle(regle);
    return {
      success: result.success,
      message: result.success ? 'Regle executed' : 'Execution failed',
      actionsCreees: result.actionsCreees,
    };
  }

  @GrpcMethod('RelanceEngineService', 'ProcessEvent')
  async processEvent(data: ProcessEventRequest) {
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
      declencheur: declencheurFromProto[data.event?.declencheur || 0] || RelanceDeclencheur.IMPAYE,
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
  async getStatistiques(data: GetStatistiquesRequest) {
    return this.engineService.getStatistiques(
      data.organisationId,
      data.dateFrom ? new Date(data.dateFrom) : undefined,
      data.dateTo ? new Date(data.dateTo) : undefined,
    );
  }
}
