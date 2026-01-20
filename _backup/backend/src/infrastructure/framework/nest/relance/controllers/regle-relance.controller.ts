import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Roles } from 'nest-keycloak-connect';
import { CreateRegleRelanceDto } from '../../../../../applications/dto/regle-relance/create-regle-relance.dto';
import { UpdateRegleRelanceDto } from '../../../../../applications/dto/regle-relance/update-regle-relance.dto';
import { RegleRelanceDto } from '../../../../../applications/dto/regle-relance/regle-relance-response.dto';
import { CreateRegleRelanceUseCase } from '../../../../../applications/usecase/regle-relance/create-regle-relance.usecase';
import { GetRegleRelanceUseCase } from '../../../../../applications/usecase/regle-relance/get-regle-relance.usecase';
import { UpdateRegleRelanceUseCase } from '../../../../../applications/usecase/regle-relance/update-regle-relance.usecase';
import { DeleteRegleRelanceUseCase } from '../../../../../applications/usecase/regle-relance/delete-regle-relance.usecase';
import { RelanceEngineService } from '../../../../services/relance-engine.service';
import { RelanceDeclencheur } from '../../../../../core/domain/regle-relance.entity';

@Controller('regles-relance')
export class RegleRelanceController {
  constructor(
    private readonly createUseCase: CreateRegleRelanceUseCase,
    private readonly getUseCase: GetRegleRelanceUseCase,
    private readonly updateUseCase: UpdateRegleRelanceUseCase,
    private readonly deleteUseCase: DeleteRegleRelanceUseCase,
    private readonly relanceEngineService: RelanceEngineService,
  ) {}

  @Roles({ roles: ['realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateRegleRelanceDto): Promise<RegleRelanceDto> {
    const entity = await this.createUseCase.execute(dto);
    return new RegleRelanceDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(
    @Query('organisationId') organisationId?: string,
    @Query('actif') actif?: string,
    @Query('declencheur') declencheur?: string,
  ): Promise<RegleRelanceDto[]> {
    let entities;

    if (actif === 'true' && organisationId) {
      if (declencheur) {
        entities = await this.getUseCase.executeActivesByDeclencheur(
          organisationId,
          declencheur as RelanceDeclencheur,
        );
      } else {
        entities = await this.getUseCase.executeActives(organisationId);
      }
    } else if (declencheur && organisationId) {
      entities = await this.getUseCase.executeByDeclencheur(
        organisationId,
        declencheur as RelanceDeclencheur,
      );
    } else if (organisationId) {
      entities = await this.getUseCase.executeByOrganisationId(organisationId);
    } else {
      entities = await this.getUseCase.executeAll();
    }

    return entities.map((e) => new RegleRelanceDto(e));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<RegleRelanceDto> {
    const entity = await this.getUseCase.execute(id);
    return new RegleRelanceDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRegleRelanceDto,
  ): Promise<RegleRelanceDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new RegleRelanceDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Put(':id/activer')
  async activer(@Param('id') id: string): Promise<RegleRelanceDto> {
    const entity = await this.updateUseCase.activer(id);
    return new RegleRelanceDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Put(':id/desactiver')
  async desactiver(@Param('id') id: string): Promise<RegleRelanceDto> {
    const entity = await this.updateUseCase.desactiver(id);
    return new RegleRelanceDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }

  @Roles({ roles: ['realm:admin'] })
  @Post('executer')
  async executeRelances(
    @Body() body: { organisationId: string },
  ): Promise<{ success: boolean; message: string }> {
    return await this.relanceEngineService.executeManually(body.organisationId);
  }
}
