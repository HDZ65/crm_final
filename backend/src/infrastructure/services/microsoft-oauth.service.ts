import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface MicrosoftOAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface MicrosoftUserInfo {
  email: string;
  displayName: string;
  givenName?: string;
  surname?: string;
}

@Injectable()
export class MicrosoftOAuthService {
  private readonly logger = new Logger(MicrosoftOAuthService.name);

  private readonly SCOPES = [
    'https://graph.microsoft.com/Mail.Send',
    'https://graph.microsoft.com/Mail.Read',
    'https://graph.microsoft.com/User.Read',
    'offline_access',
  ];

  private readonly AUTHORITY = 'https://login.microsoftonline.com/common';
  private readonly TOKEN_ENDPOINT = `${this.AUTHORITY}/oauth2/v2.0/token`;
  private readonly GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0';

  /**
   * Génère l'URL d'autorisation Microsoft OAuth2
   */
  getAuthorizationUrl(clientId: string, redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope: this.SCOPES.join(' '),
      prompt: 'consent',
    });

    // Ajouter le paramètre state pour protection CSRF
    if (state) {
      params.append('state', state);
    }

    return `${this.AUTHORITY}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Échange le code d'autorisation contre des tokens
   * Utilise l'API REST directement pour récupérer le refresh_token
   */
  async getTokensFromCode(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): Promise<MicrosoftOAuthTokens> {
    try {
      const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: this.SCOPES.join(' '),
      });

      const response = await axios.post<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        token_type: string;
        scope: string;
      }>(this.TOKEN_ENDPOINT, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.data.access_token) {
        throw new Error('No access token received from Microsoft');
      }

      if (!response.data.refresh_token) {
        this.logger.warn(
          'No refresh token received from Microsoft. User will need to re-authenticate after token expires.',
        );
      }

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token || '',
        expires_in: response.data.expires_in || 3600,
        token_type: response.data.token_type || 'Bearer',
        scope: response.data.scope || this.SCOPES.join(' '),
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as { error_description?: string; error?: string };
        throw new Error(
          `Microsoft OAuth error: ${errorData.error_description || errorData.error || 'Unknown error'}`,
        );
      }
      throw error;
    }
  }

  /**
   * Rafraîchit l'access token avec le refresh token
   * Utilise l'API REST directement pour garantir la récupération du nouveau refresh_token
   */
  async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
  ): Promise<MicrosoftOAuthTokens> {
    if (!refreshToken) {
      throw new Error('No refresh token available. User must re-authenticate.');
    }

    try {
      const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: this.SCOPES.join(' '),
      });

      const response = await axios.post<{
        access_token: string;
        refresh_token?: string;
        expires_in: number;
        token_type: string;
        scope: string;
      }>(this.TOKEN_ENDPOINT, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.data.access_token) {
        throw new Error('No access token received during refresh');
      }

      return {
        access_token: response.data.access_token,
        // Microsoft peut retourner un nouveau refresh_token ou pas
        refresh_token: response.data.refresh_token || refreshToken,
        expires_in: response.data.expires_in || 3600,
        token_type: response.data.token_type || 'Bearer',
        scope: response.data.scope || this.SCOPES.join(' '),
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as { error_description?: string; error?: string };
        // Si le refresh token est invalide/expiré, l'utilisateur doit se ré-authentifier
        if (errorData.error === 'invalid_grant') {
          throw new Error('Refresh token expired or invalid. User must re-authenticate.');
        }
        throw new Error(
          `Microsoft OAuth refresh error: ${errorData.error_description || errorData.error || 'Unknown error'}`,
        );
      }
      throw error;
    }
  }

  /**
   * Récupère les informations de l'utilisateur Microsoft
   */
  async getUserInfo(accessToken: string): Promise<MicrosoftUserInfo> {
    const response = await axios.get<{
      mail?: string;
      userPrincipalName: string;
      displayName: string;
      givenName?: string;
      surname?: string;
    }>(`${this.GRAPH_ENDPOINT}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      email: response.data.mail || response.data.userPrincipalName,
      displayName: response.data.displayName,
      givenName: response.data.givenName,
      surname: response.data.surname,
    };
  }

  /**
   * Calcule la date d'expiration du token
   */
  calculateExpiryDate(expiresIn: number): Date {
    return new Date(Date.now() + expiresIn * 1000);
  }

  /**
   * Vérifie si le token est expiré
   */
  isTokenExpired(expiryDate: Date): boolean {
    return new Date() >= expiryDate;
  }
}
