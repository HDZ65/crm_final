import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { OAuthConnectionAgendaService } from '../../persistence/typeorm/repositories/engagement/oauth-connection.service';
import {
  OAuthConnectionEntity,
  OAuthConnectionStatus,
  OAuthProvider,
} from '../../../domain/engagement/entities';

@Controller()
export class OAuthConnectionController {
  constructor(private readonly oauthConnectionService: OAuthConnectionAgendaService) {}

  @GrpcMethod('OAuthConnectionService', 'ConnectProvider')
  async connectProvider(data: any): Promise<any> {
    const connection = await this.oauthConnectionService.connectProvider({
      userId: data.user_id,
      organisationId: data.organisation_id,
      provider: data.provider,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      scopes: data.scopes,
      tokenExpiresAt: data.token_expires_at,
    });

    return this.toProtoConnection(connection);
  }

  @GrpcMethod('OAuthConnectionService', 'DisconnectProvider')
  async disconnectProvider(data: any): Promise<any> {
    await this.oauthConnectionService.disconnectProvider(data.id);
    return { success: true };
  }

  @GrpcMethod('OAuthConnectionService', 'GetAuthUrl')
  async getAuthUrl(data: any): Promise<any> {
    const result = await this.oauthConnectionService.getAuthUrl({
      userId: data.user_id,
      organisationId: data.organisation_id,
      provider: data.provider,
      redirectUri: data.redirect_uri,
      scopes: data.scopes,
    });

    return { auth_url: result.authUrl, state: result.state };
  }

  @GrpcMethod('OAuthConnectionService', 'HandleCallback')
  async handleCallback(data: any): Promise<any> {
    const connection = await this.oauthConnectionService.handleCallback({
      code: data.code,
      state: data.state,
      provider: data.provider,
      redirectUri: data.redirect_uri,
    });

    return this.toProtoConnection(connection);
  }

  @GrpcMethod('OAuthConnectionService', 'ListConnections')
  async listConnections(data: any): Promise<any> {
    const page = data.pagination?.page || 1;
    const limit = data.pagination?.limit || 10;

    const { connections, total } = await this.oauthConnectionService.listConnections({
      userId: data.user_id,
      organisationId: data.organisation_id,
      page,
      limit,
    });

    return {
      connections: connections.map((connection) => this.toProtoConnection(connection)),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  @GrpcMethod('OAuthConnectionService', 'RefreshToken')
  async refreshToken(data: any): Promise<any> {
    const connection = await this.oauthConnectionService.refreshToken(data.id);
    return this.toProtoConnection(connection);
  }

  private toProtoConnection(connection: OAuthConnectionEntity): any {
    return {
      id: connection.id,
      user_id: connection.userId,
      organisation_id: connection.organisationId,
      provider: this.toProtoProvider(connection.provider),
      scopes: connection.scopes || '',
      status: this.toProtoStatus(connection.status),
      connected_at: connection.connectedAt?.toISOString() || '',
      token_expires_at: connection.tokenExpiresAt?.toISOString() || '',
      sync_token: connection.syncToken || '',
      channel_id: connection.channelId || '',
      channel_expiration: connection.channelExpiration?.toISOString() || '',
      created_at: connection.createdAt?.toISOString() || '',
      updated_at: connection.updatedAt?.toISOString() || '',
    };
  }

  private toProtoProvider(provider: OAuthProvider): number {
    switch (provider) {
      case OAuthProvider.ZOOM:
        return 1;
      case OAuthProvider.GOOGLE:
        return 2;
      case OAuthProvider.MICROSOFT:
        return 3;
      default:
        return 0;
    }
  }

  private toProtoStatus(status: OAuthConnectionStatus): number {
    switch (status) {
      case OAuthConnectionStatus.ACTIVE:
        return 1;
      case OAuthConnectionStatus.EXPIRED:
        return 2;
      case OAuthConnectionStatus.REVOKED:
        return 3;
      case OAuthConnectionStatus.ERROR:
        return 4;
      default:
        return 0;
    }
  }
}
