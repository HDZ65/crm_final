import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { Roles, Public } from 'nest-keycloak-connect';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMembreCompteDto } from '../../../../applications/dto/membre-compte/create-membre-compte.dto';
import { UpdateMembreCompteDto } from '../../../../applications/dto/membre-compte/update-membre-compte.dto';
import { MembreCompteDto, MembreCompteWithUserDto } from '../../../../applications/dto/membre-compte/membre-compte-response.dto';
import { CreateMembreCompteUseCase } from '../../../../applications/usecase/membre-compte/create-membre-compte.usecase';
import { GetMembreCompteUseCase } from '../../../../applications/usecase/membre-compte/get-membre-compte.usecase';
import { UpdateMembreCompteUseCase } from '../../../../applications/usecase/membre-compte/update-membre-compte.usecase';
import { DeleteMembreCompteUseCase } from '../../../../applications/usecase/membre-compte/delete-membre-compte.usecase';
import { MembreCompteEntity } from '../../../../core/domain/membre-compte.entity';
import { MembreOrganisationEntity } from '../../../db/entities/membre-compte.entity';
import { RoleEntity } from '../../../db/entities/role.entity';
import { AuthSyncService } from '../../../services/auth-sync.service';

@Controller('membrecomptes')
export class MembreCompteController {
  constructor(
    private readonly createUseCase: CreateMembreCompteUseCase,
    private readonly getUseCase: GetMembreCompteUseCase,
    private readonly updateUseCase: UpdateMembreCompteUseCase,
    private readonly deleteUseCase: DeleteMembreCompteUseCase,
    @InjectRepository(MembreOrganisationEntity)
    private readonly membreRepository: Repository<MembreOrganisationEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly authSyncService: AuthSyncService,
  ) {}

  private toDto(entity: MembreCompteEntity): MembreCompteDto {
    return new MembreCompteDto({
      id: entity.id,
      organisationId: entity.organisationId,
      utilisateurId: entity.utilisateurId,
      roleId: entity.roleId,
      etat: entity.etat,
      dateInvitation: entity.dateInvitation
        ? entity.dateInvitation.toISOString()
        : null,
      dateActivation: entity.dateActivation
        ? entity.dateActivation.toISOString()
        : null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Récupère le rôle de l'utilisateur connecté dans une organisation
   */
  @Public()
  @Get('my-role/:organisationId')
  async getMyRole(
    @Param('organisationId') organisationId: string,
    @Headers('authorization') authHeader: string,
  ): Promise<{ membre: MembreCompteDto; role: { id: string; code: string; nom: string } | null }> {
    // Vérifier le token JWT
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token JWT manquant');
    }

    const token = authHeader.substring(7);
    const payload = this.decodeJwt(token);

    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token JWT invalide');
    }

    // Synchroniser l'utilisateur
    const dbUser = await this.authSyncService.syncKeycloakUser({
      sub: payload.sub,
      email: payload.email,
      given_name: payload.given_name,
      family_name: payload.family_name,
      preferred_username: payload.preferred_username,
      name: payload.name,
    });

    // Chercher le membre
    const membre = await this.membreRepository.findOne({
      where: {
        organisationId,
        utilisateurId: dbUser.id,
      },
    });

    if (!membre) {
      throw new NotFoundException('Vous n\'êtes pas membre de cette organisation');
    }

    // Récupérer le rôle
    const role = await this.roleRepository.findOne({
      where: { id: membre.roleId },
    });

    return {
      membre: new MembreCompteDto({
        id: membre.id,
        organisationId: membre.organisationId,
        utilisateurId: membre.utilisateurId,
        roleId: membre.roleId,
        etat: membre.etat,
        dateInvitation: membre.dateInvitation?.toISOString() || null,
        dateActivation: membre.dateActivation?.toISOString() || null,
        createdAt: membre.createdAt,
        updatedAt: membre.updatedAt,
      }),
      role: role ? {
        id: role.id,
        code: role.code,
        nom: role.nom,
      } : null,
    };
  }

  /**
   * Décode un token JWT
   */
  private decodeJwt(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }

  @Roles({ roles: ['realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateMembreCompteDto): Promise<MembreCompteDto> {
    const entity = await this.createUseCase.execute(dto);
    return this.toDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Get()
  async findAll(): Promise<MembreCompteDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((entity) => this.toDto(entity));
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Get('organisation/:organisationId')
  async findByOrganisation(
    @Param('organisationId') organisationId: string,
  ): Promise<MembreCompteWithUserDto[]> {
    const membres = await this.membreRepository.find({
      where: { organisationId },
      relations: ['utilisateur'],
    });

    return membres.map((membre) => new MembreCompteWithUserDto({
      id: membre.id,
      organisationId: membre.organisationId,
      utilisateurId: membre.utilisateurId,
      roleId: membre.roleId,
      etat: membre.etat,
      dateInvitation: membre.dateInvitation?.toISOString() || null,
      dateActivation: membre.dateActivation?.toISOString() || null,
      createdAt: membre.createdAt,
      updatedAt: membre.updatedAt,
      utilisateur: membre.utilisateur ? {
        id: membre.utilisateur.id,
        email: membre.utilisateur.email,
        nom: membre.utilisateur.nom,
        prenom: membre.utilisateur.prenom,
      } : undefined,
    }));
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<MembreCompteDto> {
    const entity = await this.getUseCase.execute(id);
    return this.toDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMembreCompteDto,
  ): Promise<MembreCompteDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return this.toDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
