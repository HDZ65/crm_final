"use client";

import { useCallback } from 'react';
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
