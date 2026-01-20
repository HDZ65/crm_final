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
  ForbiddenException,
} from '@nestjs/common';
import { Roles, Public } from 'nest-keycloak-connect';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMembreCompteDto } from '../../../../../applications/dto/membre-compte/create-membre-compte.dto';
import { UpdateMembreCompteDto } from '../../../../../applications/dto/membre-compte/update-membre-compte.dto';
import {
  MembreCompteDto,
  MembreCompteWithUserDto,
} from '../../../../../applications/dto/membre-compte/membre-compte-response.dto';
import { CreateMembreCompteUseCase } from '../../../../../applications/usecase/membre-compte/create-membre-compte.usecase';
import { GetMembreCompteUseCase } from '../../../../../applications/usecase/membre-compte/get-membre-compte.usecase';
import { UpdateMembreCompteUseCase } from '../../../../../applications/usecase/membre-compte/update-membre-compte.usecase';
import { DeleteMembreCompteUseCase } from '../../../../../applications/usecase/membre-compte/delete-membre-compte.usecase';
import { MembreCompteEntity } from '../../../../../core/domain/membre-compte.entity';
import { MembreOrganisationEntity } from '../../../../db/entities/membre-compte.entity';
import { RoleEntity } from '../../../../db/entities/role.entity';
import { OrganisationEntity } from '../../../../db/entities/organisation.entity';
import { NotificationEntity } from '../../../../db/entities/notification.entity';
import { AuthSyncService } from '../../../../services/auth-sync.service';
import { NotificationGateway } from '../../../../websocket/notification.gateway';

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
    @InjectRepository(OrganisationEntity)
    private readonly organisationRepository: Repository<OrganisationEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    private readonly authSyncService: AuthSyncService,
    private readonly notificationGateway: NotificationGateway,
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
  ): Promise<{
    membre: MembreCompteDto;
    role: { id: string; code: string; nom: string } | null;
  }> {
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
      throw new NotFoundException(
        "Vous n'êtes pas membre de cette organisation",
      );
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
      role: role
        ? {
            id: role.id,
            code: role.code,
            nom: role.nom,
          }
        : null,
    };
  }

  /**
   * Quitter une organisation (pour un membre)
   */
  @Public()
  @Delete('leave/:organisationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leaveOrganisation(
    @Param('organisationId') organisationId: string,
    @Headers('authorization') authHeader: string,
  ): Promise<void> {
    // 1. Vérifier le token JWT
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token JWT manquant');
    }

    const token = authHeader.substring(7);
    const payload = this.decodeJwt(token);

    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token JWT invalide');
    }

    // 2. Synchroniser l'utilisateur
    const dbUser = await this.authSyncService.syncKeycloakUser({
      sub: payload.sub,
      email: payload.email,
      given_name: payload.given_name,
      family_name: payload.family_name,
      preferred_username: payload.preferred_username,
      name: payload.name,
    });

    // 3. Chercher le membre
    const membre = await this.membreRepository.findOne({
      where: {
        organisationId,
        utilisateurId: dbUser.id,
        etat: 'actif',
      },
    });

    if (!membre) {
      throw new NotFoundException(
        "Vous n'êtes pas membre de cette organisation",
      );
    }

    // 4. Vérifier que ce n'est pas le owner
    const role = await this.roleRepository.findOne({
      where: { id: membre.roleId },
    });
    if (role?.code === 'owner') {
      throw new ForbiddenException(
        "Le propriétaire ne peut pas quitter l'organisation. Transférez la propriété ou supprimez l'organisation.",
      );
    }

    // 5. Récupérer l'organisation pour la notification
    const organisation = await this.organisationRepository.findOne({
      where: { id: organisationId },
    });

    // 6. Supprimer le membre
    await this.membreRepository.delete(membre.id);

    // 7. Envoyer une notification aux owners
    const ownerRole = await this.roleRepository.findOne({
      where: { code: 'owner' },
    });
    if (ownerRole && organisation) {
      const owners = await this.membreRepository.find({
        where: {
          organisationId,
          roleId: ownerRole.id,
          etat: 'actif',
        },
      });

      const userName =
        [dbUser.prenom, dbUser.nom].filter(Boolean).join(' ') || dbUser.email;

      for (const owner of owners) {
        const notification = this.notificationRepository.create({
          organisationId,
          utilisateurId: owner.utilisateurId,
          type: 'member_left',
          titre: 'Membre parti',
          message: `${userName} a quitté l'organisation ${organisation.nom}`,
          metadata: {
            utilisateurId: dbUser.id,
            email: dbUser.email,
          },
        });
        const savedNotification =
          await this.notificationRepository.save(notification);
        // Émettre la notification en temps réel via WebSocket
        this.notificationGateway.notifyNewNotification(
          owner.utilisateurId,
          savedNotification,
        );
      }
    }
  }

  /**
   * Supprimer un membre de l'organisation (réservé aux owners)
   */
  @Public()
  @Delete(':membreId/organisation/:organisationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('membreId') membreId: string,
    @Param('organisationId') organisationId: string,
    @Headers('authorization') authHeader: string,
  ): Promise<void> {
    // 1. Vérifier le token JWT
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token JWT manquant');
    }

    const token = authHeader.substring(7);
    const payload = this.decodeJwt(token);

    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token JWT invalide');
    }

    // 2. Synchroniser l'utilisateur connecté
    const currentUser = await this.authSyncService.syncKeycloakUser({
      sub: payload.sub,
      email: payload.email,
      given_name: payload.given_name,
      family_name: payload.family_name,
      preferred_username: payload.preferred_username,
      name: payload.name,
    });

    // 3. Vérifier que l'utilisateur connecté est owner de l'organisation
    const currentMembre = await this.membreRepository.findOne({
      where: {
        organisationId,
        utilisateurId: currentUser.id,
        etat: 'actif',
      },
    });

    if (!currentMembre) {
      throw new ForbiddenException(
        "Vous n'êtes pas membre de cette organisation",
      );
    }

    const currentRole = await this.roleRepository.findOne({
      where: { id: currentMembre.roleId },
    });
    if (currentRole?.code !== 'owner') {
      throw new ForbiddenException(
        'Seul le propriétaire peut supprimer des membres',
      );
    }

    // 4. Chercher le membre à supprimer
    const membreToRemove = await this.membreRepository.findOne({
      where: {
        id: membreId,
        organisationId,
        etat: 'actif',
      },
      relations: ['utilisateur'],
    });

    if (!membreToRemove) {
      throw new NotFoundException('Membre non trouvé');
    }

    // 5. Vérifier qu'on ne supprime pas un owner
    const memberRole = await this.roleRepository.findOne({
      where: { id: membreToRemove.roleId },
    });
    if (memberRole?.code === 'owner') {
      throw new ForbiddenException('Impossible de supprimer un propriétaire');
    }

    // 6. Récupérer l'organisation pour les notifications
    const organisation = await this.organisationRepository.findOne({
      where: { id: organisationId },
    });

    // 7. Supprimer le membre
    await this.membreRepository.delete(membreToRemove.id);

    if (organisation && membreToRemove.utilisateur) {
      const removedUser = membreToRemove.utilisateur;
      const userName =
        [removedUser.prenom, removedUser.nom].filter(Boolean).join(' ') ||
        removedUser.email;

      // 8. Notifier le membre supprimé
      const notificationForRemoved = this.notificationRepository.create({
        organisationId,
        utilisateurId: removedUser.id,
        type: 'member_left',
        titre: "Retrait de l'organisation",
        message: `Vous avez été retiré de l'organisation ${organisation.nom}`,
        metadata: {
          organisationId,
          organisationNom: organisation.nom,
          removedBy: currentUser.id,
        },
      });
      const savedNotifRemoved = await this.notificationRepository.save(
        notificationForRemoved,
      );
      this.notificationGateway.notifyNewNotification(
        removedUser.id,
        savedNotifRemoved,
      );

      // 9. Notifier les autres owners
      const ownerRole = await this.roleRepository.findOne({
        where: { code: 'owner' },
      });
      if (ownerRole) {
        const owners = await this.membreRepository.find({
          where: {
            organisationId,
            roleId: ownerRole.id,
            etat: 'actif',
          },
        });

        for (const owner of owners) {
          // Ne pas notifier le owner qui a fait l'action
          if (owner.utilisateurId === currentUser.id) continue;

          const notification = this.notificationRepository.create({
            organisationId,
            utilisateurId: owner.utilisateurId,
            type: 'member_left',
            titre: 'Membre retiré',
            message: `${userName} a été retiré de l'organisation ${organisation.nom}`,
            metadata: {
              utilisateurId: removedUser.id,
              email: removedUser.email,
              removedBy: currentUser.id,
            },
          });
          const savedNotification =
            await this.notificationRepository.save(notification);
          this.notificationGateway.notifyNewNotification(
            owner.utilisateurId,
            savedNotification,
          );
        }
      }
    }
  }

  /**
   * Changer le rôle d'un membre (réservé aux owners)
   */
  @Public()
  @Put(':membreId/role')
  async updateMemberRole(
    @Param('membreId') membreId: string,
    @Headers('authorization') authHeader: string,
    @Body() body: { roleId: string },
  ): Promise<{ success: boolean }> {
    // 1. Vérifier le token JWT
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token JWT manquant');
    }

    const token = authHeader.substring(7);
    const payload = this.decodeJwt(token);

    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token JWT invalide');
    }

    // 2. Synchroniser l'utilisateur connecté
    const currentUser = await this.authSyncService.syncKeycloakUser({
      sub: payload.sub,
      email: payload.email,
      given_name: payload.given_name,
      family_name: payload.family_name,
      preferred_username: payload.preferred_username,
      name: payload.name,
    });

    // 3. Trouver le membre à modifier
    const membreToUpdate = await this.membreRepository.findOne({
      where: { id: membreId },
      relations: ['utilisateur'],
    });

    if (!membreToUpdate) {
      throw new NotFoundException('Membre non trouvé');
    }

    // 4. Vérifier que l'utilisateur connecté est owner de cette organisation
    const currentMembre = await this.membreRepository.findOne({
      where: {
        organisationId: membreToUpdate.organisationId,
        utilisateurId: currentUser.id,
        etat: 'actif',
      },
    });

    if (!currentMembre) {
      throw new ForbiddenException(
        "Vous n'êtes pas membre de cette organisation",
      );
    }

    const currentRole = await this.roleRepository.findOne({
      where: { id: currentMembre.roleId },
    });
    if (currentRole?.code !== 'owner') {
      throw new ForbiddenException(
        'Seul le propriétaire peut modifier les rôles',
      );
    }

    // 5. Vérifier que le nouveau rôle existe
    const newRole = await this.roleRepository.findOne({
      where: { id: body.roleId },
    });
    if (!newRole) {
      throw new NotFoundException('Rôle non trouvé');
    }

    // 6. Empêcher de changer le rôle d'un owner
    const memberCurrentRole = await this.roleRepository.findOne({
      where: { id: membreToUpdate.roleId },
    });
    if (memberCurrentRole?.code === 'owner') {
      throw new ForbiddenException(
        "Impossible de modifier le rôle d'un propriétaire",
      );
    }

    // 7. Empêcher de promouvoir en owner (pour l'instant)
    if (newRole.code === 'owner') {
      throw new ForbiddenException(
        'Impossible de promouvoir en propriétaire via cette action',
      );
    }

    // 8. Mettre à jour le rôle
    membreToUpdate.roleId = body.roleId;
    await this.membreRepository.save(membreToUpdate);

    return { success: true };
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
      relations: ['utilisateur', 'role'],
    });

    return membres.map(
      (membre) =>
        new MembreCompteWithUserDto({
          id: membre.id,
          organisationId: membre.organisationId,
          utilisateurId: membre.utilisateurId,
          roleId: membre.roleId,
          etat: membre.etat,
          dateInvitation: membre.dateInvitation?.toISOString() || null,
          dateActivation: membre.dateActivation?.toISOString() || null,
          createdAt: membre.createdAt,
          updatedAt: membre.updatedAt,
          utilisateur: membre.utilisateur
            ? {
                id: membre.utilisateur.id,
                email: membre.utilisateur.email,
                nom: membre.utilisateur.nom,
                prenom: membre.utilisateur.prenom,
              }
            : undefined,
          role: membre.role
            ? {
                id: membre.role.id,
                code: membre.role.code,
                nom: membre.role.nom,
              }
            : undefined,
        }),
    );
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
