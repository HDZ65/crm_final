"use client"

/**
 * Global Error Boundary
 * 
 * Capture les erreurs non gerees au niveau de l'application entiere.
 * C'est le dernier rempart avant le crash complet.
 */

import { useEffect } from "react"
import { AlertCircle, RefreshCw, Home } from "lucide-react"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log l'erreur vers un service de monitoring (Sentry, etc.)
    console.error("Global error caught:", error)
    
    // TODO: Envoyer a Sentry ou autre service
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error)
    // }
  }, [error])

  return (
    <html lang="fr">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-lg">
            {/* Icon */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            
            {/* Title */}
            <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
              Erreur critique
            </h1>
            
            {/* Description */}
            <p className="mb-6 text-center text-gray-600">
              Une erreur inattendue s'est produite. Nous avons ete notifies et travaillons a la resolution.
            </p>
            
            {/* Error details (dev only) */}
            {process.env.NODE_ENV === "development" && (
              <div className="mb-6 rounded-lg bg-gray-100 p-4">
                <p className="mb-2 text-sm font-medium text-gray-700">Details techniques:</p>
                <p className="break-all font-mono text-xs text-gray-600">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="mt-2 font-mono text-xs text-gray-500">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={reset}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                Reessayer
              </button>
              
              <a
                href="/"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Home className="h-4 w-4" />
                Accueil
              </a>
            </div>
            
            {/* Support link */}
            <p className="mt-6 text-center text-xs text-gray-500">
              Si le probleme persiste,{" "}
              <a href="/support" className="text-blue-600 hover:underline">
                contactez le support
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
