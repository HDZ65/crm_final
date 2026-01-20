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
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { Roles } from 'nest-keycloak-connect';
import { CreateTacheDto } from '../../../../../applications/dto/tache/create-tache.dto';
import { UpdateTacheDto } from '../../../../../applications/dto/tache/update-tache.dto';
import {
  TacheDto,
  TacheStatsDto,
  PaginatedTachesDto,
} from '../../../../../applications/dto/tache/tache-response.dto';
import { CreateTacheUseCase } from '../../../../../applications/usecase/tache/create-tache.usecase';
import { GetTacheUseCase } from '../../../../../applications/usecase/tache/get-tache.usecase';
import { UpdateTacheUseCase } from '../../../../../applications/usecase/tache/update-tache.usecase';
import { DeleteTacheUseCase } from '../../../../../applications/usecase/tache/delete-tache.usecase';
import { TacheStatut, TacheType } from '../../../../../core/domain/tache.entity';

@Controller('taches')
export class TacheController {
  constructor(
    private readonly createUseCase: CreateTacheUseCase,
    private readonly getUseCase: GetTacheUseCase,
    private readonly updateUseCase: UpdateTacheUseCase,
    private readonly deleteUseCase: DeleteTacheUseCase,
  ) {}

  private extractUserIdFromToken(authHeader: string): string | null {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
      }
      const token = authHeader.substring(7);
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString(),
      );
      return payload.sub || null;
    } catch {
      return null;
    }
  }

  @Roles({ roles: ['realm:user'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTacheDto): Promise<TacheDto> {
    const entity = await this.createUseCase.execute(dto);
    return new TacheDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(
    @Query('organisationId') organisationId?: string,
    @Query('assigneA') assigneA?: string,
    @Query('clientId') clientId?: string,
    @Query('contratId') contratId?: string,
    @Query('factureId') factureId?: string,
    @Query('statut') statut?: string,
    @Query('type') type?: string,
    @Query('enRetard') enRetard?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<TacheDto[] | PaginatedTachesDto> {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '50', 10);

    // Si pagination explicitement demandée ou recherche
    if (page || limit || search) {
      const result = await this.getUseCase.executePaginated(
        {
          organisationId,
          assigneA,
          clientId,
          contratId,
          factureId,
          statut: statut as TacheStatut | undefined,
          type: type as TacheType | undefined,
          enRetard: enRetard === 'true',
          search,
        },
        { page: pageNum, limit: limitNum },
      );

      return new PaginatedTachesDto(
        result.data.map((e) => new TacheDto(e)),
        result.total,
        result.page,
        result.limit,
      );
    }

    // Sinon comportement legacy sans pagination
    let entities;

    if (enRetard === 'true' && organisationId) {
      entities = await this.getUseCase.executeEnRetard(organisationId);
    } else if (statut && organisationId) {
      entities = await this.getUseCase.executeByStatut(
        organisationId,
        statut as TacheStatut,
      );
    } else if (type && organisationId) {
      entities = await this.getUseCase.executeByType(
        organisationId,
        type as TacheType,
      );
    } else if (assigneA) {
      entities = await this.getUseCase.executeByAssigneA(assigneA);
    } else if (clientId) {
      entities = await this.getUseCase.executeByClientId(clientId);
    } else if (contratId) {
      entities = await this.getUseCase.executeByContratId(contratId);
    } else if (factureId) {
      entities = await this.getUseCase.executeByFactureId(factureId);
    } else if (organisationId) {
      entities = await this.getUseCase.executeByOrganisationId(organisationId);
    } else {
      entities = await this.getUseCase.executeAll();
    }

    return entities.map((e) => new TacheDto(e));
  }

  @Roles({ roles: ['realm:user'] })
  @Get('me')
  async findMyTaches(
    @Headers('authorization') authHeader: string,
    @Query('periode') periode?: string,
  ): Promise<TacheDto[]> {
    const userId = this.extractUserIdFromToken(authHeader);
    if (!userId) {
      throw new UnauthorizedException('Token invalide ou manquant');
    }

    let entities;
    if (periode === 'jour') {
      entities = await this.getUseCase.executeDuJour(userId);
    } else if (periode === 'semaine') {
      entities = await this.getUseCase.executeASemaine(userId);
    } else {
      entities = await this.getUseCase.executeByAssigneA(userId);
    }

    return entities.map((e) => new TacheDto(e));
  }

  @Roles({ roles: ['realm:user'] })
  @Get('stats')
  async getStats(
    @Query('organisationId') organisationId: string,
  ): Promise<TacheStatsDto> {
    const countByStatut =
      await this.getUseCase.executeCountByStatut(organisationId);
    const enRetard = await this.getUseCase.executeCountEnRetard(organisationId);

    return new TacheStatsDto({
      aFaire: countByStatut['A_FAIRE'] || 0,
      enCours: countByStatut['EN_COURS'] || 0,
      terminee: countByStatut['TERMINEE'] || 0,
      annulee: countByStatut['ANNULEE'] || 0,
      enRetard,
    });
  }

  @Roles({ roles: ['realm:user'] })
  @Get('alertes')
  async getAlertes(
    @Headers('authorization') authHeader: string,
  ): Promise<{ enRetard: TacheDto[]; echeanceDemain: TacheDto[] }> {
    const userId = this.extractUserIdFromToken(authHeader);
    if (!userId) {
      throw new UnauthorizedException('Token invalide ou manquant');
    }

    const [enRetardEntities, echeanceDemainEntities] = await Promise.all([
      this.getUseCase.executeMesEnRetard(userId),
      this.getUseCase.executeMesEcheanceDemain(userId),
    ]);

    return {
      enRetard: enRetardEntities.map((e) => new TacheDto(e)),
      echeanceDemain: echeanceDemainEntities.map((e) => new TacheDto(e)),
    };
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TacheDto> {
    const entity = await this.getUseCase.execute(id);
    return new TacheDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTacheDto,
  ): Promise<TacheDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new TacheDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Put(':id/en-cours')
  async marquerEnCours(@Param('id') id: string): Promise<TacheDto> {
    const entity = await this.updateUseCase.marquerEnCours(id);
    return new TacheDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Put(':id/terminee')
  async marquerTerminee(@Param('id') id: string): Promise<TacheDto> {
    const entity = await this.updateUseCase.marquerTerminee(id);
    return new TacheDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Put(':id/annulee')
  async marquerAnnulee(@Param('id') id: string): Promise<TacheDto> {
    const entity = await this.updateUseCase.marquerAnnulee(id);
    return new TacheDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
