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
import { CreateMembreGroupeDto } from '../../../../applications/dto/membre-groupe/create-membre-groupe.dto';
import { UpdateMembreGroupeDto } from '../../../../applications/dto/membre-groupe/update-membre-groupe.dto';
import { MembreGroupeDto } from '../../../../applications/dto/membre-groupe/membre-groupe-response.dto';
import { CreateMembreGroupeUseCase } from '../../../../applications/usecase/membre-groupe/create-membre-groupe.usecase';
import { GetMembreGroupeUseCase } from '../../../../applications/usecase/membre-groupe/get-membre-groupe.usecase';
import { UpdateMembreGroupeUseCase } from '../../../../applications/usecase/membre-groupe/update-membre-groupe.usecase';
import { DeleteMembreGroupeUseCase } from '../../../../applications/usecase/membre-groupe/delete-membre-groupe.usecase';

@Controller('membregroupes')
export class MembreGroupeController {
  constructor(
    private readonly createUseCase: CreateMembreGroupeUseCase,
    private readonly getUseCase: GetMembreGroupeUseCase,
    private readonly updateUseCase: UpdateMembreGroupeUseCase,
    private readonly deleteUseCase: DeleteMembreGroupeUseCase,
  ) {}

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateMembreGroupeDto): Promise<MembreGroupeDto> {
    const entity = await this.createUseCase.execute(dto);
    return new MembreGroupeDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(): Promise<MembreGroupeDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((entity) => new MembreGroupeDto(entity));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<MembreGroupeDto> {
    const entity = await this.getUseCase.execute(id);
    return new MembreGroupeDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMembreGroupeDto,
  ): Promise<MembreGroupeDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new MembreGroupeDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
