"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"

function Microsoft365CallbackContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (window.opener) {
      if (code) {
        window.opener.postMessage(
          { type: "oauth-success", provider: "microsoft365", code },
          window.location.origin
        )
      } else if (error) {
        window.opener.postMessage(
          { type: "oauth-error", provider: "microsoft365", error: searchParams.get("error_description") || error },
          window.location.origin
        )
      }
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

export default function Microsoft365CallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    }>
      <Microsoft365CallbackContent />
    </Suspense>
  )
}
