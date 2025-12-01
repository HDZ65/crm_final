import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { Public } from 'nest-keycloak-connect';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { IsEmail, IsOptional, IsUUID } from 'class-validator';

import { InvitationCompteEntity } from '../../../db/entities/invitation-compte.entity';
import { MembreOrganisationEntity } from '../../../db/entities/membre-compte.entity';
import { OrganisationEntity } from '../../../db/entities/organisation.entity';
import { RoleEntity } from '../../../db/entities/role.entity';
import { AuthSyncService } from '../../../services/auth-sync.service';

// DTO pour créer une invitation
class CreateInvitationDto {
  @ApiProperty({ description: 'Email de la personne à inviter' })
  @IsEmail()
  emailInvite: string;

  @ApiProperty({ description: 'ID du rôle (optionnel, défaut: member)', required: false })
  @IsOptional()
  @IsUUID()
  roleId?: string;
}

// DTO de réponse pour une invitation
class InvitationResponseDto {
  id: string;
  organisationId: string;
  organisationNom: string;
  email: string;
  roleId: string;
  roleNom?: string;
  token: string;
  inviteUrl: string;
  expireAt: string;
  etat: string;
  createdAt: Date;
}

// DTO de réponse pour la validation
class ValidateInvitationResponseDto {
  valid: boolean;
  organisationNom: string;
  email: string;
  roleNom: string;
  expireAt: string;
}

// DTO de réponse pour l'acceptation
class AcceptInvitationResponseDto {
  success: boolean;
  organisation: {
    id: string;
    nom: string;
  };
  utilisateur: {
    id: string;
    email: string;
    nom: string;
    prenom: string;
  };
  membre: {
    id: string;
    roleId: string;
    etat: string;
  };
}

@ApiTags('Invitations')
@ApiBearerAuth()
@Controller('invitations')
export class InvitationCompteController {
  private readonly logger = new Logger(InvitationCompteController.name);
  private readonly INVITATION_EXPIRY_DAYS = 7;

  constructor(
    @InjectRepository(InvitationCompteEntity)
    private readonly invitationRepository: Repository<InvitationCompteEntity>,
    @InjectRepository(MembreOrganisationEntity)
    private readonly membreRepository: Repository<MembreOrganisationEntity>,
    @InjectRepository(OrganisationEntity)
    private readonly organisationRepository: Repository<OrganisationEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly authSyncService: AuthSyncService,
  ) {}

  /**
   * Créer une invitation pour rejoindre une organisation
   * L'owner/admin de l'organisation envoie une invitation par email
   */
  @Post('organisation/:organisationId')
  @Public()
  @ApiOperation({
    summary: 'Créer une invitation',
    description: 'Crée une invitation pour qu\'un utilisateur rejoigne l\'organisation',
  })
  @ApiResponse({ status: 201, description: 'Invitation créée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Pas propriétaire de l\'organisation' })
  @ApiResponse({ status: 404, description: 'Organisation non trouvée' })
  async createInvitation(
    @Param('organisationId') organisationId: string,
    @Headers('authorization') authHeader: string,
    @Body() dto: CreateInvitationDto,
  ): Promise<InvitationResponseDto> {
    // 1. Vérifier le token JWT
    const payload = this.verifyAndDecodeToken(authHeader);

    // 2. Synchroniser l'utilisateur
    const currentUser = await this.authSyncService.syncKeycloakUser({
      sub: payload.sub,
      email: payload.email,
      given_name: payload.given_name,
      family_name: payload.family_name,
      preferred_username: payload.preferred_username,
      name: payload.name,
    });

    // 3. Vérifier que l'organisation existe
    const organisation = await this.organisationRepository.findOne({
      where: { id: organisationId },
    });
    if (!organisation) {
      throw new NotFoundException('Organisation non trouvée');
    }

    // 4. Vérifier que l'utilisateur est membre de l'organisation (owner ou admin)
    const membership = await this.membreRepository.findOne({
      where: {
        organisationId: organisationId,
        utilisateurId: currentUser.id,
        etat: 'actif',
      },
    });

    if (!membership) {
      throw new ForbiddenException('Vous n\'êtes pas membre de cette organisation');
    }

    // 5. Récupérer ou créer le rôle par défaut (member)
    let role: RoleEntity;
    if (dto.roleId) {
      const foundRole = await this.roleRepository.findOne({ where: { id: dto.roleId } });
      if (!foundRole) {
        throw new BadRequestException('Rôle non trouvé');
      }
      role = foundRole;
    } else {
      role = await this.getOrCreateMemberRole();
    }

    // 6. Vérifier si une invitation existe déjà pour cet email
    const existingInvitation = await this.invitationRepository.findOne({
      where: {
        organisationId: organisationId,
        emailInvite: dto.emailInvite,
        etat: 'pending',
      },
    });

    if (existingInvitation) {
      throw new BadRequestException('Une invitation est déjà en attente pour cet email');
    }

    // 7. Vérifier si l'utilisateur est déjà membre
    const existingMember = await this.membreRepository.findOne({
      where: { organisationId },
      relations: ['utilisateur'],
    });
    // On cherche par email dans les membres existants
    const members = await this.membreRepository.find({
      where: { organisationId },
      relations: ['utilisateur'],
    });
    const alreadyMember = members.find(m => m.utilisateur?.email === dto.emailInvite);
    if (alreadyMember) {
      throw new BadRequestException('Cet utilisateur est déjà membre de l\'organisation');
    }

    // 8. Générer le token et la date d'expiration
    const token = uuidv4();
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + this.INVITATION_EXPIRY_DAYS);

