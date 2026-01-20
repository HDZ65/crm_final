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
} from '@nestjs/common';
import { Roles, Public } from 'nest-keycloak-connect';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from '../../../../../applications/dto/notification/create-notification.dto';
import { UpdateNotificationDto } from '../../../../../applications/dto/notification/update-notification.dto';
import {
  NotificationDto,
  NotificationCountDto,
} from '../../../../../applications/dto/notification/notification-response.dto';
import { CreateNotificationUseCase } from '../../../../../applications/usecase/notification/create-notification.usecase';
import { GetNotificationUseCase } from '../../../../../applications/usecase/notification/get-notification.usecase';
import { UpdateNotificationUseCase } from '../../../../../applications/usecase/notification/update-notification.usecase';
import { DeleteNotificationUseCase } from '../../../../../applications/usecase/notification/delete-notification.usecase';
import { UtilisateurEntity } from '../../../../db/entities/utilisateur.entity';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly createUseCase: CreateNotificationUseCase,
    private readonly getUseCase: GetNotificationUseCase,
    private readonly updateUseCase: UpdateNotificationUseCase,
    private readonly deleteUseCase: DeleteNotificationUseCase,
    @InjectRepository(UtilisateurEntity)
    private readonly utilisateurRepository: Repository<UtilisateurEntity>,
  ) {}

  private extractKeycloakIdFromToken(authHeader: string): string | null {
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

  private async getUserIdFromToken(authHeader: string): Promise<string | null> {
    const keycloakId = this.extractKeycloakIdFromToken(authHeader);
    if (!keycloakId) return null;

    const user = await this.utilisateurRepository.findOne({
      where: { keycloakId },
    });

    return user?.id || null;
  }

  @Roles({ roles: ['realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateNotificationDto): Promise<NotificationDto> {
    const entity = await this.createUseCase.execute(dto);
    return new NotificationDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(
    @Query('utilisateurId') utilisateurId?: string,
  ): Promise<NotificationDto[]> {
    if (utilisateurId) {
      const entities =
        await this.getUseCase.executeByUtilisateurId(utilisateurId);
      return entities.map((e) => new NotificationDto(e));
    }
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new NotificationDto(e));
  }

  @Public()
  @Get('me')
  async findMyNotifications(
    @Headers('authorization') authHeader: string,
  ): Promise<NotificationDto[]> {
    const userId = await this.getUserIdFromToken(authHeader);
    if (!userId) {
      return [];
    }
    const entities = await this.getUseCase.executeByUtilisateurId(userId);
    return entities.map((e) => new NotificationDto(e));
  }

  @Public()
  @Get('me/unread')
  async findMyUnreadNotifications(
    @Headers('authorization') authHeader: string,
  ): Promise<NotificationDto[]> {
    const userId = await this.getUserIdFromToken(authHeader);
    if (!userId) {
      return [];
    }
    const entities = await this.getUseCase.executeUnreadByUtilisateurId(userId);
    return entities.map((e) => new NotificationDto(e));
  }

  @Public()
  @Get('me/count')
  async countMyNotifications(
    @Headers('authorization') authHeader: string,
  ): Promise<NotificationCountDto> {
    const userId = await this.getUserIdFromToken(authHeader);
    if (!userId) {
      return new NotificationCountDto(0, 0);
    }
    const all = await this.getUseCase.executeByUtilisateurId(userId);
    const unread = await this.getUseCase.executeCountUnread(userId);
    return new NotificationCountDto(all.length, unread);
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<NotificationDto> {
    const entity = await this.getUseCase.execute(id);
    return new NotificationDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationDto,
  ): Promise<NotificationDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new NotificationDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Put(':id/read')
  async markAsRead(@Param('id') id: string): Promise<NotificationDto> {
    const entity = await this.updateUseCase.markAsRead(id);
    return new NotificationDto(entity);
  }

  @Public()
  @Put('me/read-all')
  async markAllAsRead(
    @Headers('authorization') authHeader: string,
  ): Promise<{ success: boolean }> {
    const userId = await this.getUserIdFromToken(authHeader);
    if (!userId) {
      return { success: false };
    }
    await this.updateUseCase.markAllAsRead(userId);
    return { success: true };
  }

  @Public()
  @Delete('me/all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllMyNotifications(
    @Headers('authorization') authHeader: string,
  ): Promise<void> {
    const userId = await this.getUserIdFromToken(authHeader);
    if (!userId) {
      return;
    }
    await this.deleteUseCase.executeAllByUtilisateurId(userId);
  }

  @Roles({ roles: ['realm:user'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
