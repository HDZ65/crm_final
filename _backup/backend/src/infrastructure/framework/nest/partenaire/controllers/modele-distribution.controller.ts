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
import { CreateModeleDistributionDto } from '../../../../../applications/dto/modele-distribution/create-modele-distribution.dto';
import { UpdateModeleDistributionDto } from '../../../../../applications/dto/modele-distribution/update-modele-distribution.dto';
import { ModeleDistributionDto } from '../../../../../applications/dto/modele-distribution/modele-distribution-response.dto';
import { CreateModeleDistributionUseCase } from '../../../../../applications/usecase/modele-distribution/create-modele-distribution.usecase';
import { GetModeleDistributionUseCase } from '../../../../../applications/usecase/modele-distribution/get-modele-distribution.usecase';
import { UpdateModeleDistributionUseCase } from '../../../../../applications/usecase/modele-distribution/update-modele-distribution.usecase';
import { DeleteModeleDistributionUseCase } from '../../../../../applications/usecase/modele-distribution/delete-modele-distribution.usecase';

@Controller('modeledistributions')
export class ModeleDistributionController {
  constructor(
    private readonly createUseCase: CreateModeleDistributionUseCase,
    private readonly getUseCase: GetModeleDistributionUseCase,
    private readonly updateUseCase: UpdateModeleDistributionUseCase,
    private readonly deleteUseCase: DeleteModeleDistributionUseCase,
  ) {}

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateModeleDistributionDto,
  ): Promise<ModeleDistributionDto> {
    const entity = await this.createUseCase.execute(dto);
    return new ModeleDistributionDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(): Promise<ModeleDistributionDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new ModeleDistributionDto(e));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ModeleDistributionDto> {
    const entity = await this.getUseCase.execute(id);
    return new ModeleDistributionDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateModeleDistributionDto,
  ): Promise<ModeleDistributionDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new ModeleDistributionDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
