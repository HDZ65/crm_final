"use client";

import { useCallback, useState, useTransition } from 'react';
import {
  createOrganisationWithOwner,
  getOrganisation,
  updateOrganisation,
  deleteOrganisation,
  leaveOrganisation,
  removeMember,
  updateMemberRole,
  type OrganisationResponse,
  type CompteWithOwnerResponse,
} from '@/actions/organisations';

export type { OrganisationResponse, CompteWithOwnerResponse };

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
  onSuccess?: (result: CompteWithOwnerResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook pour creer une organisation avec l'utilisateur comme proprietaire
 * Utilise gRPC via Server Action
 */
export function useCreateOrganisation(options?: UseCreateOrganisationOptions) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<CompteWithOwnerResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const createOrganisation = useCallback(
    async (
      nom: string,
      keycloakUser: {
        sub: string;
        email: string;
        givenName?: string;
        familyName?: string;
        preferredUsername?: string;
        name?: string;
      }
    ) => {
      return new Promise<CompteWithOwnerResponse | null>((resolve) => {
        startTransition(async () => {
          setError(null);
          try {
            const result = await createOrganisationWithOwner(nom, keycloakUser);
            if (result.error) {
              const err = new Error(result.error);
              setError(err);
              options?.onError?.(err);
              resolve(null);
            } else if (result.data) {
              setData(result.data);
              options?.onSuccess?.(result.data);
              resolve(result.data);
            } else {
              resolve(null);
            }
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Erreur inconnue');
            setError(error);
            options?.onError?.(error);
            resolve(null);
          }
        });
      });
    },
    [options]
  );

  return {
    organisation: data?.compte || null,
    isLoading: isPending,
    error,
    createOrganisation,
  };
}

interface UseGetOrganisationOptions {
  onSuccess?: (organisation: OrganisationResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook pour recuperer une organisation par son ID
 */
export function useGetOrganisation(options?: UseGetOrganisationOptions) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<OrganisationResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const get = useCallback(
    async (id: string) => {
      return new Promise<OrganisationResponse | null>((resolve) => {
        startTransition(async () => {
          setError(null);
          try {
            const result = await getOrganisation(id);
            if (result.error) {
              const err = new Error(result.error);
              setError(err);
              options?.onError?.(err);
              resolve(null);
            } else if (result.data) {
              setData(result.data);
              options?.onSuccess?.(result.data);
              resolve(result.data);
            } else {
              resolve(null);
            }
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Erreur inconnue');
            setError(error);
            options?.onError?.(error);
            resolve(null);
          }
        });
      });
    },
    [options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return {
    organisation: data,
    isLoading: isPending,
    error,
    getOrganisation: get,
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
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<Error | null>(null);

  const del = useCallback(
    async (id: string) => {
      return new Promise<boolean>((resolve) => {
        startTransition(async () => {
          setError(null);
          try {
            const result = await deleteOrganisation(id);
            if (result.error) {
              const err = new Error(result.error);
              setError(err);
              options?.onError?.(err);
              resolve(false);
            } else {
              options?.onSuccess?.();
              resolve(true);
            }
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Erreur inconnue');
            setError(error);
            options?.onError?.(error);
            resolve(false);
          }
        });
      });
    },
    [options]
  );

  return {
    isLoading: isPending,
    error,
    deleteOrganisation: del,
  };
}

interface UseUpdateOrganisationOptions {
  onSuccess?: (organisation: OrganisationResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook pour mettre a jour une organisation
 */
export function useUpdateOrganisation(options?: UseUpdateOrganisationOptions) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<Error | null>(null);

  const update = useCallback(
    async (
      id: string,
      data: {
        nom?: string;
        description?: string;
        siret?: string;
        adresse?: string;
        telephone?: string;
        email?: string;
        actif?: boolean;
      }
    ): Promise<OrganisationResponse | null> => {
      return new Promise((resolve) => {
        startTransition(async () => {
          setError(null);
          try {
            const result = await updateOrganisation(id, data);
            if (result.error) {
              const err = new Error(result.error);
              setError(err);
              options?.onError?.(err);
              resolve(null);
            } else if (result.data) {
              options?.onSuccess?.(result.data);
              resolve(result.data);
            } else {
              resolve(null);
            }
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Erreur inconnue');
            setError(error);
            options?.onError?.(error);
            resolve(null);
          }
        });
      });
    },
    [options]
  );

  return {
    isLoading: isPending,
    error,
    updateOrganisation: update,
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
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<Error | null>(null);

  const leave = useCallback(
    async (organisationId: string, utilisateurId: string) => {
      return new Promise<boolean>((resolve) => {
        startTransition(async () => {
          setError(null);
          try {
            const result = await leaveOrganisation(organisationId, utilisateurId);
            if (result.error) {
              const err = new Error(result.error);
              setError(err);
              options?.onError?.(err);
              resolve(false);
            } else {
              options?.onSuccess?.();
              resolve(true);
            }
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Erreur inconnue');
            setError(error);
            options?.onError?.(error);
            resolve(false);
          }
        });
      });
    },
    [options]
  );

  return {
    isLoading: isPending,
    error,
    leaveOrganisation: leave,
  };
}

interface UseRemoveMemberOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook pour supprimer un membre d'une organisation (reserve aux owners)
 */
export function useRemoveMember(options?: UseRemoveMemberOptions) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<Error | null>(null);

  const remove = useCallback(
    async (membreId: string) => {
      return new Promise<boolean>((resolve) => {
        startTransition(async () => {
          setError(null);
          try {
            const result = await removeMember(membreId);
            if (result.error) {
              const err = new Error(result.error);
              setError(err);
              options?.onError?.(err);
              resolve(false);
            } else {
              options?.onSuccess?.();
              resolve(true);
            }
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Erreur inconnue');
            setError(error);
            options?.onError?.(error);
            resolve(false);
          }
        });
      });
    },
    [options]
  );

  return {
    isLoading: isPending,
    error,
    removeMember: remove,
  };
}

interface UseUpdateMemberRoleOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook pour changer le role d'un membre (reserve aux owners)
 */
export function useUpdateMemberRole(options?: UseUpdateMemberRoleOptions) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<Error | null>(null);

  const update = useCallback(
    async (membreId: string, roleId: string) => {
      return new Promise<boolean>((resolve) => {
        startTransition(async () => {
          setError(null);
          try {
            const result = await updateMemberRole(membreId, roleId);
            if (result.error) {
              const err = new Error(result.error);
              setError(err);
              options?.onError?.(err);
              resolve(false);
            } else {
              options?.onSuccess?.();
              resolve(true);
            }
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Erreur inconnue');
            setError(error);
            options?.onError?.(error);
            resolve(false);
          }
        });
      });
    },
    [options]
  );

  return {
    isLoading: isPending,
    error,
    updateMemberRole: update,
  };
}
