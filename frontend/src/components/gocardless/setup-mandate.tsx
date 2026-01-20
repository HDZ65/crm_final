"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CreditCard, ExternalLink, AlertCircle, CheckCircle } from "lucide-react"

// Type pour le Drop-in GoCardless (si le package est installé)
declare global {
  interface Window {
    GoCardlessDropin?: {
      create: (options: {
        billingRequestFlowID: string
        environment: "live" | "sandbox"
        onSuccess?: (billingRequest: unknown, billingRequestFlow: unknown) => void
        onExit?: (error: unknown, metadata: unknown) => void
      }) => {
        open: () => void
        exit: () => void
      }
    }
  }
}

type SetupMethod = "redirect" | "dropin"

interface GocardlessSetupMandateProps {
  clientId: string
  onSetupMandate: () => Promise<string | null> // Retourne l'URL d'autorisation
  onCreateBillingRequestFlow?: () => Promise<string | null> // Pour le Drop-in
  onSuccess?: () => void
  onError?: (error: Error) => void
  loading?: boolean
  environment?: "live" | "sandbox"
  prefillData?: {
    email?: string
    givenName?: string
    familyName?: string
    companyName?: string
  }
}

export function GocardlessSetupMandate({
  onSetupMandate,
  onCreateBillingRequestFlow,
  onSuccess,
  onError,
  loading: externalLoading,
  environment = "sandbox",
}: GocardlessSetupMandateProps) {
  const [method, setMethod] = useState<SetupMethod>("redirect")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dropinLoaded, setDropinLoaded] = useState(false)

  // Charger le script GoCardless Drop-in
  useEffect(() => {
    if (typeof window !== "undefined" && !window.GoCardlessDropin) {
      const script = document.createElement("script")
      script.src = "https://pay.gocardless.com/billing/static/dropin/v2/initialise.js"
      script.async = true
      script.onload = () => setDropinLoaded(true)
      document.head.appendChild(script)
    } else if (window.GoCardlessDropin) {
      setDropinLoaded(true)
    }
  }, [])

  const handleRedirect = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const authorisationUrl = await onSetupMandate()
      if (authorisationUrl) {
        // Rediriger vers GoCardless
        window.location.href = authorisationUrl
      } else {
        setError("Impossible d'obtenir l'URL d'autorisation")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors du setup"
      setError(message)
      onError?.(err instanceof Error ? err : new Error(message))
    } finally {
      setLoading(false)
    }
  }, [onSetupMandate, onError])

  const handleDropin = useCallback(async () => {
    if (!onCreateBillingRequestFlow) {
      setError("Le Drop-in n'est pas configuré")
      return
    }

    if (!window.GoCardlessDropin) {
      setError("Le script GoCardless n'est pas chargé")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const billingRequestFlowId = await onCreateBillingRequestFlow()

      if (!billingRequestFlowId) {
        setError("Impossible de créer le flow de facturation")
        setLoading(false)
        return
      }

      const handler = window.GoCardlessDropin.create({
        billingRequestFlowID: billingRequestFlowId,
        environment,
        onSuccess: () => {
          setLoading(false)
          setDialogOpen(false)
          onSuccess?.()
        },
        onExit: (err) => {
          setLoading(false)
          if (err) {
            const message = "Configuration annulée ou erreur"
            setError(message)
            onError?.(new Error(message))
          }
        },
      })

      handler.open()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors du setup"
      setError(message)
      onError?.(err instanceof Error ? err : new Error(message))
      setLoading(false)
    }
  }, [onCreateBillingRequestFlow, environment, onSuccess, onError])

  const handleSubmit = useCallback(() => {
    if (method === "redirect") {
      handleRedirect()
    } else {
      handleDropin()
    }
  }, [method, handleRedirect, handleDropin])

  const isLoading = loading || externalLoading

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Configurer le prélèvement SEPA
          </CardTitle>
          <CardDescription>
            Autorisez les prélèvements automatiques sur votre compte bancaire pour faciliter vos
            paiements récurrents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Label>Méthode de configuration</Label>
            <RadioGroup
              value={method}
              onValueChange={(v) => setMethod(v as SetupMethod)}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <div>
                <RadioGroupItem
                  value="redirect"
                  id="redirect"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="redirect"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <ExternalLink className="mb-3 h-6 w-6" />
                  <span className="font-medium">Page sécurisée</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Redirection vers GoCardless
                  </span>
                </Label>
              </div>

              <div>
                <RadioGroupItem
                  value="dropin"
                  id="dropin"
                  className="peer sr-only"
                  disabled={!dropinLoaded || !onCreateBillingRequestFlow}
                />
                <Label
                  htmlFor="dropin"
                  className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer ${
                    !dropinLoaded || !onCreateBillingRequestFlow ? "opacity-50" : ""
                  }`}
                >
                  <CreditCard className="mb-3 h-6 w-6" />
                  <span className="font-medium">Modal intégrée</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    {dropinLoaded ? "Sans quitter cette page" : "Chargement..."}
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Ce qui va se passer :</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Vous saisirez vos coordonnées bancaires (IBAN)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Vous autoriserez les prélèvements automatiques
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Le mandat sera actif sous 3-5 jours ouvrés
              </li>
            </ul>
          </div>

          <Button
            onClick={() => setDialogOpen(true)}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Configuration en cours...' : "Configurer le prélèvement"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            En continuant, vous acceptez les conditions de prélèvement SEPA.
            <br />
            Vos données bancaires sont sécurisées par GoCardless.
          </p>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la configuration</DialogTitle>
            <DialogDescription>
              {method === "redirect"
                ? "Vous allez être redirigé vers une page sécurisée GoCardless pour saisir vos coordonnées bancaires."
                : "Une fenêtre GoCardless va s'ouvrir pour saisir vos coordonnées bancaires."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              Continuer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
