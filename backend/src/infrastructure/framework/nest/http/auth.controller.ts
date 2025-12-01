import { Controller, Get, Headers, UnauthorizedException, Inject } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'nest-keycloak-connect';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileResponseDto, UserOrganisationDto } from '../../../../applications/dto/auth/user-profile-response.dto';
import { AuthSyncService } from '../../../services/auth-sync.service';
import { MembreOrganisationEntity } from '../../../db/entities/membre-compte.entity';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authSyncService: AuthSyncService,
    @InjectRepository(MembreOrganisationEntity)
    private readonly membreOrganisationRepository: Repository<MembreOrganisationEntity>,
  ) {}

  @Get('me')
  @Public()
  @ApiOperation({ summary: 'Get current user profile with organisations' })
  @ApiResponse({
    status: 200,
    description: 'User profile with list of organisations',
    type: UserProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async getCurrentUser(
    @Headers('authorization') authHeader: string,
  ): Promise<UserProfileResponseDto> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token manquant');
    }

    const token = authHeader.substring(7);
    const payload = this.decodeJwt(token);

    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token invalide');
    }

    // Synchroniser l'utilisateur avec la BDD
    const dbUser = await this.authSyncService.syncKeycloakUser({
      sub: payload.sub,
      email: payload.email,
      given_name: payload.given_name,
      family_name: payload.family_name,
      preferred_username: payload.preferred_username,
      name: payload.name,
    });

    // Récupérer les organisations de l'utilisateur
    const memberships = await this.membreOrganisationRepository.find({
      where: { utilisateurId: dbUser.id },
      relations: ['organisation'],
    });

    const organisations: UserOrganisationDto[] = memberships.map((m) => ({
      id: m.organisation.id,
      nom: m.organisation.nom,
      roleId: m.roleId,
      etat: m.etat,
    }));

    return new UserProfileResponseDto({
      id: dbUser.id,
      keycloakId: dbUser.keycloakId,
      email: dbUser.email,
      nom: dbUser.nom,
      prenom: dbUser.prenom,
      telephone: dbUser.telephone,
      actif: dbUser.actif,
      organisations: organisations,
      hasOrganisation: organisations.length > 0,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
    });
  }

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
}
