import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateStatutCommissionUseCase } from '../../../../applications/usecase/statut-commission/create-statut-commission.usecase';
import { GetStatutCommissionUseCase } from '../../../../applications/usecase/statut-commission/get-statut-commission.usecase';
import { UpdateStatutCommissionUseCase } from '../../../../applications/usecase/statut-commission/update-statut-commission.usecase';
import { DeleteStatutCommissionUseCase } from '../../../../applications/usecase/statut-commission/delete-statut-commission.usecase';
import { CreateStatutCommissionDto } from '../../../../applications/dto/statut-commission/create-statut-commission.dto';
import { UpdateStatutCommissionDto } from '../../../../applications/dto/statut-commission/update-statut-commission.dto';
import { StatutCommissionResponseDto } from '../../../../applications/dto/statut-commission/statut-commission-response.dto';
import { StatutCommissionMapper } from '../../../../applications/mapper/statut-commission.mapper';

@ApiTags('Statuts Commission')
@Controller('statuts-commission')
export class StatutCommissionController {
  constructor(
    private readonly createUseCase: CreateStatutCommissionUseCase,
    private readonly getUseCase: GetStatutCommissionUseCase,
    private readonly updateUseCase: UpdateStatutCommissionUseCase,
    private readonly deleteUseCase: DeleteStatutCommissionUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer un statut de commission' })
  async create(
    @Body() dto: CreateStatutCommissionDto,
  ): Promise<StatutCommissionResponseDto> {
    const entity = await this.createUseCase.execute(dto);
    return StatutCommissionMapper.toResponse(entity);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les statuts de commission' })
  async findAll(): Promise<StatutCommissionResponseDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map(StatutCommissionMapper.toResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un statut de commission par ID' })
  async findOne(@Param('id') id: string): Promise<StatutCommissionResponseDto> {
    const entity = await this.getUseCase.execute(id);
    return StatutCommissionMapper.toResponse(entity);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un statut de commission' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStatutCommissionDto,
  ): Promise<StatutCommissionResponseDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return StatutCommissionMapper.toResponse(entity);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un statut de commission' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
