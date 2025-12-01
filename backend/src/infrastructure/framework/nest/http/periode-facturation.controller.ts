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
import { CreatePeriodeFacturationDto } from '../../../../applications/dto/periode-facturation/create-periode-facturation.dto';
import { UpdatePeriodeFacturationDto } from '../../../../applications/dto/periode-facturation/update-periode-facturation.dto';
import { PeriodeFacturationDto } from '../../../../applications/dto/periode-facturation/periode-facturation-response.dto';
import { CreatePeriodeFacturationUseCase } from '../../../../applications/usecase/periode-facturation/create-periode-facturation.usecase';
import { GetPeriodeFacturationUseCase } from '../../../../applications/usecase/periode-facturation/get-periode-facturation.usecase';
import { UpdatePeriodeFacturationUseCase } from '../../../../applications/usecase/periode-facturation/update-periode-facturation.usecase';
import { DeletePeriodeFacturationUseCase } from '../../../../applications/usecase/periode-facturation/delete-periode-facturation.usecase';

@Controller('periodefacturations')
export class PeriodeFacturationController {
  constructor(
    private readonly createUseCase: CreatePeriodeFacturationUseCase,
    private readonly getUseCase: GetPeriodeFacturationUseCase,
    private readonly updateUseCase: UpdatePeriodeFacturationUseCase,
    private readonly deleteUseCase: DeletePeriodeFacturationUseCase,
  ) {}

  @Roles({ roles: ['realm:comptable', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreatePeriodeFacturationDto,
  ): Promise<PeriodeFacturationDto> {
    const entity = await this.createUseCase.execute(dto);
    return new PeriodeFacturationDto(entity);
  }

  @Roles({ roles: ['realm:comptable', 'realm:manager', 'realm:admin'] })
  @Get()
  async findAll(): Promise<PeriodeFacturationDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new PeriodeFacturationDto(e));
  }

  @Roles({ roles: ['realm:comptable', 'realm:manager', 'realm:admin'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PeriodeFacturationDto> {
    const entity = await this.getUseCase.execute(id);
    return new PeriodeFacturationDto(entity);
  }

  @Roles({ roles: ['realm:comptable', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePeriodeFacturationDto,
  ): Promise<PeriodeFacturationDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new PeriodeFacturationDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
