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
import { CreateActiviteDto } from '../../../../applications/dto/activite/create-activite.dto';
import { UpdateActiviteDto } from '../../../../applications/dto/activite/update-activite.dto';
import { ActiviteDto } from '../../../../applications/dto/activite/activite-response.dto';
import { CreateActiviteUseCase } from '../../../../applications/usecase/activite/create-activite.usecase';
import { GetActiviteUseCase } from '../../../../applications/usecase/activite/get-activite.usecase';
import { UpdateActiviteUseCase } from '../../../../applications/usecase/activite/update-activite.usecase';
import { DeleteActiviteUseCase } from '../../../../applications/usecase/activite/delete-activite.usecase';

@Controller('activites')
export class ActiviteController {
  constructor(
    private readonly createUseCase: CreateActiviteUseCase,
    private readonly getUseCase: GetActiviteUseCase,
    private readonly updateUseCase: UpdateActiviteUseCase,
    private readonly deleteUseCase: DeleteActiviteUseCase,
  ) {}

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateActiviteDto): Promise<ActiviteDto> {
    const entity = await this.createUseCase.execute(dto);
    return new ActiviteDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(): Promise<ActiviteDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new ActiviteDto(e));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ActiviteDto> {
    const entity = await this.getUseCase.execute(id);
    return new ActiviteDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateActiviteDto,
  ): Promise<ActiviteDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new ActiviteDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
