"use client"

import { useCallback } from "react"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"

/**
 * Hook pour la gestion centralisee des erreurs
 * Affiche un toast avec le message d'erreur et log en console
 */
export function useErrorHandler() {
  const handleError = useCallback((error: unknown, context?: string) => {
    // Extraire le message d'erreur
    let message = "Une erreur est survenue"

    if (error instanceof ApiError) {
      message = error.getUserMessage()
    } else if (error instanceof Error) {
      message = error.message
    } else if (typeof error === "string") {
      message = error
    }

    // Afficher le toast
    toast.error(message)

    // Log en console avec contexte
    if (context) {
      console.error(`[${context}]`, error)
    } else {
      console.error(error)
    }

    // Retourner l'erreur pour usage eventuel
    return error
  }, [])

  return { handleError }
}

/**
 * Fonction utilitaire pour wrapper un appel async avec gestion d'erreur
 * Usage: await withErrorHandling(() => api.get(...), "Chargement clients")
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: string,
  onError?: (error: unknown) => void
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    // Extraire le message d'erreur
    let message = "Une erreur est survenue"

    if (error instanceof ApiError) {
      message = error.getUserMessage()
    } else if (error instanceof Error) {
      message = error.message
    }

    // Afficher le toast
    toast.error(message)

    // Log en console
    if (context) {
      console.error(`[${context}]`, error)
    } else {
      console.error(error)
    }

    // Callback optionnel
    onError?.(error)

    return null
  }
}

/**
 * Messages d'erreur par defaut pour les operations courantes
 */
export const ERROR_MESSAGES = {
  LOAD: "Erreur lors du chargement des donnees",
  CREATE: "Erreur lors de la creation",
  UPDATE: "Erreur lors de la modification",
  DELETE: "Erreur lors de la suppression",
  SEND: "Erreur lors de l'envoi",
  NETWORK: "Erreur de connexion au serveur",
  UNAUTHORIZED: "Vous n'etes pas autorise a effectuer cette action",
  NOT_FOUND: "Element non trouve",
} as const
