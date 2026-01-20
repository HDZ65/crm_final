import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  organisationId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private userSockets: Map<string, Set<string>> = new Map();

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove socket from user's socket set
    if (client.userId) {
      const userSocketIds = this.userSockets.get(client.userId);
      if (userSocketIds) {
        userSocketIds.delete(client.id);
        if (userSocketIds.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
    }
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { userId: string; organisationId: string },
  ) {
    client.userId = data.userId;
    client.organisationId = data.organisationId;

    // Add socket to user's socket set
    if (!this.userSockets.has(data.userId)) {
      this.userSockets.set(data.userId, new Set());
    }
    this.userSockets.get(data.userId)!.add(client.id);

    // Join rooms for targeted notifications
    client.join(`user:${data.userId}`);
    client.join(`org:${data.organisationId}`);

    this.logger.log(`User ${data.userId} authenticated on socket ${client.id}`);

    return { success: true, message: 'Authenticated successfully' };
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ) {
    client.join(data.room);
    this.logger.log(`Client ${client.id} subscribed to ${data.room}`);
    return { success: true, room: data.room };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ) {
    client.leave(data.room);
    this.logger.log(`Client ${client.id} unsubscribed from ${data.room}`);
    return { success: true, room: data.room };
  }

  // Methods to send notifications from other services

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
    this.logger.debug(`Sent ${event} to user ${userId}`);
  }

  sendToOrganisation(organisationId: string, event: string, data: any) {
    this.server.to(`org:${organisationId}`).emit(event, data);
    this.logger.debug(`Sent ${event} to organisation ${organisationId}`);
  }

  sendToAll(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.debug(`Sent ${event} to all clients`);
  }

  // Notification-specific methods

  notifyNewNotification(userId: string, notification: any) {
    this.sendToUser(userId, 'notification:new', notification);
  }

  notifyNotificationRead(userId: string, notificationId: string) {
    this.sendToUser(userId, 'notification:read', { id: notificationId });
  }

  notifyAllNotificationsRead(userId: string) {
    this.sendToUser(userId, 'notification:all-read', {});
  }

  notifyNotificationDeleted(userId: string, notificationId: string) {
    this.sendToUser(userId, 'notification:deleted', { id: notificationId });
  }

  // Business event notifications

  notifyNewClient(organisationId: string, client: any) {
    this.sendToOrganisation(organisationId, 'client:new', client);
  }

  notifyNewContrat(organisationId: string, contrat: any) {
    this.sendToOrganisation(organisationId, 'contrat:new', contrat);
  }

  notifyContratExpiringSoon(userId: string, contrat: any) {
    this.sendToUser(userId, 'contrat:expiring-soon', contrat);
  }

  notifyImpaye(userId: string, data: any) {
    this.sendToUser(userId, 'client:impaye', data);
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  isUserConnected(userId: string): boolean {
    return (
      this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0
    );
  }
}
