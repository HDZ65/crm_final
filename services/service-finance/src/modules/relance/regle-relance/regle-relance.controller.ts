import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RegleRelanceService } from './regle-relance.service';
import {
  RelanceDeclencheur,
  RelanceActionType,
  Priorite,
} from './entities/regle-relance.entity';
import type {
  CreateRegleRelanceRequest,
  UpdateRegleRelanceRequest,
  GetRegleRelanceRequest,
  ListReglesRelanceRequest,
  DeleteRegleRelanceRequest,
  ActivateRegleRequest,
  DeactivateRegleRequest,
} from '@crm/proto/relance';

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

@Controller()
export class RegleRelanceController {
  constructor(private readonly regleRelanceService: RegleRelanceService) {}

  @GrpcMethod('RegleRelanceService', 'Create')
  async createRegle(data: CreateRegleRelanceRequest) {
    return this.regleRelanceService.create({
      organisationId: data.organisation_id,
      nom: data.nom,
      description: data.description,
      declencheur: declencheurFromProto[data.declencheur] || RelanceDeclencheur.IMPAYE,
      delaiJours: data.delai_jours,
      actionType: actionTypeFromProto[data.action_type] || RelanceActionType.CREER_TACHE,
      prioriteTache: data.priorite_tache ? prioriteFromProto[data.priorite_tache] : undefined,
      templateEmailId: data.template_email_id,
      templateTitreTache: data.template_titre_tache,
      templateDescriptionTache: data.template_description_tache,
      assigneParDefaut: data.assigne_par_defaut,
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
      delaiJours: data.delai_jours,
      actionType: data.action_type ? actionTypeFromProto[data.action_type] : undefined,
      prioriteTache: data.priorite_tache ? prioriteFromProto[data.priorite_tache] : undefined,
      templateEmailId: data.template_email_id,
      templateTitreTache: data.template_titre_tache,
      templateDescriptionTache: data.template_description_tache,
      assigneParDefaut: data.assigne_par_defaut,
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
      organisationId: data.organisation_id,
      actif: data.actif,
      declencheur: data.declencheur ? declencheurFromProto[data.declencheur] : undefined,
      pagination: data.pagination
        ? {
            page: data.pagination.page,
            limit: data.pagination.limit,
            sortBy: data.pagination.sort_by,
            sortOrder: data.pagination.sort_order,
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
}
