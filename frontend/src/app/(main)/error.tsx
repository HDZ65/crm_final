"use client"

/**
 * Route-level Error Boundary
 * 
 * Capture les erreurs dans les routes du groupe (main).
 * Permet de recuperer sans recharger toute l'application.
 */

import { useEffect } from "react"
import { ErrorFallback } from "@/components/error/error-fallback"

interface ErrorProps {
  error: Error & { digest?: string; statusCode?: number }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log l'erreur
    console.error("Route error caught:", error)
    
    // TODO: Envoyer a un service de monitoring
  }, [error])

  // Determiner le titre selon le type d'erreur
  const getErrorTitle = () => {
    if (error.message?.includes("fetch")) {
      return "Erreur de connexion"
    }
    if (error.message?.includes("unauthorized") || error.message?.includes("401")) {
      return "Session expiree"
    }
    if (error.message?.includes("forbidden") || error.message?.includes("403")) {
      return "Acces refuse"
    }
    if (error.message?.includes("not found") || error.message?.includes("404")) {
      return "Page non trouvee"
    }
    return "Une erreur s'est produite"
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <ErrorFallback
        error={error}
        reset={reset}
        title={getErrorTitle()}
        showDetails={process.env.NODE_ENV === "development"}
        showHomeButton
        showBackButton
        showReportButton={process.env.NODE_ENV === "production"}
      />
    </div>
  )
}
