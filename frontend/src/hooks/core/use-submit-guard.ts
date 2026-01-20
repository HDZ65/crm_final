"use client"

import { useState, useCallback, useRef } from 'react'

interface UseSubmitGuardOptions {
  /**
   * Délai minimum entre deux soumissions (en ms)
   * @default 1000
   */
  debounceMs?: number
  /**
   * Callback appelé quand une soumission est bloquée
   */
  onBlocked?: () => void
}

interface UseSubmitGuardReturn<T> {
  /**
   * Indique si une soumission est en cours
   */
  isSubmitting: boolean
  /**
   * Enveloppe une fonction de soumission pour la protéger contre le double-clic
   */
  guardedSubmit: (submitFn: () => Promise<T>) => Promise<T | undefined>
  /**
   * Réinitialise l'état du guard
   */
  reset: () => void
}

/**
 * Hook pour protéger les formulaires contre les double-clics
 *
 * @example
 * ```tsx
 * const { isSubmitting, guardedSubmit } = useSubmitGuard()
 *
 * const handleSubmit = async (data: FormData) => {
 *   await guardedSubmit(async () => {
 *     await api.post('/endpoint', data)
 *   })
 * }
 *
 * <Button disabled={isSubmitting} onClick={handleSubmit}>
 *   {isSubmitting ? 'En cours...' : 'Soumettre'}
 * </Button>
 * ```
 */
export function useSubmitGuard<T = void>(
  options: UseSubmitGuardOptions = {}
): UseSubmitGuardReturn<T> {
  const { debounceMs = 1000, onBlocked } = options
  const [isSubmitting, setIsSubmitting] = useState(false)
  const lastSubmitRef = useRef<number>(0)

  const guardedSubmit = useCallback(
    async (submitFn: () => Promise<T>): Promise<T | undefined> => {
      const now = Date.now()

      // Vérifier si une soumission est déjà en cours
      if (isSubmitting) {
        onBlocked?.()
        return undefined
      }

      // Vérifier le délai minimum entre deux soumissions
      if (now - lastSubmitRef.current < debounceMs) {
        onBlocked?.()
        return undefined
      }

      setIsSubmitting(true)
      lastSubmitRef.current = now

      try {
        const result = await submitFn()
        return result
      } finally {
        setIsSubmitting(false)
      }
    },
    [isSubmitting, debounceMs, onBlocked]
  )

  const reset = useCallback(() => {
    setIsSubmitting(false)
    lastSubmitRef.current = 0
  }, [])

  return {
    isSubmitting,
    guardedSubmit,
    reset,
  }
}

/**
 * Hook simplifié pour les cas où on veut juste un état isSubmitting
 *
 * @example
 * ```tsx
 * const [isSubmitting, withSubmitGuard] = useSimpleSubmitGuard()
 *
 * const handleClick = withSubmitGuard(async () => {
 *   await doSomething()
 * })
 * ```
 */
export function useSimpleSubmitGuard(): [
  boolean,
  <T>(fn: () => Promise<T>) => () => Promise<T | undefined>
] {
  const { isSubmitting, guardedSubmit } = useSubmitGuard<unknown>()

  const withSubmitGuard = useCallback(
    <T>(fn: () => Promise<T>): (() => Promise<T | undefined>) => {
      return async () => {
        const result = await guardedSubmit(fn as () => Promise<unknown>)
        return result as T | undefined
      }
    },
    [guardedSubmit]
  )

  return [isSubmitting, withSubmitGuard]
}
