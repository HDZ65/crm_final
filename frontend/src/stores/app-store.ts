/**
 * App Store - Etat global de l'application
 * 
 * Gere:
 * - Loading states globaux
 * - Erreurs globales
 * - Etat de connexion
 * - Notifications systeme
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// ============================================
// Types
// ============================================

export interface GlobalError {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  message: string
  code?: string
  statusCode?: number
  timestamp: number
  dismissible: boolean
  action?: {
    label: string
    onClick: () => void
  }
  // Pour les erreurs de validation
  fieldErrors?: Record<string, string[]>
}

export interface LoadingState {
  [key: string]: boolean
}

export interface AppState {
  // Loading
  isAppReady: boolean
  isInitializing: boolean
  loadingStates: LoadingState
  
  // Errors
  globalErrors: GlobalError[]
  lastError: GlobalError | null
  
  // Connection
  isOnline: boolean
  isServerReachable: boolean
  
  // Actions - Loading
  setAppReady: (ready: boolean) => void
  setInitializing: (initializing: boolean) => void
  setLoading: (key: string, loading: boolean) => void
  clearAllLoading: () => void
  
  // Actions - Errors
  addError: (error: Omit<GlobalError, 'id' | 'timestamp'>) => string
  removeError: (id: string) => void
  clearAllErrors: () => void
  clearErrorsByType: (type: GlobalError['type']) => void
  
  // Actions - Connection
  setOnline: (online: boolean) => void
  setServerReachable: (reachable: boolean) => void
  
  // Selectors
  isLoading: (key: string) => boolean
  hasErrors: () => boolean
  getErrorsByType: (type: GlobalError['type']) => GlobalError[]
}

// ============================================
// Store
// ============================================

export const useAppStore = create<AppState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      isAppReady: false,
      isInitializing: true,
      loadingStates: {},
      globalErrors: [],
      lastError: null,
      isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
      isServerReachable: true,

      // Loading actions
      setAppReady: (ready) =>
        set((state) => {
          state.isAppReady = ready
        }),

      setInitializing: (initializing) =>
        set((state) => {
          state.isInitializing = initializing
        }),

      setLoading: (key, loading) =>
        set((state) => {
          if (loading) {
            state.loadingStates[key] = true
          } else {
            delete state.loadingStates[key]
          }
        }),

      clearAllLoading: () =>
        set((state) => {
          state.loadingStates = {}
        }),

      // Error actions
      addError: (error) => {
        const id = `error-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        set((state) => {
          const newError: GlobalError = {
            ...error,
            id,
            timestamp: Date.now(),
          }
          state.globalErrors.push(newError)
          state.lastError = newError
          
          // Limite a 10 erreurs max
          if (state.globalErrors.length > 10) {
            state.globalErrors = state.globalErrors.slice(-10)
          }
        })
        return id
      },

      removeError: (id) =>
        set((state) => {
          state.globalErrors = state.globalErrors.filter((e) => e.id !== id)
          if (state.lastError?.id === id) {
            state.lastError = state.globalErrors[state.globalErrors.length - 1] || null
          }
        }),

      clearAllErrors: () =>
        set((state) => {
          state.globalErrors = []
          state.lastError = null
        }),

      clearErrorsByType: (type) =>
        set((state) => {
          state.globalErrors = state.globalErrors.filter((e) => e.type !== type)
          if (state.lastError?.type === type) {
            state.lastError = state.globalErrors[state.globalErrors.length - 1] || null
          }
        }),

      // Connection actions
      setOnline: (online) =>
        set((state) => {
          state.isOnline = online
        }),

      setServerReachable: (reachable) =>
        set((state) => {
          state.isServerReachable = reachable
        }),

      // Selectors
      isLoading: (key) => !!get().loadingStates[key],
      hasErrors: () => get().globalErrors.length > 0,
      getErrorsByType: (type) => get().globalErrors.filter((e) => e.type === type),
    })),
    { name: 'app-store' }
  )
)

// ============================================
// Helpers
// ============================================

/**
 * Cree une erreur globale a partir d'une exception
 */
export function createErrorFromException(
  error: unknown,
  defaults: Partial<Omit<GlobalError, 'id' | 'timestamp'>> = {}
): Omit<GlobalError, 'id' | 'timestamp'> {
  if (error instanceof Error) {
    return {
      type: 'error',
      title: defaults.title || 'Erreur',
      message: error.message,
      dismissible: true,
      ...defaults,
    }
  }
  
  if (typeof error === 'string') {
    return {
      type: 'error',
      title: defaults.title || 'Erreur',
      message: error,
      dismissible: true,
      ...defaults,
    }
  }
  
  return {
    type: 'error',
    title: defaults.title || 'Erreur',
    message: 'Une erreur inattendue s\'est produite',
    dismissible: true,
    ...defaults,
  }
}

/**
 * Hook pour gerer le loading avec cleanup automatique
 */
export function useLoadingState(key: string) {
  const setLoading = useAppStore((state) => state.setLoading)
  const isLoading = useAppStore((state) => state.loadingStates[key] ?? false)
  
  const startLoading = () => setLoading(key, true)
  const stopLoading = () => setLoading(key, false)
  
  const withLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
    startLoading()
    try {
      return await fn()
    } finally {
      stopLoading()
    }
  }
  
  return { isLoading, startLoading, stopLoading, withLoading }
}
