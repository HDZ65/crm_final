"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"

function MicrosoftCallbackContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (window.opener) {
      if (code) {
        window.opener.postMessage(
          { type: "oauth-success", provider: "microsoft", code },
          window.location.origin
        )
      } else if (error) {
        window.opener.postMessage(
          { type: "oauth-error", provider: "microsoft", error: searchParams.get("error_description") || error },
          window.location.origin
        )
      }
      window.close()
    }
  }, [searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Authentification en cours...</p>
      </div>
    </div>
  )
}

export default function MicrosoftCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    }>
      <MicrosoftCallbackContent />
    </Suspense>
  )
}
