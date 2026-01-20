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
import { CreateContratDto } from '../../../../../applications/dto/contrat/create-contrat.dto';
import { UpdateContratDto } from '../../../../../applications/dto/contrat/update-contrat.dto';
import { ContratDto } from '../../../../../applications/dto/contrat/contrat-response.dto';
import { CreateContratUseCase } from '../../../../../applications/usecase/contrat/create-contrat.usecase';
import { GetContratUseCase } from '../../../../../applications/usecase/contrat/get-contrat.usecase';
import { UpdateContratUseCase } from '../../../../../applications/usecase/contrat/update-contrat.usecase';
import { DeleteContratUseCase } from '../../../../../applications/usecase/contrat/delete-contrat.usecase';

@Controller('contrats')
export class ContratController {
  constructor(
    private readonly createUseCase: CreateContratUseCase,
    private readonly getUseCase: GetContratUseCase,
    private readonly updateUseCase: UpdateContratUseCase,
    private readonly deleteUseCase: DeleteContratUseCase,
  ) {}

  @Roles({ roles: ['realm:commercial', 'realm:manager', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateContratDto): Promise<ContratDto> {
    const entity = await this.createUseCase.execute(dto);
    return new ContratDto(entity);
  }

  @Roles({ roles: ['realm:commercial', 'realm:user'] })
  @Get()
  async findAll(): Promise<ContratDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new ContratDto(e));
  }

  @Roles({ roles: ['realm:commercial', 'realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ContratDto> {
    const entity = await this.getUseCase.execute(id);
    return new ContratDto(entity);
  }

  @Roles({ roles: ['realm:commercial', 'realm:manager', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContratDto,
  ): Promise<ContratDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new ContratDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
