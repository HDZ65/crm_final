"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

/**
 * Page de callback OAuth2 pour Google
 * Cette page est chargée dans la popup OAuth et renvoie le code au parent
 */
export default function GoogleCallbackPage() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (window.opener) {
      if (code) {
        // Succès - envoyer le code au parent
        window.opener.postMessage(
          {
            type: "oauth-success",
            provider: "google",
            code,
          },
          window.location.origin
        )
      } else if (error) {
        // Erreur - envoyer l'erreur au parent
        window.opener.postMessage(
          {
            type: "oauth-error",
            provider: "google",
            error: searchParams.get("error_description") || error,
          },
          window.location.origin
        )
      }

      // Fermer la popup
      window.close()
    }
  }, [searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Authentification en cours...</p>
      </div>
    </div>
  )
}
