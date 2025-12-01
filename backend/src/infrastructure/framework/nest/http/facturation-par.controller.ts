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
import { CreateFacturationParDto } from '../../../../applications/dto/facturation-par/create-facturation-par.dto';
import { UpdateFacturationParDto } from '../../../../applications/dto/facturation-par/update-facturation-par.dto';
import { FacturationParDto } from '../../../../applications/dto/facturation-par/facturation-par-response.dto';
import { CreateFacturationParUseCase } from '../../../../applications/usecase/facturation-par/create-facturation-par.usecase';
import { GetFacturationParUseCase } from '../../../../applications/usecase/facturation-par/get-facturation-par.usecase';
import { UpdateFacturationParUseCase } from '../../../../applications/usecase/facturation-par/update-facturation-par.usecase';
import { DeleteFacturationParUseCase } from '../../../../applications/usecase/facturation-par/delete-facturation-par.usecase';

@Controller('facturationpars')
export class FacturationParController {
  constructor(
    private readonly createUseCase: CreateFacturationParUseCase,
    private readonly getUseCase: GetFacturationParUseCase,
    private readonly updateUseCase: UpdateFacturationParUseCase,
    private readonly deleteUseCase: DeleteFacturationParUseCase,
  ) {}

  @Roles({ roles: ['realm:comptable', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateFacturationParDto,
  ): Promise<FacturationParDto> {
    const entity = await this.createUseCase.execute(dto);
    return new FacturationParDto(entity);
  }

  @Roles({ roles: ['realm:comptable', 'realm:manager', 'realm:admin'] })
  @Get()
  async findAll(): Promise<FacturationParDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new FacturationParDto(e));
  }

  @Roles({ roles: ['realm:comptable', 'realm:manager', 'realm:admin'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<FacturationParDto> {
    const entity = await this.getUseCase.execute(id);
    return new FacturationParDto(entity);
  }

  @Roles({ roles: ['realm:comptable', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFacturationParDto,
  ): Promise<FacturationParDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new FacturationParDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
