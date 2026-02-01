import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GenerationService } from './generation.service';
import { FactureService } from '../facture/facture.service';

import type {
  FinalizeFactureRequest,
  GenerateNextNumeroRequest,
  CalculateTotalsRequest,
} from '@crm/proto/factures';

@Controller()
export class GenerationController {
  constructor(
    private readonly generationService: GenerationService,
    private readonly factureService: FactureService,
  ) {}

  @GrpcMethod('FactureService', 'Finalize')
  async finalizeFacture(data: FinalizeFactureRequest) {
    const facture = await this.factureService.findById(data.id);
    const numero = await this.generationService.generateNextNumero(
      facture.organisationId,
      facture.organisationId,
    );
    return this.factureService.finalize(data.id, numero);
  }

  @GrpcMethod('FactureGenerationService', 'GenerateNextNumero')
  async generateNextNumero(data: GenerateNextNumeroRequest) {
    const numero = await this.generationService.generateNextNumero(
      data.organisationId,
      data.societeId,
    );
    return { numero };
  }

  @GrpcMethod('FactureGenerationService', 'CalculateTotals')
  async calculateTotals(data: CalculateTotalsRequest) {
    const totals = this.generationService.calculateTotals(
      data.lignes.map((l) => ({
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        tauxTVA: l.tauxTva,
      })),
    );
    return {
      montantHt: totals.montantHT,
      montantTva: totals.montantTVA,
      montantTtc: totals.montantTTC,
    };
  }
}
