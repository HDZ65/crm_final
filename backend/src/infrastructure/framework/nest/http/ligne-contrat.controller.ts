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
import { CreateLigneContratDto } from '../../../../applications/dto/ligne-contrat/create-ligne-contrat.dto';
import { UpdateLigneContratDto } from '../../../../applications/dto/ligne-contrat/update-ligne-contrat.dto';
import { LigneContratDto } from '../../../../applications/dto/ligne-contrat/ligne-contrat-response.dto';
import { CreateLigneContratUseCase } from '../../../../applications/usecase/ligne-contrat/create-ligne-contrat.usecase';
import { GetLigneContratUseCase } from '../../../../applications/usecase/ligne-contrat/get-ligne-contrat.usecase';
import { UpdateLigneContratUseCase } from '../../../../applications/usecase/ligne-contrat/update-ligne-contrat.usecase';
import { DeleteLigneContratUseCase } from '../../../../applications/usecase/ligne-contrat/delete-ligne-contrat.usecase';

@Controller('lignecontrats')
export class LigneContratController {
  constructor(
    private readonly createUseCase: CreateLigneContratUseCase,
    private readonly getUseCase: GetLigneContratUseCase,
    private readonly updateUseCase: UpdateLigneContratUseCase,
    private readonly deleteUseCase: DeleteLigneContratUseCase,
  ) {}

  @Roles({ roles: ['realm:commercial', 'realm:manager', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateLigneContratDto): Promise<LigneContratDto> {
    const entity = await this.createUseCase.execute(dto);
    return new LigneContratDto(entity);
  }

  @Roles({ roles: ['realm:commercial', 'realm:user'] })
  @Get()
  async findAll(): Promise<LigneContratDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new LigneContratDto(e));
  }

  @Roles({ roles: ['realm:commercial', 'realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<LigneContratDto> {
    const entity = await this.getUseCase.execute(id);
    return new LigneContratDto(entity);
  }

  @Roles({ roles: ['realm:commercial', 'realm:manager', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLigneContratDto,
  ): Promise<LigneContratDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new LigneContratDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