    // 9. Créer l'invitation
    const invitation = this.invitationRepository.create({
      organisationId: organisationId,
      emailInvite: dto.emailInvite,
      roleId: role.id,
      token: token,
      expireAt: expireAt.toISOString(),
      etat: 'pending',
    });

    const saved = await this.invitationRepository.save(invitation);
    this.logger.log(`Invitation créée: ${saved.id} pour ${dto.emailInvite} dans ${organisation.nom}`);

    // 10. Construire l'URL d'invitation
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/invite/${token}`;

    return {
      id: saved.id,
      organisationId: organisationId,
      organisationNom: organisation.nom,
      email: dto.emailInvite,
      roleId: role.id,
      roleNom: role.nom,
      token: token,
      inviteUrl: inviteUrl,
      expireAt: expireAt.toISOString(),
      etat: 'pending',
      createdAt: saved.createdAt,
    };
  }

  /**
   * Valider un token d'invitation (vérifier s'il est valide)
   * Appelé par le frontend quand l'invité clique sur le lien
   */
  @Get('validate/:token')
  @Public()
  @ApiOperation({
    summary: 'Valider une invitation',
    description: 'Vérifie si le token d\'invitation est valide et retourne les informations',
  })
  @ApiResponse({ status: 200, description: 'Invitation valide' })
  @ApiResponse({ status: 404, description: 'Invitation non trouvée ou expirée' })
  async validateInvitation(
    @Param('token') token: string,
  ): Promise<ValidateInvitationResponseDto> {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
      relations: ['organisation', 'role'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation non trouvée');
    }

    if (invitation.etat !== 'pending') {
      throw new BadRequestException(`Cette invitation a déjà été ${invitation.etat === 'accepted' ? 'acceptée' : 'annulée'}`);
    }

    const now = new Date();
    const expireAt = new Date(invitation.expireAt);
    if (now > expireAt) {
      throw new BadRequestException('Cette invitation a expiré');
    }

    return {
      valid: true,
      organisationNom: invitation.organisation.nom,
      email: invitation.emailInvite,
      roleNom: invitation.role.nom,
      expireAt: invitation.expireAt,
    };
  }

  /**
   * Accepter une invitation
   * L'invité doit être authentifié (avoir un token JWT)
   */
  @Post('accept/:token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accepter une invitation',
    description: 'Accepte l\'invitation et associe l\'utilisateur à l\'organisation',
  })
  @ApiResponse({ status: 200, description: 'Invitation acceptée' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Invitation non trouvée' })
  @ApiResponse({ status: 400, description: 'Invitation expirée ou déjà utilisée' })
  async acceptInvitation(
    @Param('token') token: string,
    @Headers('authorization') authHeader: string,
  ): Promise<AcceptInvitationResponseDto> {
    // 1. Vérifier le token JWT
    const payload = this.verifyAndDecodeToken(authHeader);

    // 2. Trouver l'invitation
    const invitation = await this.invitationRepository.findOne({
      where: { token },
      relations: ['organisation', 'role'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation non trouvée');
    }

    if (invitation.etat !== 'pending') {
      throw new BadRequestException(`Cette invitation a déjà été ${invitation.etat === 'accepted' ? 'acceptée' : 'annulée'}`);
    }

    // 3. Vérifier l'expiration
    const now = new Date();
    const expireAt = new Date(invitation.expireAt);
    if (now > expireAt) {
      throw new BadRequestException('Cette invitation a expiré');
    }

    // 4. (Optionnel) Vérifier que l'email correspond
    // Si on veut être strict sur l'email
    // if (payload.email !== invitation.emailInvite) {
    //   throw new ForbiddenException('Cette invitation n\'est pas destinée à votre adresse email');
    // }

    // 5. Synchroniser l'utilisateur dans la BDD
    const dbUser = await this.authSyncService.syncKeycloakUser({
      sub: payload.sub,
      email: payload.email,
      given_name: payload.given_name,
      family_name: payload.family_name,
      preferred_username: payload.preferred_username,
      name: payload.name,
    });

    this.logger.log(`Utilisateur synchronisé pour acceptation: ${dbUser.email} (id: ${dbUser.id})`);

    // 6. Vérifier si l'utilisateur n'est pas déjà membre
    const existingMember = await this.membreRepository.findOne({
      where: {
        organisationId: invitation.organisationId,
        utilisateurId: dbUser.id,
      },
    });

    if (existingMember) {
      throw new BadRequestException('Vous êtes déjà membre de cette organisation');
    }

    // 7. Créer l'association utilisateur-organisation
    const membre = this.membreRepository.create({
      organisationId: invitation.organisationId,
      utilisateurId: dbUser.id,
      roleId: invitation.roleId,
      etat: 'actif',
      dateInvitation: invitation.createdAt,
      dateActivation: new Date(),
    });

    const savedMembre = await this.membreRepository.save(membre);
    this.logger.log(`Membre créé: ${savedMembre.id} pour organisation ${invitation.organisationId}`);

    // 8. Marquer l'invitation comme acceptée
    invitation.etat = 'accepted';
    await this.invitationRepository.save(invitation);

    return {
      success: true,
      organisation: {
        id: invitation.organisation.id,
        nom: invitation.organisation.nom,
      },
      utilisateur: {
        id: dbUser.id,
        email: dbUser.email,
        nom: dbUser.nom,
        prenom: dbUser.prenom,
      },
      membre: {
        id: savedMembre.id,
        roleId: savedMembre.roleId,
        etat: savedMembre.etat,
      },
    };
  }

  /**
   * Lister les invitations d'une organisation
   */
  @Get('organisation/:organisationId')
  @Public()
  @ApiOperation({ summary: 'Lister les invitations d\'une organisation' })
  async listInvitations(
    @Param('organisationId') organisationId: string,
    @Headers('authorization') authHeader: string,
  ): Promise<InvitationResponseDto[]> {
    // Vérifier l'authentification
    const payload = this.verifyAndDecodeToken(authHeader);

    const currentUser = await this.authSyncService.syncKeycloakUser({
      sub: payload.sub,
      email: payload.email,
      given_name: payload.given_name,
      family_name: payload.family_name,
      preferred_username: payload.preferred_username,
      name: payload.name,
    });

    // Vérifier que l'utilisateur est membre
    const membership = await this.membreRepository.findOne({
      where: { organisationId, utilisateurId: currentUser.id, etat: 'actif' },
    });

    if (!membership) {
      throw new ForbiddenException('Vous n\'êtes pas membre de cette organisation');
    }

    const invitations = await this.invitationRepository.find({
      where: { organisationId },
      relations: ['organisation', 'role'],
      order: { createdAt: 'DESC' },
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    return invitations.map(inv => ({
      id: inv.id,
      organisationId: inv.organisationId,
      organisationNom: inv.organisation.nom,
      email: inv.emailInvite,
      roleId: inv.roleId,
      roleNom: inv.role?.nom,
      token: inv.token,
      inviteUrl: `${baseUrl}/invite/${inv.token}`,
      expireAt: inv.expireAt,
      etat: inv.etat,
      createdAt: inv.createdAt,
    }));
  }

  /**
   * Annuler une invitation
   */
  @Delete(':invitationId')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Annuler une invitation' })
  async cancelInvitation(
    @Param('invitationId') invitationId: string,
    @Headers('authorization') authHeader: string,
  ): Promise<void> {
    const payload = this.verifyAndDecodeToken(authHeader);

    const currentUser = await this.authSyncService.syncKeycloakUser({
      sub: payload.sub,
      email: payload.email,
      given_name: payload.given_name,
      family_name: payload.family_name,
      preferred_username: payload.preferred_username,
      name: payload.name,
    });

    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation non trouvée');
    }

    // Vérifier que l'utilisateur est membre de l'organisation
    const membership = await this.membreRepository.findOne({
      where: {
        organisationId: invitation.organisationId,
        utilisateurId: currentUser.id,
        etat: 'actif'
      },
    });

    if (!membership) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à annuler cette invitation');
    }

    invitation.etat = 'cancelled';
    await this.invitationRepository.save(invitation);
  }

  /**
   * Helper: Vérifie et décode le token JWT
   */
  private verifyAndDecodeToken(authHeader: string): any {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token JWT manquant');
    }

    const token = authHeader.substring(7);
    const payload = this.decodeJwt(token);

    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token JWT invalide');
    }

    return payload;
  }

  /**
   * Helper: Décode un token JWT
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

  /**
   * Helper: Récupère ou crée le rôle "member"
   */
  private async getOrCreateMemberRole(): Promise<RoleEntity> {
    const MEMBER_ROLE_CODE = 'member';

    let memberRole = await this.roleRepository.findOne({
      where: { code: MEMBER_ROLE_CODE },
    });

    if (!memberRole) {
      this.logger.log('Création du rôle "member"...');
      memberRole = this.roleRepository.create({
        code: MEMBER_ROLE_CODE,
        nom: 'Membre',
        description: 'Membre de l\'organisation avec accès standard',
      });
      memberRole = await this.roleRepository.save(memberRole);
      this.logger.log(`Rôle "member" créé avec l'ID: ${memberRole.id}`);
    }

    return memberRole;
  }
}
