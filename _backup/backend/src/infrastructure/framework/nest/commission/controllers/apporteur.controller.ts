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
import { CreateApporteurUseCase } from '../../../../../applications/usecase/apporteur/create-apporteur.usecase';
import { GetApporteurUseCase } from '../../../../../applications/usecase/apporteur/get-apporteur.usecase';
import { UpdateApporteurUseCase } from '../../../../../applications/usecase/apporteur/update-apporteur.usecase';
import { DeleteApporteurUseCase } from '../../../../../applications/usecase/apporteur/delete-apporteur.usecase';
import { CreateApporteurDto } from '../../../../../applications/dto/apporteur/create-apporteur.dto';
import { UpdateApporteurDto } from '../../../../../applications/dto/apporteur/update-apporteur.dto';
import { ApporteurResponseDto } from '../../../../../applications/dto/apporteur/apporteur-response.dto';
import { ApporteurMapper } from '../../../../../applications/mapper/apporteur.mapper';

@ApiTags('Apporteurs')
@Controller('apporteurs')
export class ApporteurController {
  constructor(
    private readonly createUseCase: CreateApporteurUseCase,
    private readonly getUseCase: GetApporteurUseCase,
    private readonly updateUseCase: UpdateApporteurUseCase,
    private readonly deleteUseCase: DeleteApporteurUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer un apporteur' })
  async create(@Body() dto: CreateApporteurDto): Promise<ApporteurResponseDto> {
    const entity = await this.createUseCase.execute(dto);
    return ApporteurMapper.toResponse(entity);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les apporteurs' })
  @ApiQuery({ name: 'organisationId', required: false })
  async findAll(
    @Query('organisationId') organisationId?: string,
  ): Promise<ApporteurResponseDto[]> {
    const entities = organisationId
      ? await this.getUseCase.executeByOrganisationId(organisationId)
      : await this.getUseCase.executeAll();
    return entities.map(ApporteurMapper.toResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un apporteur par ID' })
  async findOne(@Param('id') id: string): Promise<ApporteurResponseDto> {
    const entity = await this.getUseCase.execute(id);
    return ApporteurMapper.toResponse(entity);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un apporteur' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateApporteurDto,
  ): Promise<ApporteurResponseDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return ApporteurMapper.toResponse(entity);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un apporteur' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
