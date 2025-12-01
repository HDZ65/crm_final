"use client";

import { useState, useCallback, useRef } from 'react';
import { api, ApiError } from '@/lib/api';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

/**
 * Hook for making authenticated API requests with automatic loading and error states
 *
 * @example
 * ```tsx
 * const { data, loading, error, execute } = useApi<Client[]>();
 *
 * const fetchClients = async () => {
 *   await execute(() => api.get('/clientbases'));
 * };
 * ```
 */
export function useApi<T = unknown>(options?: UseApiOptions<T>) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  // Use refs to avoid re-creating execute on every render
  const onSuccessRef = useRef(options?.onSuccess);
  const onErrorRef = useRef(options?.onError);
  onSuccessRef.current = options?.onSuccess;
  onErrorRef.current = options?.onError;

  const execute = useCallback(
    async (apiCall: () => Promise<T>) => {
      // Keep existing data while loading to avoid flicker
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const result = await apiCall();
        setState({ data: result, loading: false, error: null });

        if (onSuccessRef.current) {
          onSuccessRef.current(result);
        }

        return result;
      } catch (err) {
        const apiError = err instanceof ApiError
          ? err
          : new ApiError('An unexpected error occurred', 0);

        setState({ data: null, loading: false, error: apiError });

        if (onErrorRef.current) {
          onErrorRef.current(apiError);
        }

        throw apiError;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook for GET requests with automatic execution on mount
 *
 * @example
 * ```tsx
 * const { data: clients, loading, error, refetch } = useApiGet<Client[]>('/clientbases');
 * ```
 */
export function useApiGet<T = unknown>(
  endpoint: string,
  options?: UseApiOptions<T> & { skip?: boolean }
) {
  const { execute, ...state } = useApi<T>(options);
  const [mounted, setMounted] = useState(false);

  const fetch = useCallback(() => {
    return execute(() => api.get(endpoint));
  }, [endpoint, execute]);

  // Auto-fetch on mount unless skip is true
  useState(() => {
    if (!options?.skip && !mounted) {
      setMounted(true);
      fetch();
    }
  });

  return {
    ...state,
    refetch: fetch,
  };
}

/**
 * Hook for POST requests
 *
 * @example
 * ```tsx
 * const { loading, error, execute: createClient } = useApiPost<Client>('/clientbases');
 *
 * const handleSubmit = async (data: CreateClientDto) => {
 *   await createClient(data);
 * };
 * ```
 */
export function useApiPost<T = unknown, D = unknown>(
  endpoint: string,
  options?: UseApiOptions<T>
) {
  const { execute, ...state } = useApi<T>(options);

  const post = useCallback(
    (data: D) => {
      return execute(() => api.post(endpoint, data));
    },
    [endpoint, execute]
  );

  return {
    ...state,
    execute: post,
  };
}

/**
 * Hook for PUT requests
 *
 * @example
 * ```tsx
 * const { loading, error, execute: updateClient } = useApiPut<Client>('/clientbases');
 *
 * const handleUpdate = async (id: string, data: UpdateClientDto) => {
 *   await updateClient(data, id);
 * };
 * ```
 */
export function useApiPut<T = unknown, D = unknown>(
  baseEndpoint: string,
  options?: UseApiOptions<T>
) {
  const { execute, ...state } = useApi<T>(options);

  const put = useCallback(
    (data: D, id?: string) => {
      const endpoint = id ? `${baseEndpoint}/${id}` : baseEndpoint;
      return execute(() => api.put(endpoint, data));
    },
    [baseEndpoint, execute]
  );

  return {
    ...state,
    execute: put,
  };
}

/**
 * Hook for PATCH requests
 *
 * @example
 * ```tsx
 * const { loading, error, execute: patchClient } = useApiPatch<Client>('/clientbases');
 *
 * const handlePartialUpdate = async (id: string, data: Partial<Client>) => {
 *   await patchClient(data, id);
 * };
 * ```
 */
export function useApiPatch<T = unknown, D = unknown>(
  baseEndpoint: string,
  options?: UseApiOptions<T>
) {
  const { execute, ...state } = useApi<T>(options);

  const patch = useCallback(
    (data: D, id?: string) => {
      const endpoint = id ? `${baseEndpoint}/${id}` : baseEndpoint;
      return execute(() => api.patch(endpoint, data));
    },
    [baseEndpoint, execute]
  );

  return {
    ...state,
    execute: patch,
  };
}

/**
 * Hook for DELETE requests
 *
 * @example
 * ```tsx
 * const { loading, error, execute: deleteClient } = useApiDelete('/clientbases');
 *
 * const handleDelete = async (id: string) => {
 *   await deleteClient(id);
 * };
 * ```
 */
export function useApiDelete<T = unknown>(
  baseEndpoint: string,
  options?: UseApiOptions<T>
) {
  const { execute, ...state } = useApi<T>(options);

  const del = useCallback(
    (id: string) => {
      return execute(() => api.delete(`${baseEndpoint}/${id}`));
    },
    [baseEndpoint, execute]
  );

  return {
    ...state,
    execute: del,
  };
}
