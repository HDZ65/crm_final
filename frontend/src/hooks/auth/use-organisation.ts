"use client";

import { useCallback, useState } from 'react';
import { useApiPost, useApi } from '../core/use-api';
import { api } from '@/lib/api';

export interface CreateOrganisationDto {
  nom: string;
  description?: string;
  siret?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  actif?: boolean;
}

export interface Organisation {
  id: string;
  nom: string;
  description?: string;
  siret?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  actif?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface UseCreateOrganisationOptions {
  onSuccess?: (organisation: Organisation) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook pour créer une organisation avec l'utilisateur comme propriétaire
 */
export function useCreateOrganisation(options?: UseCreateOrganisationOptions) {
  const { data, loading, error, execute } = useApiPost<Organisation, CreateOrganisationDto>(
    '/organisations/with-owner',
    {
      onSuccess: options?.onSuccess,
      onError: options?.onError,
    }
  );

  const createOrganisation = useCallback(
    async (nom: string, email?: string) => {
      const payload: CreateOrganisationDto = {
        nom: nom.trim(),
        actif: true,
      };

      if (email && email.includes('@')) {
        payload.email = email;
      }

      return execute(payload);
    },
    [execute]
  );

  return {
    organisation: data,
    isLoading: loading,
    error,
    createOrganisation,
  };
}

interface UseGetOrganisationOptions {
  onSuccess?: (organisation: Organisation) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook pour récupérer une organisation par son ID
 */
export function useGetOrganisation(options?: UseGetOrganisationOptions) {
  const { data, loading, error, execute, reset } = useApi<Organisation>({
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  const getOrganisation = useCallback(
    async (id: string) => {
      return execute(() => api.get(`/organisations/${id}`));
    },
    [execute]
  );

  return {
    organisation: data,
    isLoading: loading,
    error,
    getOrganisation,
    reset,
  };
}

interface UseDeleteOrganisationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook pour supprimer une organisation
 */
export function useDeleteOrganisation(options?: UseDeleteOrganisationOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteOrganisation = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        await api.delete(`/organisations/${id}`);
        options?.onSuccess?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erreur lors de la suppression');
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return {
    isLoading: loading,
    error,
    deleteOrganisation,
  };
}

export interface UpdateOrganisationDto {
  nom?: string;
  description?: string;
  siret?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  actif?: boolean;
}

interface UseUpdateOrganisationOptions {
  onSuccess?: (organisation: Organisation) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook pour mettre à jour une organisation
 */
export function useUpdateOrganisation(options?: UseUpdateOrganisationOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateOrganisation = useCallback(
    async (id: string, data: UpdateOrganisationDto): Promise<Organisation | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.put<Organisation>(`/organisations/${id}`, data);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erreur lors de la mise à jour');
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return {
    isLoading: loading,
    error,
    updateOrganisation,
  };
}

interface UseLeaveOrganisationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook pour quitter une organisation
 */
export function useLeaveOrganisation(options?: UseLeaveOrganisationOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const leaveOrganisation = useCallback(
    async (organisationId: string) => {
      setLoading(true);
      setError(null);

      try {
        await api.delete(`/membrecomptes/leave/${organisationId}`);
        options?.onSuccess?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erreur lors du départ');
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return {
    isLoading: loading,
    error,
    leaveOrganisation,
  };
}

interface UseRemoveMemberOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook pour supprimer un membre d'une organisation (réservé aux owners)
 */
export function useRemoveMember(options?: UseRemoveMemberOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const removeMember = useCallback(
    async (membreId: string, organisationId: string) => {
      setLoading(true);
      setError(null);

      try {
        await api.delete(`/membrecomptes/${membreId}/organisation/${organisationId}`);
        options?.onSuccess?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erreur lors de la suppression du membre');
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return {
    isLoading: loading,
    error,
    removeMember,
  };
}

interface UseUpdateMemberRoleOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook pour changer le rôle d'un membre (réservé aux owners)
 */
export function useUpdateMemberRole(options?: UseUpdateMemberRoleOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateMemberRole = useCallback(
    async (membreId: string, roleId: string) => {
      setLoading(true);
      setError(null);

      try {
        await api.put(`/membrecomptes/${membreId}/role`, { roleId });
        options?.onSuccess?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erreur lors du changement de rôle');
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return {
    isLoading: loading,
    error,
    updateMemberRole,
  };
}
