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
import { CreateRepriseCommissionUseCase } from '../../../../../applications/usecase/reprise-commission/create-reprise-commission.usecase';
import { GetRepriseCommissionUseCase } from '../../../../../applications/usecase/reprise-commission/get-reprise-commission.usecase';
import { UpdateRepriseCommissionUseCase } from '../../../../../applications/usecase/reprise-commission/update-reprise-commission.usecase';
import { DeleteRepriseCommissionUseCase } from '../../../../../applications/usecase/reprise-commission/delete-reprise-commission.usecase';
import { CreateRepriseCommissionDto } from '../../../../../applications/dto/reprise-commission/create-reprise-commission.dto';
import { UpdateRepriseCommissionDto } from '../../../../../applications/dto/reprise-commission/update-reprise-commission.dto';
import { RepriseCommissionResponseDto } from '../../../../../applications/dto/reprise-commission/reprise-commission-response.dto';
import { RepriseCommissionMapper } from '../../../../../applications/mapper/reprise-commission.mapper';

@ApiTags('Reprises Commission')
@Controller('reprises-commission')
export class RepriseCommissionController {
  constructor(
    private readonly createUseCase: CreateRepriseCommissionUseCase,
    private readonly getUseCase: GetRepriseCommissionUseCase,
    private readonly updateUseCase: UpdateRepriseCommissionUseCase,
    private readonly deleteUseCase: DeleteRepriseCommissionUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer une reprise de commission' })
  async create(
    @Body() dto: CreateRepriseCommissionDto,
  ): Promise<RepriseCommissionResponseDto> {
    const entity = await this.createUseCase.execute(dto);
    return RepriseCommissionMapper.toResponse(entity);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les reprises' })
  @ApiQuery({ name: 'organisationId', required: false })
  @ApiQuery({ name: 'apporteurId', required: false })
  @ApiQuery({ name: 'contratId', required: false })
  @ApiQuery({ name: 'periode', required: false })
  @ApiQuery({ name: 'enAttente', required: false, type: Boolean })
  async findAll(
    @Query('organisationId') organisationId?: string,
    @Query('apporteurId') apporteurId?: string,
    @Query('contratId') contratId?: string,
    @Query('periode') periode?: string,
    @Query('enAttente') enAttente?: string,
  ): Promise<RepriseCommissionResponseDto[]> {
    let entities;

    if (enAttente === 'true') {
      entities = await this.getUseCase.executeEnAttente(organisationId);
    } else if (apporteurId) {
      entities = await this.getUseCase.executeByApporteurId(apporteurId);
    } else if (contratId) {
      entities = await this.getUseCase.executeByContratId(contratId);
    } else if (periode) {
      entities = await this.getUseCase.executeByPeriode(periode);
    } else if (organisationId) {
      entities = await this.getUseCase.executeByOrganisationId(organisationId);
    } else {
      entities = await this.getUseCase.executeAll();
    }

    return entities.map(RepriseCommissionMapper.toResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une reprise par ID' })
  async findOne(
    @Param('id') id: string,
  ): Promise<RepriseCommissionResponseDto> {
    const entity = await this.getUseCase.execute(id);
    return RepriseCommissionMapper.toResponse(entity);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une reprise' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRepriseCommissionDto,
  ): Promise<RepriseCommissionResponseDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return RepriseCommissionMapper.toResponse(entity);
  }

  @Post(':id/appliquer')
  @ApiOperation({ summary: 'Appliquer une reprise à un bordereau' })
  async appliquer(
    @Param('id') id: string,
    @Query('bordereauId') bordereauId: string,
  ): Promise<RepriseCommissionResponseDto> {
    const entity = await this.updateUseCase.executeAppliquer(id, bordereauId);
    return RepriseCommissionMapper.toResponse(entity);
  }

  @Post(':id/annuler')
  @ApiOperation({ summary: 'Annuler une reprise' })
  async annuler(
    @Param('id') id: string,
    @Body('motif') motif: string,
  ): Promise<RepriseCommissionResponseDto> {
    const entity = await this.updateUseCase.executeAnnuler(id, motif);
    return RepriseCommissionMapper.toResponse(entity);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une reprise' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
