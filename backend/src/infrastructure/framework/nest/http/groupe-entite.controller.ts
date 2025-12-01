import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Roles } from 'nest-keycloak-connect';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGroupeEntiteDto } from '../../../../applications/dto/groupe-entite/create-groupe-entite.dto';
import { UpdateGroupeEntiteDto } from '../../../../applications/dto/groupe-entite/update-groupe-entite.dto';
import { GroupeEntiteDto, GroupeEntiteWithDetailsDto } from '../../../../applications/dto/groupe-entite/groupe-entite-response.dto';
import { CreateGroupeEntiteUseCase } from '../../../../applications/usecase/groupe-entite/create-groupe-entite.usecase';
import { GetGroupeEntiteUseCase } from '../../../../applications/usecase/groupe-entite/get-groupe-entite.usecase';
import { UpdateGroupeEntiteUseCase } from '../../../../applications/usecase/groupe-entite/update-groupe-entite.usecase';
import { DeleteGroupeEntiteUseCase } from '../../../../applications/usecase/groupe-entite/delete-groupe-entite.usecase';
import { GroupeEntiteEntity } from '../../../db/entities/groupe-entite.entity';

@Controller('groupeentites')
export class GroupeEntiteController {
  constructor(
    private readonly createUseCase: CreateGroupeEntiteUseCase,
    private readonly getUseCase: GetGroupeEntiteUseCase,
    private readonly updateUseCase: UpdateGroupeEntiteUseCase,
    private readonly deleteUseCase: DeleteGroupeEntiteUseCase,
    @InjectRepository(GroupeEntiteEntity)
    private readonly groupeEntiteRepository: Repository<GroupeEntiteEntity>,
  ) {}

  private toDetailedDto(entity: GroupeEntiteEntity): GroupeEntiteWithDetailsDto {
    return new GroupeEntiteWithDetailsDto({
      id: entity.id,
      groupeId: entity.groupeId,
      groupe: entity.groupe ? {
        id: entity.groupe.id,
        nom: entity.groupe.nom,
        description: entity.groupe.description || undefined,
        type: entity.groupe.type,
      } : undefined,
      entiteId: entity.entiteId,
      entite: entity.entite ? {
        id: entity.entite.id,
        raisonSociale: entity.entite.raisonSociale,
        siren: entity.entite.siren,
        numeroTVA: entity.entite.numeroTVA,
      } : undefined,
      type: entity.type,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateGroupeEntiteDto): Promise<GroupeEntiteWithDetailsDto> {
    const entity = await this.createUseCase.execute(dto);
    // Récupérer avec les relations
    const withRelations = await this.groupeEntiteRepository.findOne({
      where: { id: entity.id },
      relations: ['groupe', 'entite'],
    });
    return this.toDetailedDto(withRelations!);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(): Promise<GroupeEntiteWithDetailsDto[]> {
    const entities = await this.groupeEntiteRepository.find({
      relations: ['groupe', 'entite'],
    });
    return entities.map((entity) => this.toDetailedDto(entity));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<GroupeEntiteWithDetailsDto> {
    const entity = await this.groupeEntiteRepository.findOne({
      where: { id },
      relations: ['groupe', 'entite'],
    });
    if (!entity) {
      throw new Error('GroupeEntite not found');
    }
    return this.toDetailedDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGroupeEntiteDto,
  ): Promise<GroupeEntiteWithDetailsDto> {
    await this.updateUseCase.execute(id, dto);
    const entity = await this.groupeEntiteRepository.findOne({
      where: { id },
      relations: ['groupe', 'entite'],
    });
    return this.toDetailedDto(entity!);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
