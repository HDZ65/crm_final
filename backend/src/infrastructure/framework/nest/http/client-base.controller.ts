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
import { Roles } from 'nest-keycloak-connect';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateClientBaseDto } from '../../../../applications/dto/client-base/create-client-base.dto';
import { UpdateClientBaseDto } from '../../../../applications/dto/client-base/update-client-base.dto';
import { ClientBaseDto, ClientBaseWithContratsDto, ContratSummaryDto } from '../../../../applications/dto/client-base/client-base-response.dto';
import { CreateClientBaseUseCase } from '../../../../applications/usecase/client-base/create-client-base.usecase';
import { GetClientBaseUseCase } from '../../../../applications/usecase/client-base/get-client-base.usecase';
import { UpdateClientBaseUseCase } from '../../../../applications/usecase/client-base/update-client-base.usecase';
import { DeleteClientBaseUseCase } from '../../../../applications/usecase/client-base/delete-client-base.usecase';
import { ClientBaseEntity } from '../../../db/entities/client-base.entity';

@Controller('clientbases')
export class ClientBaseController {
  constructor(
    private readonly createUseCase: CreateClientBaseUseCase,
    private readonly getUseCase: GetClientBaseUseCase,
    private readonly updateUseCase: UpdateClientBaseUseCase,
    private readonly deleteUseCase: DeleteClientBaseUseCase,
    @InjectRepository(ClientBaseEntity)
    private readonly clientBaseRepository: Repository<ClientBaseEntity>,
  ) {}

  private toWithContratsDto(entity: ClientBaseEntity): ClientBaseWithContratsDto {
    const contrats: ContratSummaryDto[] = (entity.contrats || []).map((c) => ({
      id: c.id,
      referenceExterne: c.referenceExterne,
      dateDebut: c.dateDebut,
      dateFin: c.dateFin,
      statutId: c.statutId,
      societeId: c.societeId,
    }));

    return new ClientBaseWithContratsDto({
      id: entity.id,
      organisationId: entity.organisationId,
      typeClient: entity.typeClient,
      nom: entity.nom,
      prenom: entity.prenom,
      dateNaissance: entity.dateNaissance,
      compteCode: entity.compteCode,
      partenaireId: entity.partenaireId,
      dateCreation: entity.dateCreation,
      telephone: entity.telephone,
      email: entity.email,
      statutId: entity.statutId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      contrats,
    });
  }

  @Roles({ roles: ['realm:commercial', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateClientBaseDto): Promise<ClientBaseDto> {
    const entity = await this.createUseCase.execute(dto);
    return new ClientBaseDto(entity);
  }

  @Get()
  async findAll(
    @Query('statutId') statutId?: string,
    @Query('societeId') societeId?: string,
  ): Promise<ClientBaseWithContratsDto[]> {
    const queryBuilder = this.clientBaseRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.contrats', 'contrat');

    // Filtre par statut client
    if (statutId) {
      queryBuilder.andWhere('client.statutId = :statutId', { statutId });
    }

    // Filtre par société (via les contrats)
    if (societeId) {
      queryBuilder.andWhere('contrat.societeId = :societeId', { societeId });
    }

    const entities = await queryBuilder.getMany();
    return entities.map((e) => this.toWithContratsDto(e));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ClientBaseWithContratsDto> {
    const entity = await this.clientBaseRepository.findOne({
      where: { id },
      relations: ['contrats'],
    });
    if (!entity) {
      throw new Error('Client not found');
    }
    return this.toWithContratsDto(entity);
  }

  @Roles({ roles: ['realm:commercial', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClientBaseDto,
  ): Promise<ClientBaseDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new ClientBaseDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
