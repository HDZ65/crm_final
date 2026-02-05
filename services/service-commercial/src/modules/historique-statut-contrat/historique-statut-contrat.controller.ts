import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { HistoriqueStatutContratService } from './historique-statut-contrat.service';

import type {
  CreateHistoriqueStatutContratRequest,
  GetHistoriqueStatutContratRequest,
  ListHistoriqueByContratRequest,
  DeleteHistoriqueStatutContratRequest,
} from '@crm/proto/contrats';

@Controller()
export class HistoriqueStatutContratController {
  constructor(private readonly historiqueStatutService: HistoriqueStatutContratService) {}

  @GrpcMethod('HistoriqueStatutContratService', 'Create')
  async createHistoriqueStatut(data: CreateHistoriqueStatutContratRequest) {
    return this.historiqueStatutService.create({
      contratId: data.contrat_id,
      ancienStatutId: data.ancien_statut_id,
      nouveauStatutId: data.nouveau_statut_id,
      dateChangement: data.date_changement,
    });
  }

  @GrpcMethod('HistoriqueStatutContratService', 'Get')
  async getHistoriqueStatut(data: GetHistoriqueStatutContratRequest) {
    return this.historiqueStatutService.findById(data.id);
  }

  @GrpcMethod('HistoriqueStatutContratService', 'ListByContrat')
  async listHistoriqueByContrat(data: ListHistoriqueByContratRequest) {
    return this.historiqueStatutService.findByContrat(data.contrat_id, data.pagination);
  }

  @GrpcMethod('HistoriqueStatutContratService', 'Delete')
  async deleteHistoriqueStatut(data: DeleteHistoriqueStatutContratRequest) {
    const success = await this.historiqueStatutService.delete(data.id);
    return { success };
  }
}
