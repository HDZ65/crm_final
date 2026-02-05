import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { HistoriqueRelanceService } from './historique-relance.service';
import { RelanceResultat } from './entities/historique-relance.entity';
import type {
  CreateHistoriqueRelanceRequest,
  GetHistoriqueRelanceRequest,
  ListHistoriquesRelanceRequest,
  DeleteHistoriqueRelanceRequest,
  ExistsForTodayRequest,
} from '@crm/proto/relance';

const resultatFromProto: Record<number, RelanceResultat> = {
  1: RelanceResultat.SUCCES,
  2: RelanceResultat.ECHEC,
  3: RelanceResultat.IGNORE,
};

@Controller()
export class HistoriqueRelanceController {
  constructor(private readonly historiqueRelanceService: HistoriqueRelanceService) {}

  @GrpcMethod('HistoriqueRelanceService', 'Create')
  async createHistorique(data: CreateHistoriqueRelanceRequest) {
    return this.historiqueRelanceService.create({
      organisationId: data.organisation_id,
      regleRelanceId: data.regle_relance_id,
      clientId: data.client_id,
      contratId: data.contrat_id,
      factureId: data.facture_id,
      tacheCreeeId: data.tache_creee_id,
      resultat: resultatFromProto[data.resultat] || RelanceResultat.SUCCES,
      messageErreur: data.message_erreur,
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
      organisationId: data.organisation_id,
      regleRelanceId: data.regle_relance_id,
      clientId: data.client_id,
      contratId: data.contrat_id,
      factureId: data.facture_id,
      resultat: data.resultat ? resultatFromProto[data.resultat] : undefined,
      dateFrom: data.date_from ? new Date(data.date_from) : undefined,
      dateTo: data.date_to ? new Date(data.date_to) : undefined,
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

  @GrpcMethod('HistoriqueRelanceService', 'Delete')
  async deleteHistorique(data: DeleteHistoriqueRelanceRequest) {
    const success = await this.historiqueRelanceService.delete(data.id);
    return { success };
  }

  @GrpcMethod('HistoriqueRelanceService', 'ExistsForToday')
  async existsForToday(data: ExistsForTodayRequest) {
    const exists = await this.historiqueRelanceService.existsForToday(
      data.regle_relance_id,
      data.client_id,
      data.contrat_id,
      data.facture_id,
    );
    return { exists };
  }
}
