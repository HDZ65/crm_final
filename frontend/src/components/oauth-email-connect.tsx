"use client"

import * as React from "react"
import { SiGmail } from "react-icons/si"
import { PiMicrosoftOutlookLogo } from "react-icons/pi"
import { Loader2, CheckCircle2, AlertCircle, Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export type OAuthProvider = "google" | "microsoft" | "microsoft365" | "icloud"

export type OAuthConnectionStatus = "idle" | "connecting" | "success" | "error"

interface OAuthEmailConnectProps {
  onConnect: (provider: OAuthProvider) => Promise<void>
  connectedAccounts?: Array<{
    provider: OAuthProvider
    email: string
  }>
  className?: string
}

interface ProviderConfig {
  id: OAuthProvider
  name: string
  icon: React.ReactNode
  description: string
  color: string
  disabled?: boolean
}

const providers: ProviderConfig[] = [
  {
    id: "google",
    name: "Google / Gmail",
    icon: <SiGmail className="size-6" color="#EA4335" />,
    description: "Connectez votre compte Gmail ou Google Workspace",
    color: "border-red-200 hover:bg-red-50/50",
  },
  {
    id: "microsoft",
    name: "Microsoft / Outlook",
    icon: <PiMicrosoftOutlookLogo className="size-6" color="#0078D4" />,
    description: "Connectez votre compte Outlook personnel",
    color: "border-blue-200 hover:bg-blue-50/50",
  },
  {
    id: "microsoft365",
    name: "Microsoft 365 / Office 365",
    icon: <Building2 className="size-6" color="#0078D4" />,
    description: "Connectez votre compte professionnel Microsoft 365",
    color: "border-blue-200 hover:bg-blue-50/50",
  },
]

export function OAuthEmailConnect({
  onConnect,
  connectedAccounts = [],
  className,
}: OAuthEmailConnectProps) {
  const [connectingProvider, setConnectingProvider] = React.useState<OAuthProvider | null>(null)
  const [status, setStatus] = React.useState<OAuthConnectionStatus>("idle")
  const [errorMessage, setErrorMessage] = React.useState<string>("")

  const isConnected = (providerId: OAuthProvider) => {
    return connectedAccounts.some((acc) => acc.provider === providerId)
  }

  const getConnectedEmail = (providerId: OAuthProvider) => {
    return connectedAccounts.find((acc) => acc.provider === providerId)?.email
  }

  const handleConnect = async (provider: OAuthProvider) => {
    setConnectingProvider(provider)
    setStatus("connecting")
    setErrorMessage("")

    try {
      await onConnect(provider)
      setStatus("success")
      setTimeout(() => {
        setStatus("idle")
        setConnectingProvider(null)
      }, 2000)
    } catch (error) {
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Échec de la connexion")
      setTimeout(() => {
        setStatus("idle")
        setConnectingProvider(null)
      }, 3000)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {status === "error" && errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {providers.map((provider) => {
          const connected = isConnected(provider.id)
          const connecting = connectingProvider === provider.id && status === "connecting"
          const success = connectingProvider === provider.id && status === "success"

          return (
            <Card
              key={provider.id}
              className={cn(
                "transition-all",
                provider.color,
                connected && "border-green-300 bg-green-50/30",
                provider.disabled && "opacity-50"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-lg bg-white border flex items-center justify-center shrink-0">
                      {provider.icon}
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {provider.name}
                        {connected && (
                          <CheckCircle2 className="size-4 text-green-600" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {connected && getConnectedEmail(provider.id)
                          ? getConnectedEmail(provider.id)
                          : provider.description}
                      </CardDescription>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleConnect(provider.id)}
                    disabled={provider.disabled || connecting || connected}
                    variant={connected ? "secondary" : "outline"}
                    size="sm"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Connexion...
                      </>
                    ) : success ? (
                      <>
                        <CheckCircle2 className="size-4" />
                        Connecté
                      </>
                    ) : connected ? (
                      "Connecté"
                    ) : provider.disabled ? (
                      "Bientôt disponible"
                    ) : (
                      "Connecter"
                    )}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      <Alert>
        <AlertDescription className="text-sm">
          <strong>Note :</strong> En connectant votre compte, vous autorisez l&apos;application à envoyer
          des emails en votre nom. Vous pouvez révoquer cet accès à tout moment depuis les
          paramètres de votre compte Google ou Microsoft.
        </AlertDescription>
      </Alert>
    </div>
  )
}
