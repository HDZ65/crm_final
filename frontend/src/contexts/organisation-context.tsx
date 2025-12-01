"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/auth';
import { api } from '@/lib/api';

export interface UserOrganisation {
  id: string;
  nom: string;
  roleId: string;
  etat: string;
}

export interface AuthMeResponse {
  id: string;
  keycloakId: string;
  email: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  actif: boolean;
  organisations: UserOrganisation[];
  hasOrganisation: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OrganisationContextType {
  user: AuthMeResponse | null;
  organisations: UserOrganisation[];
  activeOrganisation: UserOrganisation | null;
  hasOrganisation: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  setActiveOrganisation: (org: UserOrganisation) => void;
}

const OrganisationContext = createContext<OrganisationContextType | null>(null);

export function OrganisationProvider({ children }: { children: React.ReactNode }) {
  const { ready, isAuthenticated, token } = useAuth();
  const [user, setUser] = useState<AuthMeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchMe = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<AuthMeResponse>('/auth/me');
      setUser(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Fetch au montage quand authentifié
  useEffect(() => {
    if (ready && isAuthenticated && token && !hasFetched.current) {
      hasFetched.current = true;
      fetchMe();
    }

    // Si authentifié mais pas de token, arrêter le loading
    if (ready && isAuthenticated && !token) {
      setIsLoading(false);
    }

    // Reset si déconnecté
    if (ready && !isAuthenticated) {
      setUser(null);
      setIsLoading(false);
      hasFetched.current = false;
    }
  }, [ready, isAuthenticated, token, fetchMe]);

  const refetch = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  const organisations = user?.organisations || [];
  // Utiliser l'organisation sélectionnée, ou la première par défaut
  const activeOrganisation = organisations.find(org => org.id === activeOrgId) || organisations[0] || null;
  const hasOrganisation = user?.hasOrganisation || false;

  const setActiveOrganisation = useCallback((org: UserOrganisation) => {
    setActiveOrgId(org.id);
    // Sauvegarder dans localStorage pour persister entre les sessions
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeOrganisationId', org.id);
    }
  }, []);

  // Charger l'organisation active depuis localStorage au montage
  useEffect(() => {
    if (typeof window !== 'undefined' && organisations.length > 0 && !activeOrgId) {
      const savedOrgId = localStorage.getItem('activeOrganisationId');
      if (savedOrgId && organisations.some(org => org.id === savedOrgId)) {
        setActiveOrgId(savedOrgId);
      }
    }
  }, [organisations, activeOrgId]);

  return (
    <OrganisationContext.Provider
      value={{
        user,
        organisations,
        activeOrganisation,
        hasOrganisation,
        isLoading: isAuthenticated ? isLoading : false,
        error,
        refetch,
        setActiveOrganisation,
      }}
    >
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
