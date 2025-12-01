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
import { CreateStatutClientDto } from '../../../../applications/dto/statut-client/create-statut-client.dto';
import { UpdateStatutClientDto } from '../../../../applications/dto/statut-client/update-statut-client.dto';
import { StatutClientDto } from '../../../../applications/dto/statut-client/statut-client-response.dto';
import { CreateStatutClientUseCase } from '../../../../applications/usecase/statut-client/create-statut-client.usecase';
import { GetStatutClientUseCase } from '../../../../applications/usecase/statut-client/get-statut-client.usecase';
import { UpdateStatutClientUseCase } from '../../../../applications/usecase/statut-client/update-statut-client.usecase';
import { DeleteStatutClientUseCase } from '../../../../applications/usecase/statut-client/delete-statut-client.usecase';

@Controller('statutclients')
export class StatutClientController {
  constructor(
    private readonly createUseCase: CreateStatutClientUseCase,
    private readonly getUseCase: GetStatutClientUseCase,
    private readonly updateUseCase: UpdateStatutClientUseCase,
    private readonly deleteUseCase: DeleteStatutClientUseCase,
  ) {}

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateStatutClientDto): Promise<StatutClientDto> {
    const entity = await this.createUseCase.execute(dto);
    return new StatutClientDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(): Promise<StatutClientDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new StatutClientDto(e));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<StatutClientDto> {
    const entity = await this.getUseCase.execute(id);
    return new StatutClientDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStatutClientDto,
  ): Promise<StatutClientDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new StatutClientDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
