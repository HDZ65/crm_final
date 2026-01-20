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
import { CreateStatutContratDto } from '../../../../../applications/dto/statut-contrat/create-statut-contrat.dto';
import { UpdateStatutContratDto } from '../../../../../applications/dto/statut-contrat/update-statut-contrat.dto';
import { StatutContratDto } from '../../../../../applications/dto/statut-contrat/statut-contrat-response.dto';
import { CreateStatutContratUseCase } from '../../../../../applications/usecase/statut-contrat/create-statut-contrat.usecase';
import { GetStatutContratUseCase } from '../../../../../applications/usecase/statut-contrat/get-statut-contrat.usecase';
import { UpdateStatutContratUseCase } from '../../../../../applications/usecase/statut-contrat/update-statut-contrat.usecase';
import { DeleteStatutContratUseCase } from '../../../../../applications/usecase/statut-contrat/delete-statut-contrat.usecase';

@Controller('statutcontrats')
export class StatutContratController {
  constructor(
    private readonly createUseCase: CreateStatutContratUseCase,
    private readonly getUseCase: GetStatutContratUseCase,
    private readonly updateUseCase: UpdateStatutContratUseCase,
    private readonly deleteUseCase: DeleteStatutContratUseCase,
  ) {}

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateStatutContratDto): Promise<StatutContratDto> {
    const entity = await this.createUseCase.execute(dto);
    return new StatutContratDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(): Promise<StatutContratDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new StatutContratDto(e));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<StatutContratDto> {
    const entity = await this.getUseCase.execute(id);
    return new StatutContratDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStatutContratDto,
  ): Promise<StatutContratDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new StatutContratDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
