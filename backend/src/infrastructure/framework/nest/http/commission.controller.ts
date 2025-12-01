import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CreateCommissionUseCase } from '../../../../applications/usecase/commission/create-commission.usecase';
import { GetCommissionUseCase } from '../../../../applications/usecase/commission/get-commission.usecase';
import { GetCommissionWithDetailsUseCase } from '../../../../applications/usecase/commission/get-commission-with-details.usecase';
import { UpdateCommissionUseCase } from '../../../../applications/usecase/commission/update-commission.usecase';
import { DeleteCommissionUseCase } from '../../../../applications/usecase/commission/delete-commission.usecase';
import { CreateCommissionDto } from '../../../../applications/dto/commission/create-commission.dto';
import { UpdateCommissionDto } from '../../../../applications/dto/commission/update-commission.dto';
import { CommissionResponseDto } from '../../../../applications/dto/commission/commission-response.dto';
import { CommissionWithDetailsResponseDto } from '../../../../applications/dto/commission/commission-with-details-response.dto';
import { CommissionMapper } from '../../../../applications/mapper/commission.mapper';

@ApiTags('Commissions')
@Controller('commissions')
export class CommissionController {
  constructor(
    private readonly createUseCase: CreateCommissionUseCase,
    private readonly getUseCase: GetCommissionUseCase,
    private readonly getWithDetailsUseCase: GetCommissionWithDetailsUseCase,
    private readonly updateUseCase: UpdateCommissionUseCase,
    private readonly deleteUseCase: DeleteCommissionUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer une commission' })
  async create(
    @Body() dto: CreateCommissionDto,
  ): Promise<CommissionResponseDto> {
    const entity = await this.createUseCase.execute(dto);
    return CommissionMapper.toResponse(entity);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les commissions' })
  @ApiQuery({ name: 'organisationId', required: false })
  @ApiQuery({ name: 'apporteurId', required: false })
  @ApiQuery({ name: 'periode', required: false })
  async findAll(
    @Query('organisationId') organisationId?: string,
    @Query('apporteurId') apporteurId?: string,
    @Query('periode') periode?: string,
  ): Promise<CommissionResponseDto[]> {
    let entities;

    if (organisationId) {
      entities = await this.getUseCase.executeByOrganisationId(organisationId);
    } else if (apporteurId) {
      entities = await this.getUseCase.executeByApporteurId(apporteurId);
    } else if (periode) {
      entities = await this.getUseCase.executeByPeriode(periode);
    } else {
      entities = await this.getUseCase.executeAll();
    }

    return entities.map(CommissionMapper.toResponse);
  }

  @Get('config')
  @ApiOperation({
    summary: 'Récupérer la configuration pour le frontend (types, statuts, etc.)',
  })
  getConfig() {
    return {
      typesApporteur: [
        { value: 'vrp', label: 'VRP', color: 'bg-blue-500/10 text-blue-600' },
        { value: 'manager', label: 'Manager', color: 'bg-purple-500/10 text-purple-600' },
        { value: 'directeur', label: 'Directeur', color: 'bg-indigo-500/10 text-indigo-600' },
        { value: 'partenaire', label: 'Partenaire', color: 'bg-teal-500/10 text-teal-600' },
      ],
      typesProduit: [
        { value: 'telecom', label: 'Télécom', color: 'bg-sky-500/10 text-sky-600' },
        { value: 'assurance_sante', label: 'Assurance Santé', color: 'bg-green-500/10 text-green-600' },
        { value: 'prevoyance', label: 'Prévoyance', color: 'bg-amber-500/10 text-amber-600' },
        { value: 'energie', label: 'Énergie', color: 'bg-orange-500/10 text-orange-600' },
        { value: 'conciergerie', label: 'Conciergerie', color: 'bg-pink-500/10 text-pink-600' },
        { value: 'mondial_tv', label: 'Mondial TV', color: 'bg-red-500/10 text-red-600' },
        { value: 'autre', label: 'Autre', color: 'bg-gray-500/10 text-gray-600' },
      ],
      typesCalcul: [
        { value: 'fixe', label: 'Montant Fixe', description: 'Montant fixe par contrat' },
        { value: 'pourcentage', label: 'Pourcentage', description: 'Pourcentage de la base de calcul' },
        { value: 'palier', label: 'Palier', description: 'Montant selon seuils atteints' },
        { value: 'mixte', label: 'Mixte', description: 'Fixe + pourcentage combinés' },
      ],
      typesBase: [
        { value: 'cotisation_ht', label: 'Cotisation HT', description: 'Base sur cotisation hors taxes' },
        { value: 'ca_ht', label: 'CA HT', description: 'Base sur chiffre d\'affaires hors taxes' },
        { value: 'forfait', label: 'Forfait', description: 'Montant forfaitaire' },
      ],
      typesReprise: [
        { value: 'resiliation', label: 'Résiliation', color: 'bg-red-500/10 text-red-600' },
        { value: 'impaye', label: 'Impayé', color: 'bg-orange-500/10 text-orange-600' },
        { value: 'annulation', label: 'Annulation', color: 'bg-amber-500/10 text-amber-600' },
        { value: 'regularisation', label: 'Régularisation', color: 'bg-blue-500/10 text-blue-600' },
      ],
      statutsReprise: [
        { value: 'en_attente', label: 'En attente', color: 'bg-yellow-500/10 text-yellow-600' },
        { value: 'appliquee', label: 'Appliquée', color: 'bg-green-500/10 text-green-600' },
        { value: 'annulee', label: 'Annulée', color: 'bg-gray-500/10 text-gray-600' },
      ],
      statutsBordereau: [
        { value: 'brouillon', label: 'Brouillon', color: 'bg-gray-500/10 text-gray-600' },
        { value: 'valide', label: 'Validé', color: 'bg-green-500/10 text-green-600' },
        { value: 'exporte', label: 'Exporté', color: 'bg-blue-500/10 text-blue-600' },
        { value: 'archive', label: 'Archivé', color: 'bg-slate-500/10 text-slate-600' },
      ],
      statutsLigne: [
        { value: 'selectionnee', label: 'Sélectionnée', color: 'bg-green-500/10 text-green-600' },
        { value: 'deselectionnee', label: 'Désélectionnée', color: 'bg-orange-500/10 text-orange-600' },
        { value: 'validee', label: 'Validée', color: 'bg-blue-500/10 text-blue-600' },
        { value: 'rejetee', label: 'Rejetée', color: 'bg-red-500/10 text-red-600' },
      ],
      typesLigne: [
        { value: 'commission', label: 'Commission', color: 'bg-green-500/10 text-green-600' },
        { value: 'reprise', label: 'Reprise', color: 'bg-red-500/10 text-red-600' },
        { value: 'acompte', label: 'Acompte', color: 'bg-blue-500/10 text-blue-600' },
        { value: 'prime', label: 'Prime', color: 'bg-purple-500/10 text-purple-600' },
        { value: 'regularisation', label: 'Régularisation', color: 'bg-amber-500/10 text-amber-600' },
      ],
      typesPalier: [
        { value: 'volume', label: 'Volume', description: 'Basé sur le nombre de contrats' },
        { value: 'ca', label: 'Chiffre d\'Affaires', description: 'Basé sur le CA cumulé' },
        { value: 'prime_produit', label: 'Prime Produit', description: 'Prime par type de produit' },
      ],
      dureesReprise: [
        { value: 3, label: '3 mois' },
        { value: 6, label: '6 mois' },
        { value: 12, label: '12 mois' },
      ],
    };
  }

  @Get('with-details')
  @ApiOperation({
    summary: 'Récupérer toutes les commissions avec détails',
  })
  @ApiQuery({ name: 'organisationId', required: false })
  async findAllWithDetails(
    @Query('organisationId') organisationId?: string,
  ): Promise<CommissionWithDetailsResponseDto[]> {
    const results = await this.getWithDetailsUseCase.executeAll(organisationId);
    return results.map(CommissionMapper.toResponseWithDetails);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une commission par ID' })
  async findOne(@Param('id') id: string): Promise<CommissionResponseDto> {
    const entity = await this.getUseCase.execute(id);
    return CommissionMapper.toResponse(entity);
  }

  @Get(':id/with-details')
  @ApiOperation({ summary: 'Récupérer une commission avec détails par ID' })
  async findOneWithDetails(
    @Param('id') id: string,
  ): Promise<CommissionWithDetailsResponseDto> {
    const result = await this.getWithDetailsUseCase.execute(id);
    return CommissionMapper.toResponseWithDetails(result);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une commission' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCommissionDto,
  ): Promise<CommissionResponseDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return CommissionMapper.toResponse(entity);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une commission' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
