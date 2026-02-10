import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OAuthConnectionEntity,
  OAuthConnectionStatus,
  OAuthProvider,
} from '../../../../../domain/engagement/entities';
import { EncryptionService } from '../../../../common/encryption.service';

interface OAuthTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface OAuthProviderConfig {
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
}

interface OAuthStatePayload {
  userId: string;
  organisationId: string;
  provider: OAuthProvider;
  scopes: string[];
  nonce: string;
}

interface GetAuthUrlInput {
  userId: string;
  organisationId: string;
  provider: OAuthProvider | number | string;
  redirectUri: string;
  scopes?: string[];
}

interface HandleCallbackInput {
  code: string;
  state: string;
  provider: OAuthProvider | number | string;
  redirectUri: string;
}

interface ConnectProviderInput {
  userId: string;
  organisationId: string;
  provider: OAuthProvider | number | string;
  accessToken: string;
  refreshToken?: string;
  scopes?: string;
  tokenExpiresAt?: string | Date;
}

interface ListConnectionsInput {
  userId: string;
  organisationId: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class OAuthConnectionAgendaService {
  constructor(
    @InjectRepository(OAuthConnectionEntity)
    private readonly oauthConnectionRepository: Repository<OAuthConnectionEntity>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async getAuthUrl(input: GetAuthUrlInput): Promise<{ authUrl: string; state: string }> {
    const provider = this.resolveProvider(input.provider);
    const config = this.getProviderConfig(provider);

    const scopes = input.scopes?.length ? input.scopes : this.getDefaultScopes(provider);
    const statePayload: OAuthStatePayload = {
      userId: input.userId,
      organisationId: input.organisationId,
      provider,
      scopes,
      nonce: this.generateNonce(),
    };
    const state = Buffer.from(JSON.stringify(statePayload), 'utf8').toString('base64url');

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: input.redirectUri,
      response_type: 'code',
      state,
      scope: scopes.join(' '),
    });

    if (provider === OAuthProvider.GOOGLE) {
      params.set('access_type', 'offline');
      params.set('prompt', 'consent');
      params.set('include_granted_scopes', 'true');
    }

    if (provider === OAuthProvider.MICROSOFT) {
      params.set('response_mode', 'query');
    }

    return {
      authUrl: `${config.authorizeUrl}?${params.toString()}`,
      state,
    };
  }

  async handleCallback(input: HandleCallbackInput): Promise<OAuthConnectionEntity> {
    const provider = this.resolveProvider(input.provider);
    const statePayload = this.parseAndValidateState(input.state, provider);

    const tokenResponse = await this.exchangeAuthorizationCode(provider, {
      code: input.code,
      redirectUri: input.redirectUri,
    });

    if (!tokenResponse.access_token) {
      throw new InternalServerErrorException('OAuth provider did not return an access token');
    }

    const existing = await this.oauthConnectionRepository.findOne({
      where: {
        userId: statePayload.userId,
        provider,
      },
    });

    const connection = existing || this.oauthConnectionRepository.create();
    connection.userId = statePayload.userId;
    connection.organisationId = statePayload.organisationId;
    connection.provider = provider;
    connection.scopes = tokenResponse.scope || statePayload.scopes.join(' ');
    connection.accessTokenEncrypted = this.encryptionService.encrypt(tokenResponse.access_token);
    connection.refreshTokenEncrypted = tokenResponse.refresh_token
      ? this.encryptionService.encrypt(tokenResponse.refresh_token)
      : connection.refreshTokenEncrypted;
    if (tokenResponse.expires_in) {
      connection.tokenExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
    }
    connection.status = OAuthConnectionStatus.ACTIVE;
    connection.connectedAt = connection.connectedAt || new Date();

    return this.oauthConnectionRepository.save(connection);
  }

