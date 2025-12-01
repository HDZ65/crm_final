import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateExpeditionDto } from '../../../../applications/dto/expedition/create-expedition.dto';
import { UpdateExpeditionDto } from '../../../../applications/dto/expedition/update-expedition.dto';
import { ExpeditionDto } from '../../../../applications/dto/expedition/expedition-response.dto';
import {
  ExpeditionWithDetailsDto,
  ClientSummaryDto,
  ContratSummaryDto,
  TransporteurSummaryDto,
} from '../../../../applications/dto/expedition/expedition-with-details-response.dto';
import { CreateExpeditionUseCase } from '../../../../applications/usecase/expedition/create-expedition.usecase';
import { GetExpeditionUseCase } from '../../../../applications/usecase/expedition/get-expedition.usecase';
import { GetExpeditionWithDetailsUseCase } from '../../../../applications/usecase/expedition/get-expedition-with-details.usecase';
import { UpdateExpeditionUseCase } from '../../../../applications/usecase/expedition/update-expedition.usecase';
import { DeleteExpeditionUseCase } from '../../../../applications/usecase/expedition/delete-expedition.usecase';

@Controller('expeditions')
export class ExpeditionController {
  constructor(
    private readonly createUseCase: CreateExpeditionUseCase,
    private readonly getUseCase: GetExpeditionUseCase,
    private readonly getWithDetailsUseCase: GetExpeditionWithDetailsUseCase,
    private readonly updateUseCase: UpdateExpeditionUseCase,
    private readonly deleteUseCase: DeleteExpeditionUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateExpeditionDto): Promise<ExpeditionDto> {
    const entity = await this.createUseCase.execute(dto);
    return new ExpeditionDto(entity);
  }

  @Get()
  async findAll(): Promise<ExpeditionDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((entity) => new ExpeditionDto(entity));
  }

  @Get('with-details')
  async findAllWithDetails(
    @Query('organisationId') organisationId?: string,
  ): Promise<ExpeditionWithDetailsDto[]> {
    const results = await this.getWithDetailsUseCase.executeAll(organisationId);
    return results.map(
      (result) =>
        new ExpeditionWithDetailsDto({
          id: result.expedition.id,
          organisationId: result.expedition.organisationId,
          referenceCommande: result.expedition.referenceCommande,
          trackingNumber: result.expedition.trackingNumber,
          etat: result.expedition.etat,
          nomProduit: result.expedition.nomProduit,
          poids: result.expedition.poids,
          villeDestination: result.expedition.villeDestination,
          codePostalDestination: result.expedition.codePostalDestination,
          adresseDestination: result.expedition.adresseDestination,
          dateCreation: result.expedition.dateCreation,
          dateExpedition: result.expedition.dateExpedition,
          dateLivraisonEstimee: result.expedition.dateLivraisonEstimee,
          dateLivraison: result.expedition.dateLivraison,
          dateDernierStatut: result.expedition.dateDernierStatut,
          lieuActuel: result.expedition.lieuActuel,
          labelUrl: result.expedition.labelUrl,
          client: result.client ? new ClientSummaryDto(result.client) : null,
          contrat: result.contrat
            ? new ContratSummaryDto(result.contrat)
            : null,
          transporteur: result.transporteur
            ? new TransporteurSummaryDto(result.transporteur)
            : null,
          createdAt: result.expedition.createdAt!,
          updatedAt: result.expedition.updatedAt!,
        }),
    );
  }

  @Get(':id/with-details')
  async findOneWithDetails(
    @Param('id') id: string,
  ): Promise<ExpeditionWithDetailsDto> {
    const result = await this.getWithDetailsUseCase.execute(id);
    return new ExpeditionWithDetailsDto({
      id: result.expedition.id,
      organisationId: result.expedition.organisationId,
      referenceCommande: result.expedition.referenceCommande,
      trackingNumber: result.expedition.trackingNumber,
      etat: result.expedition.etat,
      nomProduit: result.expedition.nomProduit,
      poids: result.expedition.poids,
      villeDestination: result.expedition.villeDestination,
      codePostalDestination: result.expedition.codePostalDestination,
      adresseDestination: result.expedition.adresseDestination,
      dateCreation: result.expedition.dateCreation,
      dateExpedition: result.expedition.dateExpedition,
      dateLivraisonEstimee: result.expedition.dateLivraisonEstimee,
      dateLivraison: result.expedition.dateLivraison,
      dateDernierStatut: result.expedition.dateDernierStatut,
      lieuActuel: result.expedition.lieuActuel,
      labelUrl: result.expedition.labelUrl,
      client: result.client ? new ClientSummaryDto(result.client) : null,
      contrat: result.contrat ? new ContratSummaryDto(result.contrat) : null,
      transporteur: result.transporteur
        ? new TransporteurSummaryDto(result.transporteur)
        : null,
      createdAt: result.expedition.createdAt!,
      updatedAt: result.expedition.updatedAt!,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ExpeditionDto> {
    const entity = await this.getUseCase.execute(id);
    return new ExpeditionDto(entity);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExpeditionDto,
  ): Promise<ExpeditionDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new ExpeditionDto(entity);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
