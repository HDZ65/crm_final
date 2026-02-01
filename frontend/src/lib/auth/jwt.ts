/**
 * JWT Utilities
 * Fonctions pour parser et extraire des informations des tokens JWT
 */

export interface JWTPayload {
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  realm_access?: { roles?: string[] };
  exp?: number;
  iat?: number;
}

/**
 * Parse un token JWT et retourne le payload
 * Fonctionne cote serveur et client
 */
export function parseJWT(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Utiliser Buffer cote serveur, atob cote client
    const jsonPayload = typeof window === 'undefined'
      ? Buffer.from(base64, 'base64').toString('utf-8')
      : decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Extrait le Keycloak ID (sub) d'un token JWT
 */
export function getKeycloakIdFromToken(token: string): string | null {
  const payload = parseJWT(token);
  return payload?.sub ?? null;
}

/**
 * Extrait les roles du token JWT
 */
export function getRolesFromToken(token: string): string[] {
  const payload = parseJWT(token);
  return payload?.realm_access?.roles ?? [];
}

/**
 * Verifie si le token est expire
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

/**
 * Retourne le temps restant avant expiration (en secondes)
 */
export function getTokenTimeRemaining(token: string): number {
  const payload = parseJWT(token);
  if (!payload?.exp) return 0;
  return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
}
