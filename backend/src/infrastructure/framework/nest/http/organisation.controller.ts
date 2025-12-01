import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from 'nest-keycloak-connect';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrganisationUseCase } from '../../../../applications/usecase/organisation/create-organisation.usecase';
import { GetOrganisationUseCase } from '../../../../applications/usecase/organisation/get-organisation.usecase';
import { UpdateOrganisationUseCase } from '../../../../applications/usecase/organisation/update-organisation.usecase';
import { DeleteOrganisationUseCase } from '../../../../applications/usecase/organisation/delete-organisation.usecase';
import { CreateMembreCompteUseCase } from '../../../../applications/usecase/membre-compte/create-membre-compte.usecase';
import { CreateOrganisationDto } from '../../../../applications/dto/organisation/create-organisation.dto';
import { UpdateOrganisationDto } from '../../../../applications/dto/organisation/update-organisation.dto';
import { OrganisationResponseDto } from '../../../../applications/dto/organisation/organisation-response.dto';
import { AuthSyncService } from '../../../services/auth-sync.service';
import { RoleEntity } from '../../../db/entities/role.entity';

@ApiTags('Organisations')
@ApiBearerAuth()
@Controller('organisations')
export class OrganisationController {
  private readonly logger = new Logger(OrganisationController.name);

  constructor(
    private readonly createUseCase: CreateOrganisationUseCase,
    private readonly getUseCase: GetOrganisationUseCase,
    private readonly updateUseCase: UpdateOrganisationUseCase,
    private readonly deleteUseCase: DeleteOrganisationUseCase,
    private readonly createMembreUseCase: CreateMembreCompteUseCase,
    private readonly authSyncService: AuthSyncService,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  /**
   * Crée une organisation et associe automatiquement l'utilisateur du token JWT
   * comme membre propriétaire de l'organisation.
   */
  @Post('with-owner')
  @Public()
  @ApiOperation({
    summary: 'Créer une organisation avec propriétaire',
    description: 'Crée une organisation et associe automatiquement l\'utilisateur authentifié (via JWT) comme propriétaire'
  })
  @ApiResponse({
    status: 201,
    description: 'Organisation créée avec l\'utilisateur comme propriétaire',
    schema: {
      properties: {
        organisation: { $ref: '#/components/schemas/OrganisationResponseDto' },
        membre: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            roleId: { type: 'string' },
            etat: { type: 'string' },
          }
        },
        utilisateur: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            nom: { type: 'string' },
            prenom: { type: 'string' },
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Token JWT manquant ou invalide' })
  @ApiResponse({ status: 400, description: 'DEFAULT_OWNER_ROLE_ID non configuré' })
  async createWithOwner(
    @Headers('authorization') authHeader: string,
    @Body() dto: CreateOrganisationDto,
  ): Promise<{ organisation: OrganisationResponseDto; membre: any; utilisateur: any }> {
    // 1. Vérifier et décoder le token JWT
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token JWT manquant');
    }

    const token = authHeader.substring(7);
    const payload = this.decodeJwt(token);

    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token JWT invalide');
    }

    this.logger.log(`Création d'organisation avec propriétaire: ${payload.email}`);

    // 2. Synchroniser l'utilisateur dans la BDD (crée s'il n'existe pas)
    const dbUser = await this.authSyncService.syncKeycloakUser({
      sub: payload.sub,
      email: payload.email,
      given_name: payload.given_name,
      family_name: payload.family_name,
      preferred_username: payload.preferred_username,
      name: payload.name,
    });
    this.logger.log(`Utilisateur synchronisé: ${dbUser.email} (id: ${dbUser.id})`);

    // 3. Créer l'organisation
    const organisation = await this.createUseCase.execute(dto);
    this.logger.log(`Organisation créée: ${organisation.nom} (id: ${organisation.id})`);

    // 4. Récupérer ou créer le rôle "owner"
    const ownerRole = await this.getOrCreateOwnerRole();
    this.logger.log(`Rôle owner: ${ownerRole.id}`);

    // 5. Associer l'utilisateur à l'organisation comme propriétaire
    const membre = await this.createMembreUseCase.execute({
      utilisateurId: dbUser.id,
      organisationId: organisation.id,
      roleId: ownerRole.id,
      etat: 'actif',
      dateActivation: new Date().toISOString(),
    });
    this.logger.log(`Membre créé: ${membre.id} (role: ${ownerRole.id})`);

    return {
      organisation: new OrganisationResponseDto(organisation),
      membre: {
        id: membre.id,
        roleId: membre.roleId,
        etat: membre.etat,
      },
      utilisateur: {
        id: dbUser.id,
        email: dbUser.email,
        nom: dbUser.nom,
        prenom: dbUser.prenom,
      },
    };
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Créer une organisation (sans association utilisateur)' })
  @ApiResponse({ status: 201, type: OrganisationResponseDto })
  async create(
    @Body() dto: CreateOrganisationDto,
  ): Promise<OrganisationResponseDto> {
    const entity = await this.createUseCase.execute(dto);
    return new OrganisationResponseDto(entity);
  }

  /**
   * Récupère le rôle "owner" ou le crée s'il n'existe pas
   */
  private async getOrCreateOwnerRole(): Promise<RoleEntity> {
    const OWNER_ROLE_CODE = 'owner';

    // Chercher le rôle existant
    let ownerRole = await this.roleRepository.findOne({
      where: { code: OWNER_ROLE_CODE },
    });

    // Créer le rôle s'il n'existe pas
    if (!ownerRole) {
      this.logger.log('Création du rôle "owner"...');
      ownerRole = this.roleRepository.create({
        code: OWNER_ROLE_CODE,
        nom: 'Propriétaire',
        description: 'Propriétaire de l\'organisation avec tous les droits',
      });
      ownerRole = await this.roleRepository.save(ownerRole);
      this.logger.log(`Rôle "owner" créé avec l'ID: ${ownerRole.id}`);
    }

    return ownerRole;
  }

  /**
   * Décode un token JWT sans validation (la validation est faite côté Keycloak/frontend)
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

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lister toutes les organisations' })
  @ApiResponse({ status: 200, type: [OrganisationResponseDto] })
  async findAll(): Promise<OrganisationResponseDto[]> {
    const entities = await this.getUseCase.findAll();
    return entities.map((e) => new OrganisationResponseDto(e));
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Récupérer une organisation par ID' })
  @ApiResponse({ status: 200, type: OrganisationResponseDto })
  @ApiResponse({ status: 404, description: 'Organisation non trouvée' })
  async findById(@Param('id') id: string): Promise<OrganisationResponseDto> {
    const entity = await this.getUseCase.findById(id);
    if (!entity) {
      throw new NotFoundException('Organisation non trouvée');
    }
    return new OrganisationResponseDto(entity);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Mettre à jour une organisation' })
  @ApiResponse({ status: 200, type: OrganisationResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganisationDto,
  ): Promise<OrganisationResponseDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new OrganisationResponseDto(entity);
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Supprimer une organisation' })
  @ApiResponse({ status: 200, description: 'Organisation supprimée' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
