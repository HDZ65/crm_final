"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import {
  Zap,
  Settings,
  Info,
  Eye,
  EyeOff,
  Loader2,
  Wifi,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Key,
  Link2,
} from "lucide-react"
import {
  testWinLeadPlusConnection,
  saveWinLeadPlusConfig,
  getWinLeadPlusConfig,
} from "@/actions/winleadplus"
import type { WinLeadPlusConfig } from "@proto/winleadplus/winleadplus"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WinLeadPlusIntegrationSectionProps {
  activeOrgId?: string | null
  initialConfig: WinLeadPlusConfig | null
}

interface ConnectionTestResult {
  status: "idle" | "loading" | "success" | "error"
  message?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WIN_LEAD_PLUS_JSON_EXAMPLE = `{
  "apiEndpoint": "https://api.winleadplus.com/v1",
  "apiToken": "wlp_xxxxxxxxxxxx"
}`

const FEATURES = [
  { label: "Sync Leads", icon: RefreshCw },
  { label: "Auto-refresh", icon: Clock },
  { label: "API Token", icon: Key },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WinLeadPlusIntegrationSection({
  activeOrgId,
  initialConfig,
}: WinLeadPlusIntegrationSectionProps) {
  const [config, setConfig] = React.useState<WinLeadPlusConfig | null>(initialConfig)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [form, setForm] = React.useState({
    apiEndpoint: "",
    apiToken: "",
    enabled: true,
    syncIntervalMinutes: 30,
  })
  const [showApiToken, setShowApiToken] = React.useState(false)
  const [testResult, setTestResult] = React.useState<ConnectionTestResult>({
    status: "idle",
  })
  const [saving, setSaving] = React.useState(false)

  const isConnected = config?.enabled === true

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const openDialog = () => {
    setForm({
      apiEndpoint: config?.apiEndpoint ?? "",
      apiToken: "",
      enabled: config?.enabled ?? true,
      syncIntervalMinutes: config?.syncIntervalMinutes ?? 30,
    })
    setTestResult({ status: "idle" })
    setShowApiToken(false)
    setDialogOpen(true)
  }

  const handleTest = async () => {
    if (!activeOrgId || !form.apiEndpoint) {
      toast.error("Veuillez saisir l'URL de l'API")
      return
    }
    setTestResult({ status: "loading" })
    const result = await testWinLeadPlusConnection({
      organisationId: activeOrgId,
      apiEndpoint: form.apiEndpoint,
    })
    if (result.data?.success) {
      setTestResult({
        status: "success",
        message: result.data.message || "Connexion réussie",
      })
    } else {
      setTestResult({
        status: "error",
        message:
          result.error || result.data?.message || "Échec de la connexion",
      })
    }
  }

  const handleCardTest = async () => {
    if (!activeOrgId || !config?.apiEndpoint) return
    setTestResult({ status: "loading" })
    const result = await testWinLeadPlusConnection({
      organisationId: activeOrgId,
      apiEndpoint: config.apiEndpoint,
    })
    if (result.data?.success) {
      setTestResult({
        status: "success",
        message: result.data.message || "Connexion réussie",
      })
      toast.success("Connexion WinLeadPlus réussie")
    } else {
      setTestResult({
        status: "error",
        message:
          result.error || result.data?.message || "Échec de la connexion",
      })
      toast.error(result.error || "Échec de la connexion WinLeadPlus")
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeOrgId) {
      toast.error("Organisation non trouvée")
      return
    }
    if (!form.apiEndpoint) {
      toast.error("L'URL de l'API est obligatoire")
      return
    }

    setSaving(true)
    const result = await saveWinLeadPlusConfig({
      id: config?.id,
      organisationId: activeOrgId,
      apiEndpoint: form.apiEndpoint,
      apiToken: form.apiToken || undefined,
      enabled: form.enabled,
      syncIntervalMinutes: form.syncIntervalMinutes,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(
        config ? "Configuration mise à jour" : "Configuration créée"
      )
      setDialogOpen(false)
      const refreshed = await getWinLeadPlusConfig({
        organisationId: activeOrgId,
      })
      if (refreshed.data) setConfig(refreshed.data)
    }
    setSaving(false)
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      <Card
        className={`group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20 ${
          isConnected ? "border-l-[3px] border-l-emerald-500" : ""
        }`}
      >
        {/* Subtle gradient glow at top */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 ring-1 ring-blue-200/50 dark:from-blue-900 dark:to-blue-800 dark:text-blue-300 dark:ring-blue-700/50">
                <Zap className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg">WinLeadPlus</CardTitle>
                <CardDescription className="mt-0.5">
                  Synchronisation de prospects et leads
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
                  <Link2 className="size-3.5" />
                  API Endpoint
                </span>
                <span className="font-mono text-xs truncate max-w-[180px]">
                  {config.apiEndpoint || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Key className="size-3.5" />
                  Clé API
                </span>
                <span className="font-mono text-xs">
                  {config.hasApiToken ? "••••••••" : "Non configurée"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-3.5" />
                  Intervalle sync
                </span>
                <span className="text-xs font-medium">{config.syncIntervalMinutes} min</span>
              </div>
              {config.lastSyncAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <RefreshCw className="size-3.5" />
                    Dernière sync
                  </span>
                  <span className="text-xs">
                    {new Date(config.lastSyncAt).toLocaleString("fr-FR")}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Aucune configuration active
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Cliquez sur Configurer pour démarrer l&apos;intégration
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
            <Button size="sm" onClick={openDialog}>
              <Settings className="size-4 mr-1.5" />
              {config ? "Modifier" : "Configurer"}
            </Button>
            {config && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCardTest}
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

      {/* Config Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {config
                ? "Modifier la configuration WinLeadPlus"
                : "Configurer WinLeadPlus"}
            </DialogTitle>
            <DialogDescription>
              Saisissez les paramètres de connexion à l&apos;API WinLeadPlus.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            {/* API Endpoint */}
            <div className="space-y-2">
              <Label htmlFor="wlp-apiEndpoint">API Endpoint *</Label>
              <Input
                id="wlp-apiEndpoint"
                value={form.apiEndpoint}
                onChange={(e) =>
                  setForm({ ...form, apiEndpoint: e.target.value })
                }
                placeholder="https://api.winleadplus.com/v1"
                required
              />
            </div>

            {/* API Token */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="wlp-apiToken">Clé API</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Info className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-xs font-medium mb-1">
                      Format JSON attendu :
                    </p>
                    <pre className="text-xs font-mono whitespace-pre bg-muted p-2 rounded">
                      {WIN_LEAD_PLUS_JSON_EXAMPLE}
                    </pre>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="relative">
                <Input
                  id="wlp-apiToken"
                  type={showApiToken ? "text" : "password"}
                  value={form.apiToken}
                  onChange={(e) =>
                    setForm({ ...form, apiToken: e.target.value })
                  }
                  placeholder={
                    config?.hasApiToken
                      ? "Laisser vide pour conserver l'actuel"
                      : "wlp_xxxxxxxxxxxx"
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiToken(!showApiToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showApiToken ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Sync Interval */}
            <div className="space-y-2">
              <Label htmlFor="wlp-syncInterval">
                Intervalle de synchronisation (minutes)
              </Label>
              <Input
                id="wlp-syncInterval"
                type="number"
                min={5}
                max={1440}
                value={form.syncIntervalMinutes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    syncIntervalMinutes: parseInt(e.target.value, 10) || 30,
                  })
                }
              />
            </div>

            {/* Enabled switch */}
            <div className="flex items-center justify-between">
              <Label htmlFor="wlp-enabled">
                Activer l&apos;intégration
              </Label>
              <Switch
                id="wlp-enabled"
                checked={form.enabled}
                onCheckedChange={(checked) =>
                  setForm({ ...form, enabled: checked })
                }
              />
            </div>

            <Separator />

            {/* Test connection */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={
                  testResult.status === "loading" || !form.apiEndpoint
                }
                className="w-full"
              >
                {testResult.status === "loading" ? (
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                ) : (
                  <Wifi className="size-4 mr-1.5" />
                )}
                Tester la connexion
              </Button>
              {testResult.status !== "idle" && (
                <div
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                    testResult.status === "loading"
                      ? "bg-muted/50 text-muted-foreground"
                      : testResult.status === "success"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                        : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                  }`}
                >
                  {testResult.status === "loading" && <Loader2 className="size-3.5 animate-spin" />}
                  {testResult.status === "success" && <CheckCircle2 className="size-3.5" />}
                  {testResult.status === "error" && <XCircle className="size-3.5" />}
                  <span className="text-xs">{testResult.status === "loading" ? "Test en cours…" : testResult.message}</span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && (
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                )}
                {config ? "Mettre à jour" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