  async connectProvider(input: ConnectProviderInput): Promise<OAuthConnectionEntity> {
    const provider = this.resolveProvider(input.provider);

    const existing = await this.oauthConnectionRepository.findOne({
      where: { userId: input.userId, provider },
    });

    const connection = existing || this.oauthConnectionRepository.create();
    connection.userId = input.userId;
    connection.organisationId = input.organisationId;
    connection.provider = provider;
    connection.scopes = input.scopes || connection.scopes;
    connection.accessTokenEncrypted = this.encryptionService.encrypt(input.accessToken);
    connection.refreshTokenEncrypted = input.refreshToken
      ? this.encryptionService.encrypt(input.refreshToken)
      : connection.refreshTokenEncrypted;
    if (input.tokenExpiresAt) {
      connection.tokenExpiresAt = new Date(input.tokenExpiresAt);
    }
    connection.status = OAuthConnectionStatus.ACTIVE;
    connection.connectedAt = connection.connectedAt || new Date();

    return this.oauthConnectionRepository.save(connection);
  }

  async refreshToken(id: string): Promise<OAuthConnectionEntity> {
    const connection = await this.oauthConnectionRepository.findOne({ where: { id } });
    if (!connection) {
      throw new NotFoundException(`OAuth connection with id ${id} not found`);
    }

    if (!connection.refreshTokenEncrypted) {
      throw new BadRequestException('OAuth connection has no refresh token');
    }

    const provider = connection.provider;
    const refreshToken = this.encryptionService.decrypt(connection.refreshTokenEncrypted);
    const tokenResponse = await this.exchangeRefreshToken(provider, refreshToken);

    if (!tokenResponse.access_token) {
      throw new InternalServerErrorException('OAuth provider did not return a refreshed access token');
    }

    connection.accessTokenEncrypted = this.encryptionService.encrypt(tokenResponse.access_token);
    if (tokenResponse.refresh_token) {
      connection.refreshTokenEncrypted = this.encryptionService.encrypt(tokenResponse.refresh_token);
    }
    if (tokenResponse.scope) {
      connection.scopes = tokenResponse.scope;
    }
    connection.tokenExpiresAt = tokenResponse.expires_in
      ? new Date(Date.now() + tokenResponse.expires_in * 1000)
      : connection.tokenExpiresAt;
    connection.status = OAuthConnectionStatus.ACTIVE;

    return this.oauthConnectionRepository.save(connection);
  }

