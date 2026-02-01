/**
 * Auth Constants
 * Configuration centralisee pour l'authentification
 */

// Routes publiques (pas besoin d'authentification)
export const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/auth',
  '/invite',
  '/forgot-password',
  '/reset-password',
] as const;

// Configuration des tokens
export const TOKEN_CONFIG = {
  /** Temps avant expiration pour declencher un refresh (en secondes) */
  REFRESH_THRESHOLD_SECONDS: 60,
  /** Duree du cookie d'organisation (en secondes) */
  ORG_COOKIE_MAX_AGE: 60 * 60 * 24 * 30, // 30 jours
} as const;

// Noms des cookies
export const COOKIE_NAMES = {
  SESSION_TOKEN: 'next-auth.session-token',
  CSRF_TOKEN: 'next-auth.csrf-token',
  ACTIVE_ORG: 'active_organisation_id',
} as const;

// URLs de redirection
export const AUTH_URLS = {
  LOGIN: '/login',
  UNAUTHORIZED: '/unauthorized',
  DEFAULT_CALLBACK: '/',
} as const;

// Messages d'erreur
export const AUTH_ERRORS = {
  REFRESH_TOKEN_ERROR: 'RefreshAccessTokenError',
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
  GENERIC_ERROR: 'Une erreur est survenue. Veuillez reessayer.',
} as const;
