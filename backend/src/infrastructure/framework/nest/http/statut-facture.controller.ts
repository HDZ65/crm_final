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
import { CreateStatutFactureDto } from '../../../../applications/dto/statut-facture/create-statut-facture.dto';
import { UpdateStatutFactureDto } from '../../../../applications/dto/statut-facture/update-statut-facture.dto';
import { StatutFactureDto } from '../../../../applications/dto/statut-facture/statut-facture-response.dto';
import { CreateStatutFactureUseCase } from '../../../../applications/usecase/statut-facture/create-statut-facture.usecase';
import { GetStatutFactureUseCase } from '../../../../applications/usecase/statut-facture/get-statut-facture.usecase';
import { UpdateStatutFactureUseCase } from '../../../../applications/usecase/statut-facture/update-statut-facture.usecase';
import { DeleteStatutFactureUseCase } from '../../../../applications/usecase/statut-facture/delete-statut-facture.usecase';

@Controller('statutfactures')
export class StatutFactureController {
  constructor(
    private readonly createUseCase: CreateStatutFactureUseCase,
    private readonly getUseCase: GetStatutFactureUseCase,
    private readonly updateUseCase: UpdateStatutFactureUseCase,
    private readonly deleteUseCase: DeleteStatutFactureUseCase,
  ) {}

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateStatutFactureDto): Promise<StatutFactureDto> {
    const entity = await this.createUseCase.execute(dto);
    return new StatutFactureDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(): Promise<StatutFactureDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new StatutFactureDto(e));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<StatutFactureDto> {
    const entity = await this.getUseCase.execute(id);
    return new StatutFactureDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStatutFactureDto,
  ): Promise<StatutFactureDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new StatutFactureDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
