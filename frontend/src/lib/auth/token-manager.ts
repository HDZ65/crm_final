import { getSession } from "next-auth/react";
import { auth } from "./auth";
import { AUTH_ERRORS } from "./auth.config";

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

export function parseJWT(token: string): JWTPayload | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    const jsonPayload =
      typeof window === "undefined"
        ? Buffer.from(base64, "base64").toString("utf-8")
        : decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function getKeycloakIdFromToken(token: string): string | null {
  const payload = parseJWT(token);
  return payload?.sub ?? null;
}

export function getRolesFromToken(token: string): string[] {
  const payload = parseJWT(token);
  return payload?.realm_access?.roles ?? [];
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

export function getTokenTimeRemaining(token: string): number {
  const payload = parseJWT(token);
  if (!payload?.exp) return 0;
  return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
}

function isServer(): boolean {
  return typeof window === "undefined";
}

export async function getAccessToken(): Promise<string | null> {
  try {
    if (isServer()) {
      const session = await auth();
      return session?.accessToken ?? null;
    }

    const session = await getSession();
    return session?.accessToken ?? null;
  } catch {
    return null;
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    if (isServer()) {
      const session = await auth();
      if (!session || session.error === AUTH_ERRORS.REFRESH_TOKEN_ERROR) {
        return null;
      }

      return session.accessToken ?? null;
    }

    const session = await getSession();
    if (!session || session.error === AUTH_ERRORS.REFRESH_TOKEN_ERROR) {
      return null;
    }

    return session.accessToken ?? null;
  } catch {
    return null;
  }
}