  async listConnections(
    input: ListConnectionsInput,
  ): Promise<{ connections: OAuthConnectionEntity[]; total: number }> {
    const page = input.page && input.page > 0 ? input.page : 1;
    const limit = input.limit && input.limit > 0 ? Math.min(input.limit, 100) : 10;

    const [connections, total] = await this.oauthConnectionRepository.findAndCount({
      where: {
        userId: input.userId,
        organisationId: input.organisationId,
      },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return { connections, total };
  }

  async disconnectProvider(id: string): Promise<void> {
    const connection = await this.oauthConnectionRepository.findOne({ where: { id } });
    if (!connection) {
      throw new NotFoundException(`OAuth connection with id ${id} not found`);
    }

    connection.status = OAuthConnectionStatus.REVOKED;
    await this.oauthConnectionRepository.save(connection);
  }

  private getProviderConfig(provider: OAuthProvider): OAuthProviderConfig {
    switch (provider) {
      case OAuthProvider.ZOOM:
        return {
          authorizeUrl: 'https://zoom.us/oauth/authorize',
          tokenUrl: 'https://zoom.us/oauth/token',
          clientId: this.readEnv('ZOOM_CLIENT_ID'),
          clientSecret: this.readEnv('ZOOM_CLIENT_SECRET'),
        };
      case OAuthProvider.GOOGLE:
        return {
          authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
          tokenUrl: 'https://oauth2.googleapis.com/token',
          clientId: this.readEnv('GOOGLE_CLIENT_ID'),
          clientSecret: this.readEnv('GOOGLE_CLIENT_SECRET'),
        };
      case OAuthProvider.MICROSOFT:
        return {
          authorizeUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
          tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
          clientId: this.readEnv('MICROSOFT_CLIENT_ID'),
          clientSecret: this.readEnv('MICROSOFT_CLIENT_SECRET'),
        };
      default:
        throw new BadRequestException('Unsupported OAuth provider');
    }
  }

  private getDefaultScopes(provider: OAuthProvider): string[] {
    switch (provider) {
      case OAuthProvider.ZOOM:
        return ['meeting:read', 'user:read'];
      case OAuthProvider.GOOGLE:
        return ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar'];
      case OAuthProvider.MICROSOFT:
        return ['openid', 'profile', 'email', 'offline_access', 'Calendars.ReadWrite'];
      default:
        return [];
    }
  }

  private parseAndValidateState(state: string, provider: OAuthProvider): OAuthStatePayload {
    try {
      const statePayload = JSON.parse(
        Buffer.from(state, 'base64url').toString('utf8'),
      ) as OAuthStatePayload;

      if (statePayload.provider !== provider) {
        throw new BadRequestException('OAuth provider mismatch in callback state');
      }

      if (!statePayload.userId || !statePayload.organisationId) {
        throw new BadRequestException('OAuth callback state is missing required context');
      }

      return statePayload;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid OAuth callback state');
    }
  }

  private async exchangeAuthorizationCode(
    provider: OAuthProvider,
    input: { code: string; redirectUri: string },
  ): Promise<OAuthTokenResponse> {
    const config = this.getProviderConfig(provider);

    if (provider === OAuthProvider.ZOOM) {
      return this.requestToken(
        provider,
        config.tokenUrl,
        {
          grant_type: 'authorization_code',
          code: input.code,
          redirect_uri: input.redirectUri,
        },
        true,
        config.clientId,
        config.clientSecret,
      );
    }

    return this.requestToken(provider, config.tokenUrl, {
      grant_type: 'authorization_code',
      code: input.code,
      redirect_uri: input.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });
  }

  private async exchangeRefreshToken(
    provider: OAuthProvider,
    refreshToken: string,
  ): Promise<OAuthTokenResponse> {
    const config = this.getProviderConfig(provider);

    if (provider === OAuthProvider.ZOOM) {
      return this.requestToken(
        provider,
        config.tokenUrl,
        {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        },
        true,
        config.clientId,
        config.clientSecret,
      );
    }

    return this.requestToken(provider, config.tokenUrl, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });
  }

  private async requestToken(
    provider: OAuthProvider,
    tokenUrl: string,
    body: Record<string, string>,
    useBasicAuth = false,
    clientId?: string,
    clientSecret?: string,
  ): Promise<OAuthTokenResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (useBasicAuth && clientId && clientSecret) {
      headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers,
      body: new URLSearchParams(body),
    });

    const tokenResponse = (await response.json()) as OAuthTokenResponse;

    if (!response.ok || tokenResponse.error) {
      const providerName = provider.toUpperCase();
      const details = tokenResponse.error_description || tokenResponse.error || 'unknown error';
      throw new BadRequestException(`${providerName} token exchange failed: ${details}`);
    }

    return tokenResponse;
  }

  private resolveProvider(provider: OAuthProvider | number | string): OAuthProvider {
    if (typeof provider === 'string') {
      const normalized = provider.toLowerCase();
      if (normalized === OAuthProvider.ZOOM) {
        return OAuthProvider.ZOOM;
      }
      if (normalized === OAuthProvider.GOOGLE) {
        return OAuthProvider.GOOGLE;
      }
      if (normalized === OAuthProvider.MICROSOFT) {
        return OAuthProvider.MICROSOFT;
      }
    }

    if (provider === 1) {
      return OAuthProvider.ZOOM;
    }
    if (provider === 2) {
      return OAuthProvider.GOOGLE;
    }
    if (provider === 3) {
      return OAuthProvider.MICROSOFT;
    }

    throw new BadRequestException('Unsupported OAuth provider');
  }

  private readEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new InternalServerErrorException(`Missing required environment variable: ${name}`);
    }
    return value;
  }

  private generateNonce(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}
