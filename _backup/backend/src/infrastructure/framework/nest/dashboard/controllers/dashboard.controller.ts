import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { GetDashboardKpisUseCase } from '../../../../../applications/usecase/dashboard/get-dashboard-kpis.usecase';
import { GetEvolutionCaUseCase } from '../../../../../applications/usecase/dashboard/get-evolution-ca.usecase';
import { GetRepartitionProduitsUseCase } from '../../../../../applications/usecase/dashboard/get-repartition-produits.usecase';
import { GetStatsSocietesUseCase } from '../../../../../applications/usecase/dashboard/get-stats-societes.usecase';
import { GetAlertesUseCase } from '../../../../../applications/usecase/dashboard/get-alertes.usecase';
import { GetKpisCommerciauxUseCase } from '../../../../../applications/usecase/dashboard/get-kpis-commerciaux.usecase';
import { DashboardKpisDto } from '../../../../../applications/dto/dashboard/dashboard-kpis.dto';
import { EvolutionCaResponseDto } from '../../../../../applications/dto/dashboard/evolution-ca.dto';
import { RepartitionProduitsResponseDto } from '../../../../../applications/dto/dashboard/repartition-produits.dto';
import { StatsSocietesResponseDto } from '../../../../../applications/dto/dashboard/stats-societe.dto';
import { AlertesResponseDto } from '../../../../../applications/dto/dashboard/alertes.dto';
import { DashboardFiltersDto } from '../../../../../applications/dto/dashboard/dashboard-filters.dto';
import { KpisCommerciauxResponseDto } from '../../../../../applications/dto/dashboard/kpis-commerciaux.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly getDashboardKpisUseCase: GetDashboardKpisUseCase,
    private readonly getEvolutionCaUseCase: GetEvolutionCaUseCase,
    private readonly getRepartitionProduitsUseCase: GetRepartitionProduitsUseCase,
    private readonly getStatsSocietesUseCase: GetStatsSocietesUseCase,
    private readonly getAlertesUseCase: GetAlertesUseCase,
    private readonly getKpisCommerciauxUseCase: GetKpisCommerciauxUseCase,
  ) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Récupère les KPIs principaux du dashboard' })
  @ApiResponse({
    status: 200,
    description: 'KPIs récupérés avec succès',
    type: DashboardKpisDto,
  })
  @ApiQuery({
    name: 'organisationId',
    required: false,
    description: 'Filtrer par organisation',
  })
  @ApiQuery({
    name: 'societeId',
    required: false,
    description: 'Filtrer par société',
  })
  @ApiQuery({
    name: 'produitId',
    required: false,
    description: 'Filtrer par produit',
  })
  @ApiQuery({
    name: 'canal',
    required: false,
    description: 'Filtrer par canal',
  })
  @ApiQuery({
    name: 'dateDebut',
    required: false,
    description: 'Date de début (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateFin',
    required: false,
    description: 'Date de fin (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'periodeRapide',
    required: false,
    enum: [
      'mois_courant',
      'mois_dernier',
      'trimestre_courant',
      'annee_courante',
      'personnalisee',
    ],
    description: 'Période rapide prédéfinie',
  })
  async getKpis(
    @Query() filters: DashboardFiltersDto,
  ): Promise<DashboardKpisDto> {
    return this.getDashboardKpisUseCase.execute(filters);
  }

  @Get('evolution-ca')
  @ApiOperation({ summary: "Récupère l'évolution du CA sur 12 mois" })
  @ApiResponse({
    status: 200,
    description: 'Evolution CA récupérée avec succès',
    type: EvolutionCaResponseDto,
  })
  @ApiQuery({
    name: 'organisationId',
    required: false,
    description: 'Filtrer par organisation',
  })
  @ApiQuery({
    name: 'societeId',
    required: false,
    description: 'Filtrer par société',
  })
  @ApiQuery({
    name: 'dateDebut',
    required: false,
    description: 'Date de début (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateFin',
    required: false,
    description: 'Date de fin (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'periodeRapide',
    required: false,
    enum: [
      'mois_courant',
      'mois_dernier',
      'trimestre_courant',
      'annee_courante',
      'personnalisee',
    ],
    description: 'Période rapide prédéfinie',
  })
  async getEvolutionCa(
    @Query() filters: DashboardFiltersDto,
  ): Promise<EvolutionCaResponseDto> {
    return this.getEvolutionCaUseCase.execute(filters);
  }

  @Get('repartition-produits')
  @ApiOperation({ summary: 'Récupère la répartition du CA par produit' })
  @ApiResponse({
    status: 200,
    description: 'Répartition produits récupérée avec succès',
    type: RepartitionProduitsResponseDto,
  })
  @ApiQuery({
    name: 'organisationId',
    required: false,
    description: 'Filtrer par organisation',
  })
  @ApiQuery({
    name: 'societeId',
    required: false,
    description: 'Filtrer par société',
  })
  async getRepartitionProduits(
    @Query() filters: DashboardFiltersDto,
  ): Promise<RepartitionProduitsResponseDto> {
    return this.getRepartitionProduitsUseCase.execute(filters);
  }

  @Get('stats-societes')
  @ApiOperation({ summary: 'Récupère les statistiques par société' })
  @ApiResponse({
    status: 200,
    description: 'Stats sociétés récupérées avec succès',
    type: StatsSocietesResponseDto,
  })
  @ApiQuery({
    name: 'organisationId',
    required: false,
    description: 'Filtrer par organisation',
  })
  @ApiQuery({
    name: 'dateDebut',
    required: false,
    description: 'Date de début (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateFin',
    required: false,
    description: 'Date de fin (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'periodeRapide',
    required: false,
    enum: [
      'mois_courant',
      'mois_dernier',
      'trimestre_courant',
      'annee_courante',
      'personnalisee',
    ],
    description: 'Période rapide prédéfinie',
  })
  async getStatsSocietes(
    @Query() filters: DashboardFiltersDto,
  ): Promise<StatsSocietesResponseDto> {
    return this.getStatsSocietesUseCase.execute(filters);
  }

  @Get('alertes')
  @ApiOperation({ summary: 'Récupère les alertes et risques actifs' })
  @ApiResponse({
    status: 200,
    description: 'Alertes récupérées avec succès',
    type: AlertesResponseDto,
  })
  @ApiQuery({
    name: 'organisationId',
    required: false,
    description: 'Filtrer par organisation',
  })
  @ApiQuery({
    name: 'dateDebut',
    required: false,
    description: 'Date de début (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateFin',
    required: false,
    description: 'Date de fin (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'periodeRapide',
    required: false,
    enum: [
      'mois_courant',
      'mois_dernier',
      'trimestre_courant',
      'annee_courante',
      'personnalisee',
    ],
    description: 'Période rapide prédéfinie',
  })
  async getAlertes(
    @Query() filters: DashboardFiltersDto,
  ): Promise<AlertesResponseDto> {
    return this.getAlertesUseCase.execute(filters);
  }

  @Get('kpis-commerciaux')
  @ApiOperation({
    summary:
      'Récupère les KPIs commerciaux (nouveaux clients, taux conversion, panier moyen, classements)',
  })
  @ApiResponse({
    status: 200,
    description: 'KPIs commerciaux récupérés avec succès',
    type: KpisCommerciauxResponseDto,
  })
  @ApiQuery({
    name: 'organisationId',
    required: false,
    description: 'Filtrer par organisation',
  })
  @ApiQuery({
    name: 'societeId',
    required: false,
    description: 'Filtrer par société',
  })
  @ApiQuery({
    name: 'dateDebut',
    required: false,
    description: 'Date de début (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateFin',
    required: false,
    description: 'Date de fin (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'periodeRapide',
    required: false,
    enum: [
      'mois_courant',
      'mois_dernier',
      'trimestre_courant',
      'annee_courante',
      'personnalisee',
    ],
    description: 'Période rapide prédéfinie',
  })
  async getKpisCommerciaux(
    @Query() filters: DashboardFiltersDto,
  ): Promise<KpisCommerciauxResponseDto> {
    return this.getKpisCommerciauxUseCase.execute(filters);
  }
}
