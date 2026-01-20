"use client";

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useMemo } from 'react';
import { api } from "@/lib/api";
import { UserProfile } from "@/types/user-profile";

export function useAuth() {
  const { data: session, status } = useSession();

  const token = session?.accessToken;
  const ready = status !== 'loading';
  const isAuthenticated = status === 'authenticated';

  // Keep API client token in sync
  useEffect(() => {
    api.setToken(token ?? null);
  }, [token]);

  type TokenPayload = {
    sub?: string;
    preferred_username?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    name?: string;
    realm_access?: { roles?: string[] };
  };

  const profile = useMemo((): UserProfile | null => {
    if (!session?.user) return null;

    let parsedToken: TokenPayload | null = null;
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        parsedToken = JSON.parse(window.atob(base64)) as TokenPayload;
      } catch (error) {
        console.error('Failed to parse token:', error);
      }
    }

    return {
      id: parsedToken?.sub || '',
      username: parsedToken?.preferred_username || session.user.name || '',
      email: parsedToken?.email || session.user.email || '',
      firstName: parsedToken?.given_name || '',
      lastName: parsedToken?.family_name || '',
      fullName: parsedToken?.name || session.user.name || '',
      roles: parsedToken?.realm_access?.roles || [],
      organizationId: (parsedToken as Record<string, unknown>)?.organizationId as string | undefined,
    };
  }, [session, token]);

  const hasRole = (role: string): boolean => {
    return profile?.roles.includes(role) || false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const login = (callbackUrl?: string) => {
    signIn('keycloak', { callbackUrl: callbackUrl || '/' });
  };

  const logout = () => {
    signOut({ callbackUrl: '/' });
  };

  const register = () => {
    const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080';
    const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'master';
    const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'next-frontend-local';
    const redirectUri = encodeURIComponent(window.location.origin);

    window.location.href = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/registrations?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}`;
  };

  return {
    token,
    ready,
    isAuthenticated,
    login,
    logout,
    register,
    profile,
    hasRole,
    hasAnyRole,
    session,
  };
}
