/**
 * Keycloak API Client
 * Fonctions pour interagir avec Keycloak (authentification, refresh token)
 */

import { TOKEN_CONFIG, AUTH_ERRORS } from './constants';

// Types
interface KeycloakTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface KeycloakUserInfo {
  sub: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
}

export interface TokenData {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: string;
  [key: string]: unknown;
}

// Configuration Keycloak
const getKeycloakConfig = () => ({
  issuer: process.env.KEYCLOAK_ISSUER!,
  clientId: process.env.KEYCLOAK_ID!,
  clientSecret: process.env.KEYCLOAK_SECRET!,
});

/**
 * Authentifie un utilisateur avec email/password
 */
export async function authenticateWithCredentials(
  email: string,
  password: string
): Promise<{
  user: {
    id: string;
    email: string;
    name: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  } | null;
  error?: string;
}> {
  const config = getKeycloakConfig();

  try {
    // 1. Obtenir les tokens
    const tokenResponse = await fetch(
      `${config.issuer}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          grant_type: 'password',
          username: email,
          password: password,
          scope: 'openid email profile',
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error('Keycloak authentication failed:', tokenResponse.status, errorData);
      return { user: null, error: AUTH_ERRORS.INVALID_CREDENTIALS };
    }

    const tokens: KeycloakTokenResponse = await tokenResponse.json();

    // 2. Obtenir les infos utilisateur
    const userInfoResponse = await fetch(
      `${config.issuer}/protocol/openid-connect/userinfo`,
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    if (!userInfoResponse.ok) {
      return { user: null, error: 'Failed to fetch user info' };
    }

    const userInfo: KeycloakUserInfo = await userInfoResponse.json();

    // 3. Construire et retourner l'utilisateur
    const name = userInfo.name || 
      [userInfo.given_name, userInfo.family_name].filter(Boolean).join(' ') || 
      userInfo.email || '';

    return {
      user: {
        id: userInfo.sub,
        email: userInfo.email || email,
        name,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '',
        expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
      },
    };
  } catch (error) {
    console.error('Error during Keycloak authentication:', error);
    return { user: null, error: AUTH_ERRORS.GENERIC_ERROR };
  }
}

/**
 * Rafraichit un access token avec le refresh token
 */
export async function refreshAccessToken(token: TokenData): Promise<TokenData> {
  const config = getKeycloakConfig();

  try {
    const response = await fetch(
      `${config.issuer}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken || '',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error_description || 'Token refresh failed');
    }

    const tokens: KeycloakTokenResponse = await response.json();

    return {
      ...token,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? token.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
      error: undefined,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: AUTH_ERRORS.REFRESH_TOKEN_ERROR,
    };
  }
}

/**
 * Determine si le token doit etre rafraichi
 */
export function shouldRefreshToken(expiresAt: number): boolean {
  const now = Date.now() / 1000;
  const timeUntilExpiry = expiresAt - now;
  return timeUntilExpiry <= TOKEN_CONFIG.REFRESH_THRESHOLD_SECONDS;
}
