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
import { CreateFactureDto } from '../../../../applications/dto/facture/create-facture.dto';
import { UpdateFactureDto } from '../../../../applications/dto/facture/update-facture.dto';
import { FactureDto } from '../../../../applications/dto/facture/facture-response.dto';
import { CreateFactureUseCase } from '../../../../applications/usecase/facture/create-facture.usecase';
import { GetFactureUseCase } from '../../../../applications/usecase/facture/get-facture.usecase';
import { UpdateFactureUseCase } from '../../../../applications/usecase/facture/update-facture.usecase';
import { DeleteFactureUseCase } from '../../../../applications/usecase/facture/delete-facture.usecase';

@Controller('factures')
export class FactureController {
  constructor(
    private readonly createUseCase: CreateFactureUseCase,
    private readonly getUseCase: GetFactureUseCase,
    private readonly updateUseCase: UpdateFactureUseCase,
    private readonly deleteUseCase: DeleteFactureUseCase,
  ) {}

  @Roles({ roles: ['realm:comptable', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateFactureDto): Promise<FactureDto> {
    const entity = await this.createUseCase.execute(dto);
    return new FactureDto(entity);
  }

  @Roles({ roles: ['realm:comptable', 'realm:manager', 'realm:admin'] })
  @Get()
  async findAll(): Promise<FactureDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new FactureDto(e));
  }

  @Roles({ roles: ['realm:comptable', 'realm:manager', 'realm:admin'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<FactureDto> {
    const entity = await this.getUseCase.execute(id);
    return new FactureDto(entity);
  }

  @Roles({ roles: ['realm:comptable', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFactureDto,
  ): Promise<FactureDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new FactureDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
