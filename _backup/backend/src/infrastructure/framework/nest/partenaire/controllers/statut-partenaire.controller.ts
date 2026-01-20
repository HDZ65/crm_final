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
import { CreateStatutPartenaireDto } from '../../../../../applications/dto/statut-partenaire/create-statut-partenaire.dto';
import { UpdateStatutPartenaireDto } from '../../../../../applications/dto/statut-partenaire/update-statut-partenaire.dto';
import { StatutPartenaireDto } from '../../../../../applications/dto/statut-partenaire/statut-partenaire-response.dto';
import { CreateStatutPartenaireUseCase } from '../../../../../applications/usecase/statut-partenaire/create-statut-partenaire.usecase';
import { GetStatutPartenaireUseCase } from '../../../../../applications/usecase/statut-partenaire/get-statut-partenaire.usecase';
import { UpdateStatutPartenaireUseCase } from '../../../../../applications/usecase/statut-partenaire/update-statut-partenaire.usecase';
import { DeleteStatutPartenaireUseCase } from '../../../../../applications/usecase/statut-partenaire/delete-statut-partenaire.usecase';

@Controller('statutpartenaires')
export class StatutPartenaireController {
  constructor(
    private readonly createUseCase: CreateStatutPartenaireUseCase,
    private readonly getUseCase: GetStatutPartenaireUseCase,
    private readonly updateUseCase: UpdateStatutPartenaireUseCase,
    private readonly deleteUseCase: DeleteStatutPartenaireUseCase,
  ) {}

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateStatutPartenaireDto,
  ): Promise<StatutPartenaireDto> {
    const entity = await this.createUseCase.execute(dto);
    return new StatutPartenaireDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(): Promise<StatutPartenaireDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new StatutPartenaireDto(e));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<StatutPartenaireDto> {
    const entity = await this.getUseCase.execute(id);
    return new StatutPartenaireDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStatutPartenaireDto,
  ): Promise<StatutPartenaireDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new StatutPartenaireDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
