import { Injectable } from '@nestjs/common';
import { ConfidentialClientApplication } from '@azure/msal-node';
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
  private readonly SCOPES = [
    'https://graph.microsoft.com/Mail.Send',
    'https://graph.microsoft.com/Mail.Read',
    'https://graph.microsoft.com/User.Read',
    'offline_access',
  ];

  private readonly AUTHORITY = 'https://login.microsoftonline.com/common';
  private readonly GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0';

  /**
   * Génère l'URL d'autorisation Microsoft OAuth2
   */
  getAuthorizationUrl(clientId: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope: this.SCOPES.join(' '),
      prompt: 'consent',
    });

    return `${this.AUTHORITY}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Échange le code d'autorisation contre des tokens
   */
  async getTokensFromCode(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): Promise<MicrosoftOAuthTokens> {
    const msalConfig = {
      auth: {
        clientId,
        clientSecret,
        authority: this.AUTHORITY,
      },
    };

    const cca = new ConfidentialClientApplication(msalConfig);

    const tokenRequest = {
      code,
      scopes: this.SCOPES,
      redirectUri,
    };

    const response = await cca.acquireTokenByCode(tokenRequest);

    if (!response) {
      throw new Error('Failed to acquire token from Microsoft');
    }

    // Note: MSAL gère le cache des refresh tokens en interne
    // On ne peut pas récupérer directement le refresh token
    return {
      access_token: response.accessToken,
      refresh_token: '', // MSAL cache le refresh token en interne
      expires_in: response.expiresOn
        ? Math.floor((response.expiresOn.getTime() - Date.now()) / 1000)
        : 3600,
      token_type: response.tokenType,
      scope: response.scopes?.join(' ') || '',
    };
  }

  /**
   * Rafraîchit l'access token avec le refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
  ): Promise<MicrosoftOAuthTokens> {
    const msalConfig = {
      auth: {
        clientId,
        clientSecret,
        authority: this.AUTHORITY,
      },
    };

    const cca = new ConfidentialClientApplication(msalConfig);

    const tokenRequest = {
      refreshToken,
      scopes: this.SCOPES,
    };

    const response = await cca.acquireTokenByRefreshToken(tokenRequest);

    if (!response) {
      throw new Error('Failed to refresh token from Microsoft');
    }

    return {
      access_token: response.accessToken,
      refresh_token: refreshToken, // On garde le même refresh token
      expires_in: response.expiresOn
        ? Math.floor((response.expiresOn.getTime() - Date.now()) / 1000)
        : 3600,
      token_type: response.tokenType,
      scope: response.scopes?.join(' ') || '',
    };
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
