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
import { CreateSocieteDto } from '../../../../applications/dto/societe/create-societe.dto';
import { UpdateSocieteDto } from '../../../../applications/dto/societe/update-societe.dto';
import { SocieteDto } from '../../../../applications/dto/societe/societe-response.dto';
import { CreateSocieteUseCase } from '../../../../applications/usecase/societe/create-societe.usecase';
import { GetSocieteUseCase } from '../../../../applications/usecase/societe/get-societe.usecase';
import { UpdateSocieteUseCase } from '../../../../applications/usecase/societe/update-societe.usecase';
import { DeleteSocieteUseCase } from '../../../../applications/usecase/societe/delete-societe.usecase';

@Controller('societes')
export class SocieteController {
  constructor(
    private readonly createUseCase: CreateSocieteUseCase,
    private readonly getUseCase: GetSocieteUseCase,
    private readonly updateUseCase: UpdateSocieteUseCase,
    private readonly deleteUseCase: DeleteSocieteUseCase,
  ) {}

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSocieteDto): Promise<SocieteDto> {
    const entity = await this.createUseCase.execute(dto);
    return new SocieteDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(@Query('organisationId') organisationId?: string): Promise<SocieteDto[]> {
    const entities = organisationId
      ? await this.getUseCase.executeByOrganisation(organisationId)
      : await this.getUseCase.executeAll();
    return entities.map((entity) => new SocieteDto(entity));
  }

  /**
   * Alias pour récupérer les sociétés comme "groupes" pour le filtrage
   * Les sociétés servent de groupes pour filtrer les contrats
   */
  @Roles({ roles: ['realm:user'] })
  @Get('groupes')
  async findAllAsGroupes(@Query('organisationId') organisationId?: string): Promise<SocieteDto[]> {
    const entities = organisationId
      ? await this.getUseCase.executeByOrganisation(organisationId)
      : await this.getUseCase.executeAll();
    return entities.map((entity) => new SocieteDto(entity));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SocieteDto> {
    const entity = await this.getUseCase.execute(id);
    return new SocieteDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSocieteDto,
  ): Promise<SocieteDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new SocieteDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
