"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/auth';
import {
  getCurrentUserByKeycloakId,
  setActiveOrganisationId,
  type AuthMeResponse,
} from '@/actions/auth';
import type {
  UserOrganisation,
  UserRole,
  Utilisateur,
} from '@proto/organisations/users';

interface OrganisationContextType {
  /** Full user profile with utilisateur and organisations */
  user: AuthMeResponse | null;
  /** Shortcut to user.utilisateur for convenience */
  utilisateur: Utilisateur | null;
  organisations: UserOrganisation[];
  activeOrganisation: UserOrganisation | null;
  hasOrganisation: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  setActiveOrganisation: (org: UserOrganisation) => void;
  isOwner: boolean;
}

const OrganisationContext = createContext<OrganisationContextType | null>(null);

interface OrganisationProviderProps {
  children: React.ReactNode;
  /** Initial user data from server - skips client-side fetch if provided */
  initialUser?: AuthMeResponse | null;
  /** Initial active organisation ID from server (cookie) */
  initialActiveOrgId?: string | null;
}

export function OrganisationProvider({
  children,
  initialUser = null,
  initialActiveOrgId = null,
}: OrganisationProviderProps) {
  const { ready, isAuthenticated, profile } = useAuth();
  const [user, setUser] = useState<AuthMeResponse | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const [error, setError] = useState<Error | null>(null);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(initialActiveOrgId);
  const hasFetched = useRef(!!initialUser);

  const fetchMe = useCallback(async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    setError(null);
    try {
      // Appel gRPC via Server Action
      // Pass user info for auto-creation if user doesn't exist
      const result = await getCurrentUserByKeycloakId(profile.id, {
        email: profile.email,
        name: profile.fullName,
        given_name: profile.firstName,
        family_name: profile.lastName,
      });
      if (result.error) {
        throw new Error(result.error);
      }
      setUser(result.data);
    } catch (err) {
      console.error('[Organisation] Erreur lors de la récupération du profil:', err);
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, profile?.email, profile?.fullName, profile?.firstName, profile?.lastName]);

  // Fetch au montage quand authentifié (skip si initialUser provided)
  useEffect(() => {
    if (ready && isAuthenticated && profile?.id && !hasFetched.current) {
      hasFetched.current = true;
      fetchMe();
    }

    // Si authentifié mais pas de profil, arrêter le loading
    if (ready && isAuthenticated && !profile?.id) {
      setIsLoading(false);
    }

    // Reset si déconnecté
    if (ready && !isAuthenticated) {
      setUser(null);
      setIsLoading(false);
      hasFetched.current = false;
    }
  }, [ready, isAuthenticated, profile?.id, fetchMe]);

  const refetch = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  const organisations = user?.organisations || [];
  const utilisateur = user?.utilisateur || null;

  // Utiliser l'organisation sélectionnée, ou la première par défaut
  const activeOrganisation = useMemo(() => {
    return organisations.find(org => org.organisationId === activeOrgId) || organisations[0] || null;
  }, [organisations, activeOrgId]);

  const hasOrganisation = user?.hasOrganisation || false;

  // Vérifier si l'utilisateur est propriétaire de l'organisation active
  const isOwner = activeOrganisation?.role?.code === 'owner';

  const setActiveOrganisation = useCallback((org: UserOrganisation) => {
    setActiveOrgId(org.organisationId);
    // Sauvegarder dans localStorage pour persister entre les sessions
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeOrganisationId', org.organisationId);
    }
    // Also set the cookie for Server Actions (gRPC calls)
    setActiveOrganisationId(org.organisationId).catch(console.error);
  }, []);

  // Charger l'organisation active depuis localStorage au montage
  // Et synchroniser le cookie pour les Server Actions
  useEffect(() => {
    if (typeof window !== 'undefined' && organisations.length > 0 && !activeOrgId) {
      const savedOrgId = localStorage.getItem('activeOrganisationId');
      if (savedOrgId && organisations.some(org => org.organisationId === savedOrgId)) {
        setActiveOrgId(savedOrgId);
        // Sync the cookie for Server Actions
        setActiveOrganisationId(savedOrgId).catch(console.error);
      } else if (organisations[0]) {
        // Default to first organisation and sync cookie
        setActiveOrgId(organisations[0].organisationId);
        localStorage.setItem('activeOrganisationId', organisations[0].organisationId);
        setActiveOrganisationId(organisations[0].organisationId).catch(console.error);
      }
    }
  }, [organisations, activeOrgId]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    utilisateur,
    organisations,
    activeOrganisation,
    hasOrganisation,
    isLoading: isAuthenticated ? isLoading : false,
    error,
    refetch,
    setActiveOrganisation,
    isOwner,
  }), [
    user,
    utilisateur,
    organisations,
    activeOrganisation,
    hasOrganisation,
    isAuthenticated,
    isLoading,
    error,
    refetch,
    setActiveOrganisation,
    isOwner,
  ]);

  return (
    <OrganisationContext.Provider value={contextValue}>
      {children}
    </OrganisationContext.Provider>
  );
}

export function useOrganisation() {
  const context = useContext(OrganisationContext);
  if (!context) {
    throw new Error('useOrganisation must be used within OrganisationProvider');
  }
  return context;
}
