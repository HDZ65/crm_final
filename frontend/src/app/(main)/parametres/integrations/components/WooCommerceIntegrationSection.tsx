"use client"

import * as React from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  ShoppingCart,
  Settings,
  Loader2,
  ExternalLink,
  Wifi,
  CheckCircle2,
  XCircle,
  Store,
  Package,
  RefreshCw,
} from "lucide-react"
import { testWooCommerceConnection } from "@/actions/woocommerce"
import type { WooCommerceConfig } from "@proto/woocommerce/woocommerce"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WooCommerceIntegrationSectionProps {
  activeOrgId?: string | null
  initialConfig: WooCommerceConfig | null
}

interface ConnectionTestResult {
  status: "idle" | "loading" | "success" | "error"
  message?: string
}

const FEATURES = [
  { label: "E-commerce", icon: Store },
  { label: "Produits", icon: Package },
  { label: "Auto-sync", icon: RefreshCw },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WooCommerceIntegrationSection({
  activeOrgId,
  initialConfig,
}: WooCommerceIntegrationSectionProps) {
  const [config] = React.useState<WooCommerceConfig | null>(initialConfig)
  const [testResult, setTestResult] = React.useState<ConnectionTestResult>({
    status: "idle",
  })

  const isConnected = config?.active === true

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleTest = async () => {
    if (!activeOrgId) return
    setTestResult({ status: "loading" })
    const result = await testWooCommerceConnection(activeOrgId)
    if (result.data?.success) {
      setTestResult({
        status: "success",
        message: result.data.message || "Connexion réussie",
      })
      toast.success("Connexion WooCommerce réussie")
    } else {
      setTestResult({
        status: "error",
        message:
          result.error || result.data?.message || "Échec de la connexion",
      })
      toast.error(result.error || "Échec de la connexion WooCommerce")
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20 ${
        isConnected ? "border-l-[3px] border-l-emerald-500" : ""
      }`}
    >
      {/* Subtle gradient glow at top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 ring-1 ring-purple-200/50 dark:from-purple-900 dark:to-purple-800 dark:text-purple-300 dark:ring-purple-700/50">
              <ShoppingCart className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg">WooCommerce</CardTitle>
              <CardDescription className="mt-0.5">
                Synchronisation e-commerce et produits
              </CardDescription>
            </div>
          </div>
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
              Déconnecté
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Feature pills */}
        <div className="flex flex-wrap gap-1.5">
          {FEATURES.map(({ label, icon: Icon }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              <Icon className="size-3" />
              {label}
            </span>
          ))}
        </div>

        {/* Configuration info */}
        {config ? (
          <div className="rounded-lg bg-muted/40 p-3 space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Store className="size-3.5" />
                URL Boutique
              </span>
              <span className="font-mono text-xs truncate max-w-[180px]">
                {config.storeUrl || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Consumer Key
              </span>
              <span className="font-mono text-xs">
                {config.consumerKey
                  ? config.consumerKey.substring(0, 8) + "••••"
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Package className="size-3.5" />
                Sync Produits
              </span>
              <Badge
                variant={config.syncProducts ? "default" : "secondary"}
                className="text-[10px] px-1.5 py-0"
              >
                {config.syncProducts ? "Actif" : "Inactif"}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune configuration active
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Accédez à la page WooCommerce pour configurer
            </p>
          </div>
        )}

        {/* Test result inline */}
        {testResult.status !== "idle" && (
          <div
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all ${
              testResult.status === "loading"
                ? "bg-muted/50 text-muted-foreground"
                : testResult.status === "success"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                  : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400"
            }`}
          >
            {testResult.status === "loading" && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {testResult.status === "success" && (
              <CheckCircle2 className="size-4" />
            )}
            {testResult.status === "error" && (
              <XCircle className="size-4" />
            )}
            <span className="text-xs font-medium">
              {testResult.status === "loading"
                ? "Test en cours…"
                : testResult.message}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Link href="/integrations/woocommerce">
            <Button size="sm">
              <Settings className="size-4 mr-1.5" />
              Configurer
              <ExternalLink className="size-3.5 ml-1.5" />
            </Button>
          </Link>
          {config && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleTest}
              disabled={testResult.status === "loading"}
            >
              {testResult.status === "loading" ? (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              ) : (
                <Wifi className="size-4 mr-1.5" />
              )}
              Tester
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
