/**
 * Auth Module - Index
 * Export centralisé de tous les utilitaires d'authentification
 */

// Constants
export {
  PUBLIC_ROUTES,
  TOKEN_CONFIG,
  COOKIE_NAMES,
  AUTH_URLS,
  AUTH_ERRORS,
} from './constants';

// JWT Utilities
export {
  parseJWT,
  getKeycloakIdFromToken,
  getRolesFromToken,
  isTokenExpired,
  getTokenTimeRemaining,
  type JWTPayload,
} from './jwt';

// Keycloak Client
export {
  authenticateWithCredentials,
  refreshAccessToken,
  shouldRefreshToken,
  type TokenData,
} from './keycloak';
