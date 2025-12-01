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
import { CreatePalierCommissionUseCase } from '../../../../applications/usecase/palier-commission/create-palier-commission.usecase';
import { GetPalierCommissionUseCase } from '../../../../applications/usecase/palier-commission/get-palier-commission.usecase';
import { UpdatePalierCommissionUseCase } from '../../../../applications/usecase/palier-commission/update-palier-commission.usecase';
import { DeletePalierCommissionUseCase } from '../../../../applications/usecase/palier-commission/delete-palier-commission.usecase';
import { CreatePalierCommissionDto } from '../../../../applications/dto/palier-commission/create-palier-commission.dto';
import { UpdatePalierCommissionDto } from '../../../../applications/dto/palier-commission/update-palier-commission.dto';
import { PalierCommissionResponseDto } from '../../../../applications/dto/palier-commission/palier-commission-response.dto';
import { PalierCommissionMapper } from '../../../../applications/mapper/palier-commission.mapper';

@ApiTags('Paliers Commission')
@Controller('paliers-commission')
export class PalierCommissionController {
  constructor(
    private readonly createUseCase: CreatePalierCommissionUseCase,
    private readonly getUseCase: GetPalierCommissionUseCase,
    private readonly updateUseCase: UpdatePalierCommissionUseCase,
    private readonly deleteUseCase: DeletePalierCommissionUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer un palier de commission' })
  async create(
    @Body() dto: CreatePalierCommissionDto,
  ): Promise<PalierCommissionResponseDto> {
    const entity = await this.createUseCase.execute(dto);
    return PalierCommissionMapper.toResponse(entity);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les paliers' })
  @ApiQuery({ name: 'organisationId', required: false })
  @ApiQuery({ name: 'baremeId', required: false })
  @ApiQuery({ name: 'actifs', required: false, type: Boolean })
  async findAll(
    @Query('organisationId') organisationId?: string,
    @Query('baremeId') baremeId?: string,
    @Query('actifs') actifs?: string,
  ): Promise<PalierCommissionResponseDto[]> {
    let entities;

    if (baremeId && actifs === 'true') {
      entities = await this.getUseCase.executeActifsByBaremeId(baremeId);
    } else if (baremeId) {
      entities = await this.getUseCase.executeByBaremeId(baremeId);
    } else if (organisationId) {
      entities = await this.getUseCase.executeByOrganisationId(organisationId);
    } else {
      entities = await this.getUseCase.executeAll();
    }

    return entities.map(PalierCommissionMapper.toResponse);
  }

  @Get('applicable')
  @ApiOperation({ summary: 'Trouver le palier applicable pour une valeur' })
  @ApiQuery({ name: 'baremeId', required: true })
  @ApiQuery({ name: 'typePalier', required: true })
  @ApiQuery({ name: 'valeur', required: true })
  async findApplicable(
    @Query('baremeId') baremeId: string,
    @Query('typePalier') typePalier: string,
    @Query('valeur') valeur: string,
  ): Promise<PalierCommissionResponseDto | null> {
    const entity = await this.getUseCase.executePalierApplicable(
      baremeId,
      typePalier,
      parseFloat(valeur),
    );
    return entity ? PalierCommissionMapper.toResponse(entity) : null;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un palier par ID' })
  async findOne(@Param('id') id: string): Promise<PalierCommissionResponseDto> {
    const entity = await this.getUseCase.execute(id);
    return PalierCommissionMapper.toResponse(entity);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un palier' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePalierCommissionDto,
  ): Promise<PalierCommissionResponseDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return PalierCommissionMapper.toResponse(entity);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un palier' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
