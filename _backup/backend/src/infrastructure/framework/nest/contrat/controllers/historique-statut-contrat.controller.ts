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
import { CreateHistoriqueStatutContratDto } from '../../../../../applications/dto/historique-statut-contrat/create-historique-statut-contrat.dto';
import { UpdateHistoriqueStatutContratDto } from '../../../../../applications/dto/historique-statut-contrat/update-historique-statut-contrat.dto';
import { HistoriqueStatutContratDto } from '../../../../../applications/dto/historique-statut-contrat/historique-statut-contrat-response.dto';
import { CreateHistoriqueStatutContratUseCase } from '../../../../../applications/usecase/historique-statut-contrat/create-historique-statut-contrat.usecase';
import { GetHistoriqueStatutContratUseCase } from '../../../../../applications/usecase/historique-statut-contrat/get-historique-statut-contrat.usecase';
import { UpdateHistoriqueStatutContratUseCase } from '../../../../../applications/usecase/historique-statut-contrat/update-historique-statut-contrat.usecase';
import { DeleteHistoriqueStatutContratUseCase } from '../../../../../applications/usecase/historique-statut-contrat/delete-historique-statut-contrat.usecase';

@Controller('historiquestatutcontrats')
export class HistoriqueStatutContratController {
  constructor(
    private readonly createUseCase: CreateHistoriqueStatutContratUseCase,
    private readonly getUseCase: GetHistoriqueStatutContratUseCase,
    private readonly updateUseCase: UpdateHistoriqueStatutContratUseCase,
    private readonly deleteUseCase: DeleteHistoriqueStatutContratUseCase,
  ) {}

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateHistoriqueStatutContratDto,
  ): Promise<HistoriqueStatutContratDto> {
    const entity = await this.createUseCase.execute(dto);
    return new HistoriqueStatutContratDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(): Promise<HistoriqueStatutContratDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new HistoriqueStatutContratDto(e));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<HistoriqueStatutContratDto> {
    const entity = await this.getUseCase.execute(id);
    return new HistoriqueStatutContratDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateHistoriqueStatutContratDto,
  ): Promise<HistoriqueStatutContratDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new HistoriqueStatutContratDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
