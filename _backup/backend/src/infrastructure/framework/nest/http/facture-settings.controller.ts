import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import {
  CreateFactureSettingsDto,
  UpdateFactureSettingsDto,
  FactureSettingsResponseDto,
} from '../../../../applications/dto/facture-settings';
import {
  CreateFactureSettingsUseCase,
  GetFactureSettingsUseCase,
  UpdateFactureSettingsUseCase,
  DeleteFactureSettingsUseCase,
} from '../../../../applications/usecase/facture-settings';
import { FactureSettingsMapper } from '../../../../applications/mapper/facture-settings.mapper';

@ApiTags('Facture Settings')
@Controller('facture-settings')
export class FactureSettingsController {
  constructor(
    private readonly createUseCase: CreateFactureSettingsUseCase,
    private readonly getUseCase: GetFactureSettingsUseCase,
    private readonly updateUseCase: UpdateFactureSettingsUseCase,
    private readonly deleteUseCase: DeleteFactureSettingsUseCase,
    private readonly mapper: FactureSettingsMapper,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer les paramètres de facturation pour une société' })
  @ApiResponse({ status: 201, type: FactureSettingsResponseDto })
  @ApiResponse({ status: 409, description: 'Des paramètres existent déjà pour cette société' })
  async create(@Body() dto: CreateFactureSettingsDto): Promise<FactureSettingsResponseDto> {
    const entity = await this.createUseCase.execute(dto);
    return this.mapper.toResponse(entity);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les paramètres de facturation' })
  @ApiResponse({ status: 200, type: [FactureSettingsResponseDto] })
  async findAll(): Promise<FactureSettingsResponseDto[]> {
    const entities = await this.getUseCase.findAll();
    return entities.map((e) => this.mapper.toResponse(e));
  }

  @Get('societe/:societeId')
  @ApiOperation({ summary: 'Récupérer les paramètres de facturation d\'une société' })
  @ApiResponse({ status: 200, type: FactureSettingsResponseDto })
  @ApiResponse({ status: 404, description: 'Aucun paramètre trouvé' })
  async findBySocieteId(
    @Param('societeId', ParseUUIDPipe) societeId: string,
  ): Promise<FactureSettingsResponseDto | null> {
    const entity = await this.getUseCase.findBySocieteId(societeId);
    return entity ? this.mapper.toResponse(entity) : null;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer les paramètres de facturation par ID' })
  @ApiResponse({ status: 200, type: FactureSettingsResponseDto })
  @ApiResponse({ status: 404, description: 'Non trouvé' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FactureSettingsResponseDto> {
    const entity = await this.getUseCase.execute(id);
    return this.mapper.toResponse(entity);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour les paramètres de facturation' })
  @ApiResponse({ status: 200, type: FactureSettingsResponseDto })
  @ApiResponse({ status: 404, description: 'Non trouvé' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFactureSettingsDto,
  ): Promise<FactureSettingsResponseDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return this.mapper.toResponse(entity);
  }

  @Put('societe/:societeId')
  @ApiOperation({ summary: 'Créer ou mettre à jour les paramètres d\'une société (upsert)' })
  @ApiResponse({ status: 200, type: FactureSettingsResponseDto })
  async upsertBySocieteId(
    @Param('societeId', ParseUUIDPipe) societeId: string,
    @Body() dto: UpdateFactureSettingsDto,
  ): Promise<FactureSettingsResponseDto> {
    const entity = await this.updateUseCase.upsertBySocieteId(societeId, dto);
    return this.mapper.toResponse(entity);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer les paramètres de facturation' })
  @ApiResponse({ status: 204, description: 'Supprimé' })
  @ApiResponse({ status: 404, description: 'Non trouvé' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
