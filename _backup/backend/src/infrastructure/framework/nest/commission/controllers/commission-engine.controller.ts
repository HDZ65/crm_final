import { Controller, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  CommissionEngineService,
  CalculCommissionInput,
  GenerationBordereauInput,
} from '../../../../services/commission-engine.service';

class CalculerCommissionDto {
  organisationId: string;
  contratId: string;
  apporteurId: string;
  produitId?: string;
  typeProduit?: string;
  profilRemuneration?: string;
  baseCalcul: number;
  periode: string;
  referenceContrat: string;
  clientNom?: string;
  produitNom?: string;
  compagnie?: string;
}

class GenererBordereauDto {
  organisationId: string;
  apporteurId: string;
  periode: string;
  creePar?: string;
}

class DeclencherRepriseDto {
  commissionId: string;
  typeReprise: 'resiliation' | 'impaye' | 'annulation';
  dateEvenement: string;
  motif?: string;
}

@ApiTags('Commission Engine')
@Controller('commission-engine')
export class CommissionEngineController {
  constructor(private readonly engineService: CommissionEngineService) {}

  @Post('calculer')
  @ApiOperation({
    summary: 'Calculer une commission pour un contrat',
    description:
      'Applique le barème applicable et calcule le montant de commission',
  })
  async calculerCommission(@Body() dto: CalculerCommissionDto) {
    const input: CalculCommissionInput = {
      organisationId: dto.organisationId,
      contratId: dto.contratId,
      apporteurId: dto.apporteurId,
      produitId: dto.produitId,
      typeProduit: dto.typeProduit,
      profilRemuneration: dto.profilRemuneration,
      baseCalcul: dto.baseCalcul,
      periode: dto.periode,
      referenceContrat: dto.referenceContrat,
      clientNom: dto.clientNom,
      produitNom: dto.produitNom,
      compagnie: dto.compagnie,
    };

    return await this.engineService.calculerCommission(input);
  }

  @Post('generer-bordereau')
  @ApiOperation({
    summary: 'Générer un bordereau pour un apporteur',
    description:
      'Crée automatiquement un bordereau avec toutes les commissions et reprises de la période',
  })
  async genererBordereau(@Body() dto: GenererBordereauDto) {
    const input: GenerationBordereauInput = {
      organisationId: dto.organisationId,
      apporteurId: dto.apporteurId,
      periode: dto.periode,
      creePar: dto.creePar,
    };

    return await this.engineService.genererBordereau(input);
  }

  @Post('declencher-reprise')
  @ApiOperation({
    summary: 'Déclencher une reprise automatique',
    description:
      'Crée une reprise suite à résiliation, impayé ou annulation dans la fenêtre de reprise',
  })
  async declencherReprise(@Body() dto: DeclencherRepriseDto) {
    return await this.engineService.declencherReprise(
      dto.commissionId,
      dto.typeReprise,
      new Date(dto.dateEvenement),
      dto.motif,
    );
  }
}
