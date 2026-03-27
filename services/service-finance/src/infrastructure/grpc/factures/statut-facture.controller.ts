import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { FactureService } from '../../persistence/typeorm/repositories/factures/facture.service';
import {
  ListStatutsFactureRequest,
  ListStatutsFactureResponse,
} from '@proto/factures';

@Controller()
export class StatutFactureController {
  constructor(private readonly factureService: FactureService) {}

  @GrpcMethod('StatutFactureService', 'List')
  async listStatutsFacture(
    data: ListStatutsFactureRequest,
  ): Promise<ListStatutsFactureResponse> {
    const result = await this.factureService.listStatutsFacture({
      page: data.pagination?.page,
      limit: data.pagination?.limit,
    });

    return {
      statuts: result.statuts.map((statut) => ({
        id: statut.id,
        code: statut.code,
        nom: statut.nom,
        description: statut.description ?? '',
        ordre_affichage: statut.ordreAffichage,
        created_at: statut.createdAt.toISOString(),
        updated_at: statut.updatedAt.toISOString(),
      })),
      pagination: result.pagination,
    };
  }
}
