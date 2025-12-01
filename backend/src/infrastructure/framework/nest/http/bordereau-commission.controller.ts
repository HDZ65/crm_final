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
import { CreateBordereauCommissionUseCase } from '../../../../applications/usecase/bordereau-commission/create-bordereau-commission.usecase';
import { GetBordereauCommissionUseCase } from '../../../../applications/usecase/bordereau-commission/get-bordereau-commission.usecase';
import { UpdateBordereauCommissionUseCase } from '../../../../applications/usecase/bordereau-commission/update-bordereau-commission.usecase';
import { DeleteBordereauCommissionUseCase } from '../../../../applications/usecase/bordereau-commission/delete-bordereau-commission.usecase';
import { CreateBordereauCommissionDto } from '../../../../applications/dto/bordereau-commission/create-bordereau-commission.dto';
import { UpdateBordereauCommissionDto } from '../../../../applications/dto/bordereau-commission/update-bordereau-commission.dto';
import {
  BordereauCommissionResponseDto,
  BordereauWithDetailsResponseDto,
} from '../../../../applications/dto/bordereau-commission/bordereau-commission-response.dto';
import { BordereauCommissionMapper } from '../../../../applications/mapper/bordereau-commission.mapper';

@ApiTags('Bordereaux Commission')
@Controller('bordereaux-commission')
export class BordereauCommissionController {
  constructor(
    private readonly createUseCase: CreateBordereauCommissionUseCase,
    private readonly getUseCase: GetBordereauCommissionUseCase,
    private readonly updateUseCase: UpdateBordereauCommissionUseCase,
    private readonly deleteUseCase: DeleteBordereauCommissionUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer un bordereau de commission' })
  async create(
    @Body() dto: CreateBordereauCommissionDto,
  ): Promise<BordereauCommissionResponseDto> {
    const entity = await this.createUseCase.execute(dto);
    return BordereauCommissionMapper.toResponse(entity);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les bordereaux' })
  @ApiQuery({ name: 'organisationId', required: false })
  @ApiQuery({ name: 'apporteurId', required: false })
  @ApiQuery({ name: 'periode', required: false })
  @ApiQuery({ name: 'statut', required: false })
  async findAll(
    @Query('organisationId') organisationId?: string,
    @Query('apporteurId') apporteurId?: string,
    @Query('periode') periode?: string,
    @Query('statut') statut?: string,
  ): Promise<BordereauCommissionResponseDto[]> {
    let entities;

    if (apporteurId) {
      entities = await this.getUseCase.executeByApporteurId(apporteurId);
    } else if (periode) {
      entities = await this.getUseCase.executeByPeriode(periode);
    } else if (statut) {
      entities = await this.getUseCase.executeByStatut(statut);
    } else if (organisationId) {
      entities = await this.getUseCase.executeByOrganisationId(organisationId);
    } else {
      entities = await this.getUseCase.executeAll();
    }

    return entities.map(BordereauCommissionMapper.toResponse);
  }

  @Get('with-details')
  @ApiOperation({ summary: 'Récupérer les bordereaux avec détails apporteur' })
  @ApiQuery({ name: 'organisationId', required: false })
  async findAllWithDetails(
    @Query('organisationId') organisationId?: string,
  ): Promise<BordereauWithDetailsResponseDto[]> {
    const results = await this.getUseCase.executeAllWithDetails(organisationId);
    return results.map(BordereauCommissionMapper.toResponseWithDetails);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un bordereau par ID' })
  async findOne(
    @Param('id') id: string,
  ): Promise<BordereauCommissionResponseDto> {
    const entity = await this.getUseCase.execute(id);
    return BordereauCommissionMapper.toResponse(entity);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un bordereau' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBordereauCommissionDto,
  ): Promise<BordereauCommissionResponseDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return BordereauCommissionMapper.toResponse(entity);
  }

  @Post(':id/valider')
  @ApiOperation({ summary: 'Valider un bordereau (ADV)' })
  async valider(
    @Param('id') id: string,
    @Query('validateurId') validateurId: string,
  ): Promise<BordereauCommissionResponseDto> {
    const entity = await this.updateUseCase.executeValider(id, validateurId);
    return BordereauCommissionMapper.toResponse(entity);
  }

  @Post(':id/exporter')
  @ApiOperation({ summary: 'Exporter un bordereau (PDF/Excel)' })
  async exporter(
    @Param('id') id: string,
    @Body('pdfUrl') pdfUrl?: string,
    @Body('excelUrl') excelUrl?: string,
  ): Promise<BordereauCommissionResponseDto> {
    const entity = await this.updateUseCase.executeExporter(
      id,
      pdfUrl ?? null,
      excelUrl ?? null,
    );
    return BordereauCommissionMapper.toResponse(entity);
  }

  @Post(':id/recalculer')
  @ApiOperation({ summary: 'Recalculer les totaux du bordereau' })
  async recalculer(
    @Param('id') id: string,
  ): Promise<BordereauCommissionResponseDto> {
    const entity = await this.updateUseCase.executeRecalculerTotaux(id);
    return BordereauCommissionMapper.toResponse(entity);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un bordereau' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
