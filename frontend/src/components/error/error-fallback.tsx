"use client"

import { AlertCircle, RefreshCw, Home, ArrowLeft, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getSuggestedAction } from "@/lib/error-messages"

// ============================================
// Types
// ============================================

export interface ErrorFallbackProps {
  error: Error & { digest?: string; statusCode?: number }
  reset?: () => void
  title?: string
  description?: string
  showDetails?: boolean
  showHomeButton?: boolean
  showBackButton?: boolean
  showReportButton?: boolean
  className?: string
}

// ============================================
// Component
// ============================================

export function ErrorFallback({
  error,
  reset,
  title = "Une erreur s'est produite",
  description,
  showDetails = process.env.NODE_ENV === "development",
  showHomeButton = true,
  showBackButton = true,
  showReportButton = false,
  className = "",
}: ErrorFallbackProps) {
  const statusCode = error.statusCode
  const suggestedAction = statusCode ? getSuggestedAction(statusCode) : undefined
  
  const handleBack = () => {
    if (typeof window !== "undefined") {
      window.history.back()
    }
  }
  
  const handleHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  }
  
  const handleReport = () => {
    // TODO: Integrer avec un service de reporting (Sentry, etc.)
    console.error("Error reported:", error)
    alert("Erreur signalee. Merci!")
  }

  return (
    <div className={`flex min-h-[400px] items-center justify-center p-4 ${className}`}>
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">
            {statusCode && <span className="text-muted-foreground mr-2">{statusCode}</span>}
            {title}
          </CardTitle>
          <CardDescription className="text-base">
            {description || error.message || "Quelque chose s'est mal passe."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {suggestedAction && (
            <p className="text-center text-sm text-muted-foreground">
              Suggestion: {suggestedAction}
            </p>
          )}
          
          {showDetails && (
            <details className="rounded-lg border bg-muted/50 p-3">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                Details techniques
              </summary>
              <div className="mt-2 space-y-2">
                <p className="font-mono text-xs break-all">
                  <strong>Message:</strong> {error.message}
                </p>
                {error.digest && (
                  <p className="font-mono text-xs">
                    <strong>Digest:</strong> {error.digest}
                  </p>
                )}
                {error.stack && (
                  <pre className="mt-2 max-h-32 overflow-auto rounded bg-black/5 p-2 text-xs">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-wrap justify-center gap-2">
          {reset && (
            <Button onClick={reset} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reessayer
            </Button>
          )}
          
          {showBackButton && (
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          )}
          
          {showHomeButton && (
            <Button onClick={handleHome} variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Accueil
            </Button>
          )}
          
          {showReportButton && (
            <Button onClick={handleReport} variant="ghost" size="sm">
              <Bug className="mr-2 h-4 w-4" />
              Signaler
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

// ============================================
// Variantes pre-configurees
// ============================================

export function NotFoundError({ reset }: { reset?: () => void }) {
  const error = new Error("La page demandee n'existe pas.") as Error & { statusCode: number }
  error.statusCode = 404
  
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Page non trouvee"
      description="La page que vous recherchez n'existe pas ou a ete deplacee."
      showDetails={false}
    />
  )
}

export function UnauthorizedError({ reset }: { reset?: () => void }) {
  const error = new Error("Vous devez etre connecte pour acceder a cette page.") as Error & { statusCode: number }
  error.statusCode = 401
  
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Non autorise"
      description="Votre session a expire ou vous n'etes pas connecte."
      showDetails={false}
      showBackButton={false}
    />
  )
}

export function ForbiddenError({ reset }: { reset?: () => void }) {
  const error = new Error("Vous n'avez pas les droits necessaires.") as Error & { statusCode: number }
  error.statusCode = 403
  
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Acces refuse"
      description="Vous n'avez pas les permissions necessaires pour acceder a cette ressource."
      showDetails={false}
    />
  )
}

export function ServerError({ reset }: { reset?: () => void }) {
  const error = new Error("Une erreur serveur s'est produite.") as Error & { statusCode: number }
  error.statusCode = 500
  
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Erreur serveur"
      description="Une erreur technique s'est produite. Nos equipes ont ete notifiees."
      showReportButton
    />
  )
}

export function NetworkError({ reset }: { reset?: () => void }) {
  const error = new Error("Impossible de se connecter au serveur.")
  
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Probleme de connexion"
      description="Verifiez votre connexion internet et reessayez."
      showDetails={false}
    />
  )
}
