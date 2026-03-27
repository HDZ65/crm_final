import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface KeycloakUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  enabled?: boolean;
}

export interface KeycloakGroup {
  id: string;
  name?: string;
  path?: string;
  parentId?: string;
}

export interface KeycloakSession {
  id: string;
  userId?: string;
  username?: string;
  ipAddress?: string;
  start?: number;
  lastAccess?: number;
  clients?: Record<string, string>;
  rememberMe?: boolean;
}

interface KeycloakTokenResponse {
  access_token?: string;
  expires_in?: number;
}

let cachedAdminToken: { token: string; expiresAt: number } | null = null;

@Injectable()
export class KeycloakAdminService {
  private readonly logger = new Logger(KeycloakAdminService.name);

  constructor(private readonly configService: ConfigService) {}

  async getUserById(keycloakId: string): Promise<KeycloakUser> {
    const user = await this.requestAdmin<KeycloakUserRepresentation>(`/users/${encodeURIComponent(keycloakId)}`);
    return this.mapUser(user);
  }

  async getUserByEmail(email: string): Promise<KeycloakUser | null> {
    const searchParams = new URLSearchParams({
      email,
      exact: 'true',
    });
    const users = await this.requestAdmin<KeycloakUserRepresentation[]>(`/users?${searchParams.toString()}`);
    if (users.length === 0) {
      return null;
    }
    return this.mapUser(users[0]!);
  }

  async getGroupMembers(groupId: string): Promise<KeycloakUser[]> {
    const users = await this.requestAdmin<KeycloakUserRepresentation[]>(
      `/groups/${encodeURIComponent(groupId)}/members`,
    );
    return users.map((user) => this.mapUser(user));
  }

  async getUserGroups(userId: string): Promise<KeycloakGroup[]> {
    const groups = await this.requestAdmin<KeycloakGroupRepresentation[]>(
      `/users/${encodeURIComponent(userId)}/groups`,
    );
    return groups.map((group) => this.mapGroup(group));
  }

  async getUserSessions(userId: string): Promise<KeycloakSession[]> {
    const sessions = await this.requestAdmin<KeycloakSessionRepresentation[]>(
      `/users/${encodeURIComponent(userId)}/sessions`,
    );
    return sessions.map((session) => this.mapSession(session));
  }

  private async getAdminToken(): Promise<string> {
    if (cachedAdminToken && Date.now() < cachedAdminToken.expiresAt) {
      return cachedAdminToken.token;
    }

    const realm = this.getRequiredEnv('KEYCLOAK_REALM');
    const clientId = this.getRequiredEnv('KEYCLOAK_ADMIN_CLIENT_ID');
    const clientSecret = this.getRequiredEnv('KEYCLOAK_ADMIN_CLIENT_SECRET');
    const tokenUrl = `${this.getKeycloakBaseUrl()}/realms/${encodeURIComponent(realm)}/protocol/openid-connect/token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      this.logger.error(`Failed to get Keycloak admin token (${response.status}): ${errorText}`);
      throw new Error('Failed to get Keycloak admin token');
    }

    const payload = (await response.json()) as KeycloakTokenResponse;
    if (!payload.access_token) {
      throw new Error('Missing Keycloak admin access token');
    }

    const expiresIn = Math.max((payload.expires_in ?? 300) - 30, 0);
    cachedAdminToken = {
      token: payload.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    };

    return payload.access_token;
  }

  private async requestAdmin<T>(path: string): Promise<T> {
    const token = await this.getAdminToken();
    const realm = this.getRequiredEnv('KEYCLOAK_REALM');
    const url = `${this.getKeycloakBaseUrl()}/admin/realms/${encodeURIComponent(realm)}${path}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      this.logger.error(`Keycloak admin request failed (${response.status}) ${path}: ${errorText}`);
      throw new Error(`Keycloak admin request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  }

  private getKeycloakBaseUrl(): string {
    const rawUrl = this.getRequiredEnv('KEYCLOAK_URL').replace(/\/+$/, '');
    return rawUrl.replace(/\/realms\/[^/]+$/, '');
  }

  private getRequiredEnv(name: string): string {
    const value = this.configService.get<string>(name);
    if (!value) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
  }

  private mapUser(user: KeycloakUserRepresentation): KeycloakUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      enabled: user.enabled,
    };
  }

  private mapGroup(group: KeycloakGroupRepresentation): KeycloakGroup {
    return {
      id: group.id,
      name: group.name,
      path: group.path,
      parentId: group.parentId,
    };
  }

  private mapSession(session: KeycloakSessionRepresentation): KeycloakSession {
    return {
      id: session.id,
      userId: session.userId,
      username: session.username,
      ipAddress: session.ipAddress,
      start: session.start,
      lastAccess: session.lastAccess,
      clients: session.clients,
      rememberMe: session.rememberMe,
    };
  }
}

interface KeycloakUserRepresentation {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  enabled?: boolean;
}

interface KeycloakGroupRepresentation {
  id: string;
  name?: string;
  path?: string;
  parentId?: string;
}

interface KeycloakSessionRepresentation {
  id: string;
  userId?: string;
  username?: string;
  ipAddress?: string;
  start?: number;
  lastAccess?: number;
  clients?: Record<string, string>;
  rememberMe?: boolean;
}
