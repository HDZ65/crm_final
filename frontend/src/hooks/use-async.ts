/**
 * useAsync - Hook pour gerer les operations asynchrones
 * 
 * Gere automatiquement:
 * - Loading state
 * - Error handling
 * - Success callbacks
 * - Retry logic
 */

import { useState, useCallback, useRef } from "react"
import { toast } from "sonner"
import { useAppStore, createErrorFromException } from "@/stores/app-store"
import { translateBackendError } from "@/lib/errors/messages"

// ============================================
// Types
// ============================================

export interface AsyncState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  isSuccess: boolean
  isError: boolean
}

export interface UseAsyncOptions<T> {
  /** Cle unique pour le loading state global */
  loadingKey?: string
  /** Callback en cas de succes */
  onSuccess?: (data: T) => void
  /** Callback en cas d'erreur */
  onError?: (error: Error) => void
  /** Afficher un toast en cas de succes */
  successMessage?: string
  /** Afficher un toast en cas d'erreur */
  showErrorToast?: boolean
  /** Ajouter l'erreur au store global */
  addGlobalError?: boolean
  /** Nombre de retries automatiques */
  retries?: number
  /** Delai entre les retries (ms) */
  retryDelay?: number
}

export interface UseAsyncReturn<T, TArgs extends unknown[]> extends AsyncState<T> {
  /** Execute l'operation */
  execute: (...args: TArgs) => Promise<T | null>
  /** Reset l'etat */
  reset: () => void
  /** Retry la derniere operation */
  retry: () => Promise<T | null>
}

// ============================================
// Hook
// ============================================

export function useAsync<T, TArgs extends unknown[] = []>(
  asyncFn: (...args: TArgs) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, TArgs> {
  const {
    loadingKey,
    onSuccess,
    onError,
    successMessage,
    showErrorToast = true,
    addGlobalError = false,
    retries = 0,
    retryDelay = 1000,
  } = options

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isSuccess: false,
    isError: false,
  })

  const setGlobalLoading = useAppStore((state) => state.setLoading)
  const addError = useAppStore((state) => state.addError)
  
  // Stocker les derniers args pour retry
  const lastArgsRef = useRef<TArgs | null>(null)
  const retriesLeftRef = useRef(retries)

  const execute = useCallback(
    async (...args: TArgs): Promise<T | null> => {
      lastArgsRef.current = args
      retriesLeftRef.current = retries

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        isError: false,
      }))

      if (loadingKey) {
        setGlobalLoading(loadingKey, true)
      }

      const attemptExecution = async (): Promise<T | null> => {
        try {
          const data = await asyncFn(...args)
          
          setState({
            data,
            isLoading: false,
            error: null,
            isSuccess: true,
            isError: false,
          })

          if (successMessage) {
            toast.success(successMessage)
          }

          onSuccess?.(data)
          return data
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err))
          const translatedMessage = translateBackendError(error.message)

          // Retry si possible
          if (retriesLeftRef.current > 0) {
            retriesLeftRef.current--
            await new Promise((resolve) => setTimeout(resolve, retryDelay))
            return attemptExecution()
          }

          setState({
            data: null,
            isLoading: false,
            error: translatedMessage,
            isSuccess: false,
            isError: true,
          })

          if (showErrorToast) {
            toast.error(translatedMessage)
          }

          if (addGlobalError) {
            addError(createErrorFromException(error, { title: "Erreur" }))
          }

          onError?.(error)
          return null
        } finally {
          if (loadingKey) {
            setGlobalLoading(loadingKey, false)
          }
        }
      }

      return attemptExecution()
    },
    [asyncFn, loadingKey, onSuccess, onError, successMessage, showErrorToast, addGlobalError, retries, retryDelay, setGlobalLoading, addError]
  )

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null,
      isSuccess: false,
      isError: false,
    })
  }, [])

  const retry = useCallback(async (): Promise<T | null> => {
    if (lastArgsRef.current) {
      return execute(...lastArgsRef.current)
    }
    return null
  }, [execute])

  return {
    ...state,
    execute,
    reset,
    retry,
  }
}

// ============================================
// Variantes specialisees
// ============================================

/**
 * Hook pour les mutations (create, update, delete)
 */
export function useMutation<T, TArgs extends unknown[] = []>(
  mutationFn: (...args: TArgs) => Promise<T>,
  options: UseAsyncOptions<T> & {
    invalidateKeys?: string[]
  } = {}
) {
  return useAsync(mutationFn, {
    ...options,
    showErrorToast: options.showErrorToast ?? true,
  })
}

/**
 * Hook pour les queries (read)
 */
export function useQuery<T>(
  queryFn: () => Promise<T>,
  options: UseAsyncOptions<T> & {
    enabled?: boolean
    refetchInterval?: number
  } = {}
) {
  const { enabled = true, refetchInterval, ...asyncOptions } = options
  const result = useAsync(queryFn, {
    ...asyncOptions,
    showErrorToast: asyncOptions.showErrorToast ?? false,
  })

  // Auto-fetch au mount si enabled
  // Note: Vous pouvez ajouter useEffect ici si vous voulez un auto-fetch

  return result
}
