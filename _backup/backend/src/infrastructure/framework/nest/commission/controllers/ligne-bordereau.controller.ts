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
import { CreateLigneBordereauUseCase } from '../../../../../applications/usecase/ligne-bordereau/create-ligne-bordereau.usecase';
import { GetLigneBordereauUseCase } from '../../../../../applications/usecase/ligne-bordereau/get-ligne-bordereau.usecase';
import { UpdateLigneBordereauUseCase } from '../../../../../applications/usecase/ligne-bordereau/update-ligne-bordereau.usecase';
import { DeleteLigneBordereauUseCase } from '../../../../../applications/usecase/ligne-bordereau/delete-ligne-bordereau.usecase';
import { CreateLigneBordereauDto } from '../../../../../applications/dto/ligne-bordereau/create-ligne-bordereau.dto';
import { UpdateLigneBordereauDto } from '../../../../../applications/dto/ligne-bordereau/update-ligne-bordereau.dto';
import { LigneBordereauResponseDto } from '../../../../../applications/dto/ligne-bordereau/ligne-bordereau-response.dto';
import { LigneBordereauMapper } from '../../../../../applications/mapper/ligne-bordereau.mapper';

@ApiTags('Lignes Bordereau')
@Controller('lignes-bordereau')
export class LigneBordereauController {
  constructor(
    private readonly createUseCase: CreateLigneBordereauUseCase,
    private readonly getUseCase: GetLigneBordereauUseCase,
    private readonly updateUseCase: UpdateLigneBordereauUseCase,
    private readonly deleteUseCase: DeleteLigneBordereauUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer une ligne de bordereau' })
  async create(
    @Body() dto: CreateLigneBordereauDto,
  ): Promise<LigneBordereauResponseDto> {
    const entity = await this.createUseCase.execute(dto);
    return LigneBordereauMapper.toResponse(entity);
  }

  @Get()
  @ApiOperation({ summary: "Récupérer les lignes d'un bordereau" })
  @ApiQuery({ name: 'bordereauId', required: true })
  @ApiQuery({ name: 'selectionnees', required: false, type: Boolean })
  async findByBordereau(
    @Query('bordereauId') bordereauId: string,
    @Query('selectionnees') selectionnees?: string,
  ): Promise<LigneBordereauResponseDto[]> {
    let entities;

    if (selectionnees === 'true') {
      entities = await this.getUseCase.executeSelectionnees(bordereauId);
    } else {
      entities = await this.getUseCase.executeByBordereauId(bordereauId);
    }

    return entities.map(LigneBordereauMapper.toResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une ligne par ID' })
  async findOne(@Param('id') id: string): Promise<LigneBordereauResponseDto> {
    const entity = await this.getUseCase.execute(id);
    return LigneBordereauMapper.toResponse(entity);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une ligne' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLigneBordereauDto,
  ): Promise<LigneBordereauResponseDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return LigneBordereauMapper.toResponse(entity);
  }

  @Post(':id/selectionner')
  @ApiOperation({ summary: 'Sélectionner une ligne (cocher)' })
  async selectionner(
    @Param('id') id: string,
  ): Promise<LigneBordereauResponseDto> {
    const entity = await this.updateUseCase.executeSelectionner(id);
    return LigneBordereauMapper.toResponse(entity);
  }

  @Post(':id/deselectionner')
  @ApiOperation({
    summary: 'Désélectionner une ligne (décocher) avec motif obligatoire',
  })
  async deselectionner(
    @Param('id') id: string,
    @Body('motif') motif: string,
    @Body('validateurId') validateurId: string,
  ): Promise<LigneBordereauResponseDto> {
    const entity = await this.updateUseCase.executeDeselectionner(
      id,
      motif,
      validateurId,
    );
    return LigneBordereauMapper.toResponse(entity);
  }

  @Post(':id/valider')
  @ApiOperation({ summary: 'Valider une ligne' })
  async valider(
    @Param('id') id: string,
    @Body('validateurId') validateurId: string,
  ): Promise<LigneBordereauResponseDto> {
    const entity = await this.updateUseCase.executeValider(id, validateurId);
    return LigneBordereauMapper.toResponse(entity);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une ligne' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
