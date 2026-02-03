"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useMemo, useCallback } from "react";
import { api } from "@/lib/api";
import { AUTH_URLS } from "@/lib/auth/auth.config";
import { parseJWT, type JWTPayload } from "@/lib/auth/token-manager";

// =============================================================================
// Types
// =============================================================================

export interface AuthUser {
  /** Keycloak user ID (sub claim) */
  id: string;
  /** Username from Keycloak */
  username: string;
  /** User email */
  email: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Full name */
  fullName: string;
  /** User roles from Keycloak */
  roles: string[];
}

export interface UseAuthReturn {
  /** Access token (JWT) */
  token: string | undefined;
  /** True when session status is determined */
  ready: boolean;
  /** True if user is authenticated */
  isAuthenticated: boolean;
  /** True while session is loading */
  isLoading: boolean;
  /** User profile parsed from token */
  user: AuthUser | null;
  /** @deprecated Use `user` instead */
  profile: AuthUser | null;
  /** Session error (e.g., RefreshAccessTokenError) */
  error: string | undefined;
  /** Raw NextAuth session (for advanced use cases) */
  session: ReturnType<typeof useSession>["data"];
  /** Check if user has a specific role */
  hasRole: (role: string) => boolean;
  /** Check if user has any of the specified roles */
  hasAnyRole: (roles: string[]) => boolean;
  /** Redirect to login */
  login: (callbackUrl?: string) => void;
  /** Sign out and redirect */
  logout: (callbackUrl?: string) => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();

  const token = session?.accessToken;
  const isLoading = status === "loading";
  const ready = !isLoading;
  const isAuthenticated = status === "authenticated";
  const error = session?.error;

  // Sync token with API client
  useEffect(() => {
    api.setToken(token ?? null);
  }, [token]);

  // Parse user from token
  const user = useMemo((): AuthUser | null => {
    if (!token || !session?.user) return null;

    const payload = parseJWT(token);
    if (!payload) return null;

    return buildUserFromPayload(payload, session.user);
  }, [token, session?.user]);

  // Role checking functions
  const hasRole = useCallback(
    (role: string): boolean => {
      return user?.roles.includes(role) ?? false;
    },
    [user?.roles]
  );

  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      return roles.some((role) => hasRole(role));
    },
    [hasRole]
  );

  // Auth actions
  const login = useCallback((callbackUrl?: string) => {
    signIn("credentials", {
      callbackUrl: callbackUrl ?? AUTH_URLS.DEFAULT_CALLBACK,
    });
  }, []);

  const logout = useCallback((callbackUrl?: string) => {
    signOut({ callbackUrl: callbackUrl ?? AUTH_URLS.DEFAULT_CALLBACK });
  }, []);

  return {
    token,
    ready,
    isAuthenticated,
    isLoading,
    user,
    profile: user, // Alias for backward compatibility
    error,
    session,
    hasRole,
    hasAnyRole,
    login,
    logout,
  };
}

// =============================================================================
// Helpers
// =============================================================================

function buildUserFromPayload(
  payload: JWTPayload,
  sessionUser: { name?: string | null; email?: string | null }
): AuthUser {
  const firstName = payload.given_name ?? "";
  const lastName = payload.family_name ?? "";
  const fullName =
    payload.name ?? sessionUser.name ?? [firstName, lastName].filter(Boolean).join(" ");

  return {
    id: payload.sub ?? "",
    username: payload.preferred_username ?? sessionUser.name ?? "",
    email: payload.email ?? sessionUser.email ?? "",
    firstName,
    lastName,
    fullName,
    roles: payload.realm_access?.roles ?? [],
  };
}
