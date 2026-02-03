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
}
