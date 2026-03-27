import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { KeycloakJwtGuard } from '../auth/keycloak-jwt.guard';
import { NotificationsGrpcClient } from '../grpc/notifications-grpc.client';

@ApiTags('Notifications')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsClient: NotificationsGrpcClient) {}

  // ===== CRUD Operations =====

  @Post()
  @ApiOperation({ summary: 'Create a notification' })
  createNotification(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.notificationsClient.createNotification(body));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notification by ID' })
  getNotification(@Param('id') id: string) {
    return firstValueFrom(this.notificationsClient.getNotification({ id }));
  }

  @Get()
  @ApiOperation({ summary: 'List notifications by organisation' })
  getNotifications(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.notificationsClient.getNotifications(query));
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get notifications by user' })
  getNotificationsByUser(
    @Param('userId') utilisateur_id: string,
    @Query() query: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.notificationsClient.getNotificationsByUser({ utilisateur_id, ...query }),
    );
  }

  @Get('user/:userId/unread')
  @ApiOperation({ summary: 'Get unread notifications by user' })
  getUnreadNotificationsByUser(
    @Param('userId') utilisateur_id: string,
    @Query() query: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.notificationsClient.getUnreadNotificationsByUser({ utilisateur_id, ...query }),
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a notification' })
  updateNotification(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.notificationsClient.updateNotification({ id, ...body }),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  deleteNotification(@Param('id') id: string) {
    return firstValueFrom(this.notificationsClient.deleteNotification({ id }));
  }

  // ===== Read Status Management =====

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markAsRead(@Param('id') id: string) {
    return firstValueFrom(this.notificationsClient.markAsRead({ id }));
  }

  @Put('user/:userId/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for a user' })
  markAllAsRead(@Param('userId') utilisateur_id: string) {
    return firstValueFrom(
      this.notificationsClient.markAllAsRead({ utilisateur_id }),
    );
  }

  @Get('user/:userId/unread-count')
  @ApiOperation({ summary: 'Get unread notification count for a user' })
  getUnreadCount(@Param('userId') utilisateur_id: string) {
    return firstValueFrom(
      this.notificationsClient.getUnreadCount({ utilisateur_id }),
    );
  }

  // ===== Batch Operations =====

  @Delete('user/:userId/all')
  @ApiOperation({ summary: 'Delete all notifications for a user' })
  deleteAllByUser(@Param('userId') utilisateur_id: string) {
    return firstValueFrom(
      this.notificationsClient.deleteAllByUser({ utilisateur_id }),
    );
  }

  @Delete('batch/older-than')
  @ApiOperation({ summary: 'Delete notifications older than a date' })
  deleteOlderThan(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.notificationsClient.deleteOlderThan(body));
  }

  // ===== Business Notifications =====

  @Post('business/new-client')
  @ApiOperation({ summary: 'Notify about a new client' })
  notifyNewClient(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.notificationsClient.notifyNewClient(body));
  }

  @Post('business/new-contrat')
  @ApiOperation({ summary: 'Notify about a new contract' })
  notifyNewContrat(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.notificationsClient.notifyNewContrat(body));
  }

  @Post('business/contrat-expiring-soon')
  @ApiOperation({ summary: 'Notify about a contract expiring soon' })
  notifyContratExpiringSoon(@Body() body: Record<string, unknown>) {
    return firstValueFrom(
      this.notificationsClient.notifyContratExpiringSoon(body),
    );
  }

  @Post('business/contrat-expired')
  @ApiOperation({ summary: 'Notify about an expired contract' })
  notifyContratExpired(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.notificationsClient.notifyContratExpired(body));
  }

  @Post('business/impaye')
  @ApiOperation({ summary: 'Notify about an unpaid invoice' })
  notifyImpaye(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.notificationsClient.notifyImpaye(body));
  }

  @Post('business/tache-assignee')
  @ApiOperation({ summary: 'Notify about an assigned task' })
  notifyTacheAssignee(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.notificationsClient.notifyTacheAssignee(body));
  }

  @Post('business/rappel')
  @ApiOperation({ summary: 'Send a reminder notification' })
  notifyRappel(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.notificationsClient.notifyRappel(body));
  }

  @Post('business/alerte')
  @ApiOperation({ summary: 'Send an alert notification' })
  notifyAlerte(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.notificationsClient.notifyAlerte(body));
  }

  @Post('business/info')
  @ApiOperation({ summary: 'Send an info notification' })
  notifyInfo(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.notificationsClient.notifyInfo(body));
  }

  // ===== Broadcast =====

  @Post('broadcast/organisation')
  @ApiOperation({ summary: 'Broadcast notification to an organisation' })
  notifyOrganisation(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.notificationsClient.notifyOrganisation(body));
  }

  // ===== WebSocket Status =====

  @Get('websocket/connected-users-count')
  @ApiOperation({ summary: 'Get connected WebSocket users count' })
  getConnectedUsersCount() {
    return firstValueFrom(
      this.notificationsClient.getConnectedUsersCount({}),
    );
  }

  @Get('websocket/user/:userId/connected')
  @ApiOperation({ summary: 'Check if a user is connected via WebSocket' })
  isUserConnected(@Param('userId') utilisateur_id: string) {
    return firstValueFrom(
      this.notificationsClient.isUserConnected({ utilisateur_id }),
    );
  }
}
