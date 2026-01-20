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
import { CreateBaremeCommissionUseCase } from '../../../../../applications/usecase/bareme-commission/create-bareme-commission.usecase';
import { GetBaremeCommissionUseCase } from '../../../../../applications/usecase/bareme-commission/get-bareme-commission.usecase';
import { UpdateBaremeCommissionUseCase } from '../../../../../applications/usecase/bareme-commission/update-bareme-commission.usecase';
import { DeleteBaremeCommissionUseCase } from '../../../../../applications/usecase/bareme-commission/delete-bareme-commission.usecase';
import { CreateBaremeCommissionDto } from '../../../../../applications/dto/bareme-commission/create-bareme-commission.dto';
import { UpdateBaremeCommissionDto } from '../../../../../applications/dto/bareme-commission/update-bareme-commission.dto';
import { BaremeCommissionResponseDto } from '../../../../../applications/dto/bareme-commission/bareme-commission-response.dto';
import { BaremeCommissionMapper } from '../../../../../applications/mapper/bareme-commission.mapper';

@ApiTags('Barèmes Commission')
@Controller('baremes-commission')
export class BaremeCommissionController {
  constructor(
    private readonly createUseCase: CreateBaremeCommissionUseCase,
    private readonly getUseCase: GetBaremeCommissionUseCase,
    private readonly updateUseCase: UpdateBaremeCommissionUseCase,
    private readonly deleteUseCase: DeleteBaremeCommissionUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer un barème de commission' })
  async create(
    @Body() dto: CreateBaremeCommissionDto,
  ): Promise<BaremeCommissionResponseDto> {
    const entity = await this.createUseCase.execute(dto);
    return BaremeCommissionMapper.toResponse(entity);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les barèmes' })
  @ApiQuery({ name: 'organisationId', required: false })
  @ApiQuery({ name: 'actifs', required: false, type: Boolean })
  @ApiQuery({ name: 'typeProduit', required: false })
  async findAll(
    @Query('organisationId') organisationId?: string,
    @Query('actifs') actifs?: string,
    @Query('typeProduit') typeProduit?: string,
  ): Promise<BaremeCommissionResponseDto[]> {
    let entities;

    if (actifs === 'true') {
      entities = await this.getUseCase.executeActifs(organisationId);
    } else if (typeProduit) {
      entities = await this.getUseCase.executeByTypeProduit(typeProduit);
    } else if (organisationId) {
      entities = await this.getUseCase.executeByOrganisationId(organisationId);
    } else {
      entities = await this.getUseCase.executeAll();
    }

    return entities.map(BaremeCommissionMapper.toResponse);
  }

  @Get('applicable')
  @ApiOperation({ summary: 'Trouver le barème applicable' })
  @ApiQuery({ name: 'organisationId', required: true })
  @ApiQuery({ name: 'typeProduit', required: false })
  @ApiQuery({ name: 'profilRemuneration', required: false })
  async findApplicable(
    @Query('organisationId') organisationId: string,
    @Query('typeProduit') typeProduit?: string,
    @Query('profilRemuneration') profilRemuneration?: string,
  ): Promise<BaremeCommissionResponseDto | null> {
    const entity = await this.getUseCase.executeApplicable(
      organisationId,
      typeProduit,
      profilRemuneration,
    );
    return entity ? BaremeCommissionMapper.toResponse(entity) : null;
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Récupérer un barème par code' })
  async findByCode(
    @Param('code') code: string,
  ): Promise<BaremeCommissionResponseDto | null> {
    const entity = await this.getUseCase.executeByCode(code);
    return entity ? BaremeCommissionMapper.toResponse(entity) : null;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un barème par ID' })
  async findOne(@Param('id') id: string): Promise<BaremeCommissionResponseDto> {
    const entity = await this.getUseCase.execute(id);
    return BaremeCommissionMapper.toResponse(entity);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un barème' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBaremeCommissionDto,
  ): Promise<BaremeCommissionResponseDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return BaremeCommissionMapper.toResponse(entity);
  }

  @Post(':id/nouvelle-version')
  @ApiOperation({
    summary: 'Créer une nouvelle version du barème (versioning)',
  })
  async creerNouvelleVersion(
    @Param('id') id: string,
    @Body() dto: UpdateBaremeCommissionDto,
    @Query('modifiePar') modifiePar: string,
    @Query('motif') motif: string,
  ): Promise<BaremeCommissionResponseDto> {
    const entity = await this.updateUseCase.executeNouvelleVersion(
      id,
      dto,
      modifiePar,
      motif,
    );
    return BaremeCommissionMapper.toResponse(entity);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un barème' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
