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
import { CreateEmissionFactureDto } from '../../../../applications/dto/emission-facture/create-emission-facture.dto';
import { UpdateEmissionFactureDto } from '../../../../applications/dto/emission-facture/update-emission-facture.dto';
import { EmissionFactureDto } from '../../../../applications/dto/emission-facture/emission-facture-response.dto';
import { CreateEmissionFactureUseCase } from '../../../../applications/usecase/emission-facture/create-emission-facture.usecase';
import { GetEmissionFactureUseCase } from '../../../../applications/usecase/emission-facture/get-emission-facture.usecase';
import { UpdateEmissionFactureUseCase } from '../../../../applications/usecase/emission-facture/update-emission-facture.usecase';
import { DeleteEmissionFactureUseCase } from '../../../../applications/usecase/emission-facture/delete-emission-facture.usecase';

@Controller('emissionfactures')
export class EmissionFactureController {
  constructor(
    private readonly createUseCase: CreateEmissionFactureUseCase,
    private readonly getUseCase: GetEmissionFactureUseCase,
    private readonly updateUseCase: UpdateEmissionFactureUseCase,
    private readonly deleteUseCase: DeleteEmissionFactureUseCase,
  ) {}

  @Roles({ roles: ['realm:comptable', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateEmissionFactureDto,
  ): Promise<EmissionFactureDto> {
    const entity = await this.createUseCase.execute(dto);
    return new EmissionFactureDto(entity);
  }

  @Roles({ roles: ['realm:comptable', 'realm:manager', 'realm:admin'] })
  @Get()
  async findAll(): Promise<EmissionFactureDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new EmissionFactureDto(e));
  }

  @Roles({ roles: ['realm:comptable', 'realm:manager', 'realm:admin'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<EmissionFactureDto> {
    const entity = await this.getUseCase.execute(id);
    return new EmissionFactureDto(entity);
  }

  @Roles({ roles: ['realm:comptable', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmissionFactureDto,
  ): Promise<EmissionFactureDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new EmissionFactureDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
