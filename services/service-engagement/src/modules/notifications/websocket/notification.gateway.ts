import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

interface AuthenticatePayload {
  userId: string;
  organisationId: string;
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.WS_CORS_ORIGIN || '*',
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server: Server;

  // Track user connections: userId -> Set of socket IDs
  private userSockets: Map<string, Set<string>> = new Map();
  // Track socket to user mapping: socketId -> { userId, organisationId }
  private socketUsers: Map<string, { userId: string; organisationId: string }> =
    new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userData = this.socketUsers.get(client.id);

    if (userData) {
      const userSocketSet = this.userSockets.get(userData.userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userData.userId);
        }
      }
      this.socketUsers.delete(client.id);
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AuthenticatePayload,
  ) {
    const { userId, organisationId } = payload;

    // Store socket-user mapping
    this.socketUsers.set(client.id, { userId, organisationId });

    // Add to user sockets set
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);

    // Join rooms
    client.join(`user:${userId}`);
    client.join(`org:${organisationId}`);

    this.logger.log(
      `Client ${client.id} authenticated as user ${userId} in org ${organisationId}`,
    );

    return { success: true, message: 'Authenticated successfully' };
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
  ) {
    client.join(room);
    this.logger.debug(`Client ${client.id} subscribed to room: ${room}`);
    return { success: true, room };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
  ) {
    client.leave(room);
    this.logger.debug(`Client ${client.id} unsubscribed from room: ${room}`);
    return { success: true, room };
  }

  // ===== Notification Events =====

  notifyNewNotification(
    userId: string,
    organisationId: string,
    notification: any,
  ) {
    this.sendToUser(userId, 'notification:new', notification);
    this.logger.debug(`Sent new notification to user ${userId}`);
  }

  notifyNotificationRead(userId: string, organisationId: string, notificationId: string) {
    this.sendToUser(userId, 'notification:read', { id: notificationId });
  }

  notifyAllNotificationsRead(userId: string, organisationId: string) {
    this.sendToUser(userId, 'notification:all-read', {});
  }

  notifyNotificationDeleted(
    userId: string,
    organisationId: string,
    notificationId: string,
  ) {
    this.sendToUser(userId, 'notification:deleted', { id: notificationId });
  }

  // ===== Business Events =====

  notifyNewClient(userId: string, organisationId: string, data: any) {
    this.sendToUser(userId, 'client:new', data);
    this.sendToOrganisation(organisationId, 'client:new', data);
  }

  notifyNewContrat(userId: string, organisationId: string, data: any) {
    this.sendToUser(userId, 'contrat:new', data);
    this.sendToOrganisation(organisationId, 'contrat:new', data);
  }

  notifyContratExpiringSoon(userId: string, organisationId: string, data: any) {
    this.sendToUser(userId, 'contrat:expiring-soon', data);
  }

  notifyImpaye(userId: string, organisationId: string, data: any) {
    this.sendToUser(userId, 'client:impaye', data);
    this.sendToOrganisation(organisationId, 'client:impaye', data);
  }

  // ===== Send Methods =====

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  sendToOrganisation(organisationId: string, event: string, data: any) {
    this.server.to(`org:${organisationId}`).emit(event, data);
  }

  sendToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  // ===== Connection Status =====

  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  isUserConnected(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return sockets !== undefined && sockets.size > 0;
  }
}
