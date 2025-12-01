"use client";

import { useCallback, useState, useRef } from 'react';
import { useApi } from '../core/use-api';
import { api } from '@/lib/api';

// Interface pour les membres de l'organisation
export interface OrganisationMember {
  id: string;
  organisationId: string;
  utilisateurId: string;
  roleId: string;
  etat: string;
  dateInvitation: string;
  dateActivation: string | null;
  createdAt: string;
  updatedAt: string;
  utilisateur: {
    id: string;
    email: string;
    nom: string;
    prenom: string;
  };
  role?: {
    id: string;
    nom: string;
  };
}

export interface Invitation {
  id: string;
  organisationNom: string;
  email: string;
  roleNom: string;
  token: string;
  inviteUrl: string;
  expireAt: string;
  etat: string;
}

export interface InvitationValidation {
  valid: boolean;
  organisationNom: string;
  email: string;
  roleNom: string;
  expireAt: string;
}

export interface InvitationAcceptResponse {
  success: boolean;
  organisation: { id: string; nom: string };
  utilisateur: { id: string; email: string };
  membre: { id: string; roleId: string; etat: string };
}

interface CreateInvitationDto {
  emailInvite: string;
  roleId?: string;
}

/**
 * Hook pour créer une invitation
 */
export function useCreateInvitation() {
  const [data, setData] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createInvitation = useCallback(
    async (organisationId: string, email: string) => {
      setLoading(true);
      setError(null);

      const url = `/invitations/organisation/${organisationId}`;
      const body = { emailInvite: email };

      try {
        const result = await api.post(url, body);
        setData(result);
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    invitation: data,
    isLoading: loading,
    error,
    createInvitation,
  };
}

/**
 * Hook pour lister les invitations d'une organisation
 */
export function useOrganisationInvitations() {
  const { data, loading, error, execute, reset } = useApi<Invitation[]>();

  const fetchInvitations = useCallback(
    async (organisationId: string) => {
      return execute(() => api.get(`/invitations/organisation/${organisationId}`));
    },
    [execute]
  );

  return {
    invitations: data || [],
    isLoading: loading,
    error,
    fetchInvitations,
    reset,
  };
}

/**
 * Hook pour annuler une invitation
 */
export function useCancelInvitation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cancelInvitation = useCallback(
    async (invitationId: string) => {
      setLoading(true);
      setError(null);

      const url = `/invitations/${invitationId}`;

      try {
        const result = await api.delete(url);
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    isLoading: loading,
    error,
    cancelInvitation,
  };
}

/**
 * Hook pour valider une invitation (vérifier si le token est valide)
 */
export function useValidateInvitation() {
  const [data, setData] = useState<InvitationValidation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const validateInvitation = useCallback(
    async (token: string) => {
      setLoading(true);
      setError(null);

      const url = `/invitations/validate/${token}`;

      try {
        const result = await api.get(url);
        setData(result);
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    validation: data,
    isLoading: loading,
    error,
    validateInvitation,
  };
}

/**
 * Hook pour accepter une invitation
 */
export function useAcceptInvitation() {
  const [data, setData] = useState<InvitationAcceptResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const acceptInvitation = useCallback(
    async (token: string) => {
      setLoading(true);
      setError(null);

      const url = `/invitations/accept/${token}`;

      try {
        const result = await api.post(url, {});
        setData(result);
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    result: data,
    isLoading: loading,
    error,
    acceptInvitation,
  };
}

/**
 * Hook pour récupérer les membres d'une organisation
 */
export function useOrganisationMembers() {
  const { data, loading, error, execute } = useApi<OrganisationMember[]>();

  const fetchMembers = useCallback(
    async (organisationId: string) => {
      return execute(() => api.get(`/membrecomptes/organisation/${organisationId}`));
    },
    [execute]
  );

  return {
    members: data || [],
    isLoading: loading,
    error,
    fetchMembers,
  };
}

/**
 * Interface pour la réponse du rôle utilisateur
 */
export interface MyRoleResponse {
  membre: {
    id: string;
    organisationId: string;
    utilisateurId: string;
    roleId: string;
    etat: string;
    dateInvitation: string | null;
    dateActivation: string | null;
    createdAt: string;
    updatedAt: string;
  };
  role: {
    id: string;
    code: string;
    nom: string;
  };
}

/**
 * Hook pour récupérer le rôle de l'utilisateur dans une organisation
 */
export function useMyRole() {
  const [data, setData] = useState<MyRoleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetchingRef = useRef<string | null>(null);

  const fetchMyRole = useCallback(
    async (organisationId: string) => {
      // Éviter les appels dupliqués pour la même organisation
      if (fetchingRef.current === organisationId) {
        return data;
      }

      fetchingRef.current = organisationId;
      setLoading(true);
      setError(null);

      try {
        const result = await api.get(`/membrecomptes/my-role/${organisationId}`);
        setData(result);
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
        fetchingRef.current = null;
      }
    },
    [data]
  );

  return {
    myRole: data,
    roleCode: data?.role?.code || null,
    isLoading: loading,
    error,
    fetchMyRole,
  };
}
