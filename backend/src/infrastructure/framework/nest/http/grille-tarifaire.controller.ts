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
import { CreateGrilleTarifaireDto } from '../../../../applications/dto/grille-tarifaire/create-grille-tarifaire.dto';
import { UpdateGrilleTarifaireDto } from '../../../../applications/dto/grille-tarifaire/update-grille-tarifaire.dto';
import { GrilleTarifaireDto } from '../../../../applications/dto/grille-tarifaire/grille-tarifaire-response.dto';
import { CreateGrilleTarifaireUseCase } from '../../../../applications/usecase/grille-tarifaire/create-grille-tarifaire.usecase';
import { GetGrilleTarifaireUseCase } from '../../../../applications/usecase/grille-tarifaire/get-grille-tarifaire.usecase';
import { UpdateGrilleTarifaireUseCase } from '../../../../applications/usecase/grille-tarifaire/update-grille-tarifaire.usecase';
import { DeleteGrilleTarifaireUseCase } from '../../../../applications/usecase/grille-tarifaire/delete-grille-tarifaire.usecase';

@Controller('grilletarifaires')
export class GrilleTarifaireController {
  constructor(
    private readonly createUseCase: CreateGrilleTarifaireUseCase,
    private readonly getUseCase: GetGrilleTarifaireUseCase,
    private readonly updateUseCase: UpdateGrilleTarifaireUseCase,
    private readonly deleteUseCase: DeleteGrilleTarifaireUseCase,
  ) {}

  @Roles({ roles: ['realm:commercial', 'realm:manager', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateGrilleTarifaireDto,
  ): Promise<GrilleTarifaireDto> {
    const entity = await this.createUseCase.execute(dto);
    return new GrilleTarifaireDto(entity);
  }

  @Roles({ roles: ['realm:commercial', 'realm:user'] })
  @Get()
  async findAll(): Promise<GrilleTarifaireDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new GrilleTarifaireDto(e));
  }

  @Roles({ roles: ['realm:commercial', 'realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<GrilleTarifaireDto> {
    const entity = await this.getUseCase.execute(id);
    return new GrilleTarifaireDto(entity);
  }

  @Roles({ roles: ['realm:commercial', 'realm:manager', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGrilleTarifaireDto,
  ): Promise<GrilleTarifaireDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new GrilleTarifaireDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
