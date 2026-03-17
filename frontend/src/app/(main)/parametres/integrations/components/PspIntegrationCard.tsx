"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  CheckCircle,
  XCircle,
  CreditCard,
  Building2,
  Banknote,
  Globe,
  Landmark,
  Wallet,
  Settings,
  Unplug,
  type LucideIcon,
} from "lucide-react"
import type { PspProviderConfig } from "../data/psp-providers"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PspAccount {
  actif: boolean
  isTestMode?: boolean
  isSandbox?: boolean
  nom?: string
}

interface PspIntegrationCardProps {
  provider: PspProviderConfig
  account: PspAccount | null
  onConfigure: () => void
  onTest: () => void
  onDisconnect: () => void
  testStatus: "idle" | "loading" | "success" | "error"
  isDisconnecting: boolean
}

// ---------------------------------------------------------------------------
// Icon resolver — maps provider icon string to lucide component
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  CreditCard,
  Building2,
  Banknote,
  Globe,
  Landmark,
  Wallet,
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PspIntegrationCard({
  provider,
  account,
  onConfigure,
  onTest,
  onDisconnect,
  testStatus,
  isDisconnecting,
}: PspIntegrationCardProps) {
  const isConnected = account?.actif === true
  const isTestEnv = account?.isTestMode || account?.isSandbox
  const Icon = ICON_MAP[provider.icon] ?? CreditCard

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleDisconnect = () => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir déconnecter ${provider.name} ?`
    )
    if (confirmed) onDisconnect()
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-11 items-center justify-center rounded-xl ring-1 ring-black/5 dark:ring-white/10 ${provider.color} dark:opacity-90`}
            >
              <Icon className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{provider.name}</CardTitle>
              <CardDescription>{provider.description}</CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Environment badge */}
            {isConnected && (
              <Badge
                variant="outline"
                className={
                  isTestEnv
                    ? "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400"
                    : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                }
              >
                {isTestEnv ? "Test" : "Live"}
              </Badge>
            )}

            {/* Status badge */}
            {isConnected ? (
              <Badge
                variant="outline"
                className="gap-1.5 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
              >
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                Connecté
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-full bg-muted-foreground/40" />
                Non configuré
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-2">
          {/* Configure / Modify */}
          <Button size="sm" onClick={onConfigure}>
            <Settings className="size-4 mr-1.5" />
            {isConnected ? "Modifier" : "Configurer"}
          </Button>

          {/* Test — only when account exists */}
          {account && (
            <Button
              size="sm"
              variant="outline"
              onClick={onTest}
              disabled={testStatus === "loading"}
            >
              {testStatus === "loading" ? (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              ) : testStatus === "success" ? (
                <CheckCircle className="size-4 mr-1.5 text-green-600" />
              ) : testStatus === "error" ? (
                <XCircle className="size-4 mr-1.5 text-red-600" />
              ) : null}
              Tester
            </Button>
          )}

          {/* Disconnect — only when active */}
          {isConnected && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              ) : (
                <Unplug className="size-4 mr-1.5" />
              )}
              Déconnecter
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
