import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleOAuthTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date: number;
  scope: string;
  token_type: string;
}

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
}

@Injectable()
export class GoogleOAuthService {
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  /**
   * Génère l'URL d'autorisation Google OAuth2
   * @param state - Paramètre optionnel pour protection CSRF
   */
  getAuthorizationUrl(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    state?: string,
  ): string {
    const oauth2Client = this.createOAuth2Client(
      clientId,
      clientSecret,
      redirectUri,
    );

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
      prompt: 'consent', // Force le consentement pour obtenir un refresh_token
      state, // Paramètre CSRF - le frontend doit valider ce state au retour
    });
  }

  /**
   * Échange le code d'autorisation contre des tokens
   */
  async getTokensFromCode(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): Promise<GoogleOAuthTokens> {
    const oauth2Client = this.createOAuth2Client(
      clientId,
      clientSecret,
      redirectUri,
    );

    const { tokens } = await oauth2Client.getToken(code);

    return {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token || undefined,
      expiry_date: tokens.expiry_date!,
      scope: tokens.scope!,
      token_type: tokens.token_type!,
    };
  }

  /**
   * Rafraîchit l'access token avec le refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
  ): Promise<GoogleOAuthTokens> {
    const oauth2Client = this.createOAuth2Client(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { credentials } = await oauth2Client.refreshAccessToken();

    return {
      access_token: credentials.access_token!,
      refresh_token: credentials.refresh_token || refreshToken,
      expiry_date: credentials.expiry_date!,
      scope: credentials.scope!,
      token_type: credentials.token_type!,
    };
  }

  /**
   * Récupère les informations de l'utilisateur Google
   */
  async getUserInfo(
    accessToken: string,
    clientId: string,
    clientSecret: string,
  ): Promise<GoogleUserInfo> {
    const oauth2Client = this.createOAuth2Client(clientId, clientSecret);
    oauth2Client.setCredentials({ access_token: accessToken });

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    return {
      email: data.email!,
      name: data.name!,
      picture: data.picture || undefined,
    };
  }

  /**
   * Vérifie si le token est expiré
   */
  isTokenExpired(expiryDate: number): boolean {
    return Date.now() >= expiryDate;
  }

  /**
   * Révoque les tokens (déconnexion)
   */
  async revokeToken(
    accessToken: string,
    clientId: string,
    clientSecret: string,
  ): Promise<void> {
    const oauth2Client = this.createOAuth2Client(clientId, clientSecret);
    await oauth2Client.revokeToken(accessToken);
  }

  /**
   * Crée un client OAuth2 Google
   */
  private createOAuth2Client(
    clientId: string,
    clientSecret: string,
    redirectUri?: string,
  ): OAuth2Client {
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }
}
