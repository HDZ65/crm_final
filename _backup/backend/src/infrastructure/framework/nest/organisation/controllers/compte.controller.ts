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
  Request,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { Roles, AuthGuard, RoleGuard } from 'nest-keycloak-connect';
import { CreateCompteDto } from '../../../../../applications/dto/compte/create-compte.dto';
import { UpdateCompteDto } from '../../../../../applications/dto/compte/update-compte.dto';
import { CompteDto } from '../../../../../applications/dto/compte/compte-response.dto';
import { CreateCompteUseCase } from '../../../../../applications/usecase/compte/create-compte.usecase';
import { GetCompteUseCase } from '../../../../../applications/usecase/compte/get-compte.usecase';
import { UpdateCompteUseCase } from '../../../../../applications/usecase/compte/update-compte.usecase';
import { DeleteCompteUseCase } from '../../../../../applications/usecase/compte/delete-compte.usecase';
import { CreateMembreCompteUseCase } from '../../../../../applications/usecase/membre-compte/create-membre-compte.usecase';
import { AuthSyncService } from '../../../../services/auth-sync.service';

@Controller('comptes')
export class CompteController {
  private readonly logger = new Logger(CompteController.name);

  constructor(
    private readonly createUseCase: CreateCompteUseCase,
    private readonly getUseCase: GetCompteUseCase,
    private readonly updateUseCase: UpdateCompteUseCase,
    private readonly deleteUseCase: DeleteCompteUseCase,
    private readonly createMembreCompteUseCase: CreateMembreCompteUseCase,
    private readonly authSyncService: AuthSyncService,
  ) {}

  /**
   * Crée un compte et associe automatiquement l'utilisateur Keycloak authentifié
   * L'utilisateur est créé dans la BDD s'il n'existe pas encore
   */
  @Post('with-owner')
  @UseGuards(AuthGuard, RoleGuard)
  @HttpCode(HttpStatus.CREATED)
  async createWithOwner(
    @Body() dto: CreateCompteDto,
    @Request() req,
  ): Promise<{ compte: CompteDto; utilisateur: any }> {
    this.logger.log('Création de compte avec propriétaire automatique');

    // 1. Récupérer l'utilisateur Keycloak du token
    const keycloakUser = req.user;
    if (!keycloakUser || !keycloakUser.sub) {
      throw new Error('Utilisateur Keycloak non trouvé dans le token');
    }

    this.logger.log(
      `Keycloak user: ${keycloakUser.email} (${keycloakUser.sub})`,
    );

    // 2. Synchroniser l'utilisateur dans la BDD (crée si n'existe pas)
    const dbUser = await this.authSyncService.syncKeycloakUser(keycloakUser);
    this.logger.log(
      `Utilisateur synchronisé: ${dbUser.email} (id: ${dbUser.id})`,
    );

    // 3. Créer le compte avec des valeurs par défaut
    const compteData: CreateCompteDto = {
      ...dto,
      etat: dto.etat || 'actif',
      dateCreation: dto.dateCreation || new Date().toISOString(),
      createdByUserId: dto.createdByUserId || dbUser.id,
    };
    const compte = await this.createUseCase.execute(compteData);
    this.logger.log(`Compte créé: ${compte.nom} (id: ${compte.id})`);

    // 4. Associer l'utilisateur au compte comme propriétaire
    // Utilise la variable d'environnement DEFAULT_OWNER_ROLE_ID
    // ou un roleId fourni dans le body (dto.ownerRoleId)
    const ownerRoleId = dto.ownerRoleId || process.env.DEFAULT_OWNER_ROLE_ID;

    if (!ownerRoleId) {
      throw new Error(
        'DEFAULT_OWNER_ROLE_ID non défini dans .env. ' +
          'Exécutez: node scripts/init-default-role.js',
      );
    }

    const membreCompte = await this.createMembreCompteUseCase.execute({
      utilisateurId: dbUser.id,
      organisationId: compte.id,
      roleId: ownerRoleId,
      etat: 'actif',
      dateActivation: new Date().toISOString(),
    });
    this.logger.log(
      `Utilisateur associé au compte (membre id: ${membreCompte.id})`,
    );

    return {
      compte: new CompteDto(compte),
      utilisateur: {
        id: dbUser.id,
        keycloakId: dbUser.keycloakId,
        email: dbUser.email,
        nom: dbUser.nom,
        prenom: dbUser.prenom,
      },
    };
  }

  @Roles({ roles: ['realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCompteDto): Promise<CompteDto> {
    const entity = await this.createUseCase.execute(dto);
    return new CompteDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Get()
  async findAll(): Promise<CompteDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((entity) => new CompteDto(entity));
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CompteDto> {
    const entity = await this.getUseCase.execute(id);
    return new CompteDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCompteDto,
  ): Promise<CompteDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new CompteDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
