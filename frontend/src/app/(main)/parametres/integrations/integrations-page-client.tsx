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
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import {
  testWinLeadPlusConnection,
  saveWinLeadPlusConfig,
  getWinLeadPlusConfig,
} from "@/actions/winleadplus"
import { testWooCommerceConnection } from "@/actions/woocommerce"
import {
  testCatalogueApiConnection,
  importCatalogueFromApi,
} from "@/actions/catalogue-api"
import type { WinLeadPlusConfig } from "@proto/winleadplus/winleadplus"
import type { WooCommerceConfig } from "@proto/woocommerce/woocommerce"
import {
  Zap,
  ShoppingCart,
  Package,
  Settings,
  Info,
  Check,
  X,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink,
  Wifi,
  WifiOff,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IntegrationsPageClientProps {
  activeOrgId?: string | null
  initialWinLeadPlusConfig: WinLeadPlusConfig | null
  initialWooCommerceConfig: WooCommerceConfig | null
}

interface ConnectionTestResult {
  status: "idle" | "loading" | "success" | "error"
  message?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WIN_LEAD_PLUS_JSON_EXAMPLE = `{
  "api_endpoint": "https://api.winleadplus.com/v1",
  "api_token": "wlp_xxxxxxxxxxxx"
}`

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IntegrationsPageClient({
  activeOrgId,
  initialWinLeadPlusConfig,
  initialWooCommerceConfig,
}: IntegrationsPageClientProps) {
  // WinLeadPlus state
  const [winleadplusConfig, setWinleadplusConfig] =
    React.useState<WinLeadPlusConfig | null>(initialWinLeadPlusConfig)
  const [winleadplusDialogOpen, setWinleadplusDialogOpen] = React.useState(false)
  const [winleadplusForm, setWinleadplusForm] = React.useState({
    apiEndpoint: "",
    apiToken: "",
    enabled: true,
    syncIntervalMinutes: 30,
  })
  const [showApiToken, setShowApiToken] = React.useState(false)
  const [winleadplusTestResult, setWinleadplusTestResult] =
    React.useState<ConnectionTestResult>({ status: "idle" })
  const [saving, setSaving] = React.useState(false)

  // WooCommerce state
  const [woocommerceConfig] = React.useState<WooCommerceConfig | null>(
    initialWooCommerceConfig
  )
  const [wooTestResult, setWooTestResult] = React.useState<ConnectionTestResult>(
    { status: "idle" }
  )

  // Catalogue REST API state
  const [catalogueDialogOpen, setCatalogueDialogOpen] = React.useState(false)
  const [catalogueForm, setCatalogueForm] = React.useState({
    apiUrl: "",
    authToken: "",
  })
  const [catalogueTestResult, setCatalogueTestResult] =
    React.useState<ConnectionTestResult>({ status: "idle" })
  const [catalogueImporting, setCatalogueImporting] = React.useState(false)
  const [showCatalogueToken, setShowCatalogueToken] = React.useState(false)

  // ---------------------------------------------------------------------------
  // WinLeadPlus handlers
  // ---------------------------------------------------------------------------

  const openWinLeadPlusDialog = () => {
    setWinleadplusForm({
      apiEndpoint: winleadplusConfig?.api_endpoint ?? "",
      apiToken: "",
      enabled: winleadplusConfig?.enabled ?? true,
      syncIntervalMinutes: winleadplusConfig?.sync_interval_minutes ?? 30,
    })
    setWinleadplusTestResult({ status: "idle" })
    setShowApiToken(false)
    setWinleadplusDialogOpen(true)
  }

  const handleTestWinLeadPlus = async () => {
    if (!activeOrgId || !winleadplusForm.apiEndpoint) {
      toast.error("Veuillez saisir l'URL de l'API")
      return
    }
    setWinleadplusTestResult({ status: "loading" })
    const result = await testWinLeadPlusConnection({
      organisationId: activeOrgId,
      apiEndpoint: winleadplusForm.apiEndpoint,
    })
    if (result.data?.success) {
      setWinleadplusTestResult({
        status: "success",
        message: result.data.message || "Connexion réussie",
      })
    } else {
      setWinleadplusTestResult({
        status: "error",
        message: result.error || result.data?.message || "Échec de la connexion",
      })
    }
  }

  const handleSaveWinLeadPlus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeOrgId) {
      toast.error("Organisation non trouvée")
      return
    }
    if (!winleadplusForm.apiEndpoint) {
      toast.error("L'URL de l'API est obligatoire")
      return
    }

    setSaving(true)
    const result = await saveWinLeadPlusConfig({
      id: winleadplusConfig?.id,
      organisationId: activeOrgId,
      apiEndpoint: winleadplusForm.apiEndpoint,
      apiToken: winleadplusForm.apiToken || undefined,
      enabled: winleadplusForm.enabled,
      syncIntervalMinutes: winleadplusForm.syncIntervalMinutes,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(
        winleadplusConfig ? "Configuration mise à jour" : "Configuration créée"
      )
      setWinleadplusDialogOpen(false)
      // Refresh config
      const refreshed = await getWinLeadPlusConfig({ organisationId: activeOrgId })
      if (refreshed.data) setWinleadplusConfig(refreshed.data)
    }
    setSaving(false)
  }

  // ---------------------------------------------------------------------------
  // WooCommerce handlers
  // ---------------------------------------------------------------------------

  const handleTestWooCommerce = async () => {
    if (!activeOrgId) return
    setWooTestResult({ status: "loading" })
    const result = await testWooCommerceConnection(activeOrgId)
    if (result.data?.success) {
      setWooTestResult({
        status: "success",
        message: result.data.message || "Connexion réussie",
      })
    } else {
      setWooTestResult({
        status: "error",
        message: result.error || result.data?.message || "Échec de la connexion",
      })
    }
  }

  // ---------------------------------------------------------------------------
  // Catalogue REST API handlers
  // ---------------------------------------------------------------------------

  const openCatalogueDialog = () => {
    setCatalogueForm({ apiUrl: "", authToken: "" })
    setCatalogueTestResult({ status: "idle" })
    setShowCatalogueToken(false)
    setCatalogueDialogOpen(true)
  }

  const handleTestCatalogueApi = async () => {
    if (!catalogueForm.apiUrl) {
      toast.error("Veuillez saisir l'URL de l'API")
      return
    }
    setCatalogueTestResult({ status: "loading" })
    const result = await testCatalogueApiConnection(catalogueForm.apiUrl, catalogueForm.authToken || undefined)
    if (result.data?.success) {
      setCatalogueTestResult({
        status: "success",
        message: result.data.message || "Connexion réussie",
      })
    } else {
      setCatalogueTestResult({
        status: "error",
        message: result.error || result.data?.message || "Échec de la connexion",
      })
    }
  }

  const handleImportCatalogue = async () => {
    if (!activeOrgId || !catalogueForm.apiUrl) {
      toast.error("Veuillez saisir l'URL de l'API")
      return
    }
    setCatalogueImporting(true)
    const result = await importCatalogueFromApi({
      organisationId: activeOrgId,
      apiUrl: catalogueForm.apiUrl,
      authToken: catalogueForm.authToken || undefined,
    })
    setCatalogueImporting(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(
        `Importation réussie: ${result.data?.imported} produits importés, ${result.data?.skipped} ignorés`
      )
      setCatalogueDialogOpen(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderTestBadge = (result: ConnectionTestResult) => {
    if (result.status === "loading") {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Test en cours…
        </span>
      )
    }
    if (result.status === "success") {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
          <Check className="size-3.5" />
          {result.message}
        </span>
      )
    }
    if (result.status === "error") {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
          <X className="size-3.5" />
          {result.message}
        </span>
      )
    }
    return null
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <TooltipProvider>
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="size-6" />
            Intégrations Externes
          </h1>
          <p className="text-muted-foreground">
            Configurez les accès aux catalogues de produits et services externes.
          </p>
        </div>

        {/* Integration cards grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* ================================================================ */}
          {/* WinLeadPlus Card */}
          {/* ================================================================ */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    <Zap className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">WinLeadPlus</CardTitle>
                    <CardDescription>
                      Synchronisation de prospects et leads
                    </CardDescription>
                  </div>
                </div>
                {winleadplusConfig?.enabled ? (
                  <Badge variant="default" className="gap-1">
                    <Wifi className="size-3" />
                    Connecté
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <WifiOff className="size-3" />
                    Déconnecté
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {winleadplusConfig ? (
                <>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">API Endpoint</span>
                      <span className="font-mono text-xs truncate max-w-[200px]">
                        {winleadplusConfig.api_endpoint || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Clé API</span>
                      <span className="font-mono text-xs">
                        {winleadplusConfig.has_api_token ? "••••••••" : "Non configurée"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Intervalle de sync
                      </span>
                      <span>{winleadplusConfig.sync_interval_minutes} min</span>
                    </div>
                    {winleadplusConfig.last_sync_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Dernière sync
                        </span>
                        <span>
                          {new Date(winleadplusConfig.last_sync_at).toLocaleString(
                            "fr-FR"
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                  <Separator />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune configuration. Cliquez sur Configurer pour commencer.
                </p>
              )}
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={openWinLeadPlusDialog}>
                  <Settings className="size-4 mr-1.5" />
                  Configurer
                </Button>
                {winleadplusConfig && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestWinLeadPlus}
                    disabled={winleadplusTestResult.status === "loading"}
                  >
                    {winleadplusTestResult.status === "loading" ? (
                      <Loader2 className="size-4 mr-1.5 animate-spin" />
                    ) : (
                      <Wifi className="size-4 mr-1.5" />
                    )}
                    Tester la connexion
                  </Button>
                )}
              </div>
              {renderTestBadge(winleadplusTestResult)}
            </CardContent>
          </Card>

          {/* ================================================================ */}
          {/* WooCommerce Card */}
          {/* ================================================================ */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                    <ShoppingCart className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">WooCommerce</CardTitle>
                    <CardDescription>
                      Synchronisation e-commerce et produits
                    </CardDescription>
                  </div>
                </div>
                {woocommerceConfig?.active ? (
                  <Badge variant="default" className="gap-1">
                    <Wifi className="size-3" />
                    Connecté
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <WifiOff className="size-3" />
                    Déconnecté
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {woocommerceConfig ? (
                <>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">URL Boutique</span>
                      <span className="font-mono text-xs truncate max-w-[200px]">
                        {woocommerceConfig.storeUrl || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Consumer Key</span>
                      <span className="font-mono text-xs">
                        {woocommerceConfig.consumerKey
                          ? woocommerceConfig.consumerKey.substring(0, 8) + "••••"
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sync Produits</span>
                      <Badge
                        variant={
                          woocommerceConfig.syncProducts ? "default" : "secondary"
                        }
                      >
                        {woocommerceConfig.syncProducts ? "Oui" : "Non"}
                      </Badge>
                    </div>
                  </div>
                  <Separator />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune configuration. Accédez à la page WooCommerce pour configurer.
                </p>
              )}
              <div className="flex items-center gap-2">
                <Link href="/integrations/woocommerce">
                  <Button size="sm">
                    <Settings className="size-4 mr-1.5" />
                    Configurer
                    <ExternalLink className="size-3.5 ml-1.5" />
                  </Button>
                </Link>
                {woocommerceConfig && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestWooCommerce}
                    disabled={wooTestResult.status === "loading"}
                  >
                    {wooTestResult.status === "loading" ? (
                      <Loader2 className="size-4 mr-1.5 animate-spin" />
                    ) : (
                      <Wifi className="size-4 mr-1.5" />
                    )}
                    Tester la connexion
                  </Button>
                )}
              </div>
              {renderTestBadge(wooTestResult)}
            </CardContent>
          </Card>

          {/* ================================================================ */}
          {/* Catalogue REST API */}
          {/* ================================================================ */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                    <Package className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Catalogue REST API</CardTitle>
                    <CardDescription>
                      Connecteur API REST générique pour catalogues externes
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">Disponible</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Importez des catalogues depuis n&apos;importe quelle API REST. Supportez les formats: array, {`{data: [...]}`}, ou {`{products: [...]}`}.
              </p>
              <div className="mt-4">
                <Button size="sm" onClick={openCatalogueDialog}>
                  <Settings className="size-4 mr-1.5" />
                  Configurer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================================================================== */}
        {/* WinLeadPlus Config Dialog */}
        {/* ================================================================== */}
        <Dialog
          open={winleadplusDialogOpen}
          onOpenChange={setWinleadplusDialogOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {winleadplusConfig
                  ? "Modifier la configuration WinLeadPlus"
                  : "Configurer WinLeadPlus"}
              </DialogTitle>
              <DialogDescription>
                Saisissez les paramètres de connexion à l&apos;API WinLeadPlus.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveWinLeadPlus} className="space-y-4">
              {/* API Endpoint */}
              <div className="space-y-2">
                <Label htmlFor="apiEndpoint">API Endpoint *</Label>
                <Input
                  id="apiEndpoint"
                  value={winleadplusForm.apiEndpoint}
                  onChange={(e) =>
                    setWinleadplusForm({
                      ...winleadplusForm,
                      apiEndpoint: e.target.value,
                    })
                  }
                  placeholder="https://api.winleadplus.com/v1"
                  required
                />
              </div>

              {/* API Token with toggle + JSON tooltip */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="apiToken">Clé API</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Info className="size-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="max-w-xs"
                    >
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
                    id="apiToken"
                    type={showApiToken ? "text" : "password"}
                    value={winleadplusForm.apiToken}
                    onChange={(e) =>
                      setWinleadplusForm({
                        ...winleadplusForm,
                        apiToken: e.target.value,
                      })
                    }
                    placeholder={
                      winleadplusConfig?.has_api_token
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
                <Label htmlFor="syncInterval">
                  Intervalle de synchronisation (minutes)
                </Label>
                <Input
                  id="syncInterval"
                  type="number"
                  min={5}
                  max={1440}
                  value={winleadplusForm.syncIntervalMinutes}
                  onChange={(e) =>
                    setWinleadplusForm({
                      ...winleadplusForm,
                      syncIntervalMinutes: parseInt(e.target.value, 10) || 30,
                    })
                  }
                />
              </div>

              {/* Enabled switch */}
              <div className="flex items-center justify-between">
                <Label htmlFor="enabled">Activer l&apos;intégration</Label>
                <Switch
                  id="enabled"
                  checked={winleadplusForm.enabled}
                  onCheckedChange={(checked) =>
                    setWinleadplusForm({
                      ...winleadplusForm,
                      enabled: checked,
                    })
                  }
                />
              </div>

              <Separator />

              {/* Test connection in dialog */}
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestWinLeadPlus}
                  disabled={
                    winleadplusTestResult.status === "loading" ||
                    !winleadplusForm.apiEndpoint
                  }
                  className="w-full"
                >
                  {winleadplusTestResult.status === "loading" ? (
                    <Loader2 className="size-4 mr-1.5 animate-spin" />
                  ) : (
                    <Wifi className="size-4 mr-1.5" />
                  )}
                  Tester la connexion
                </Button>
                {renderTestBadge(winleadplusTestResult)}
              </div>

               <DialogFooter>
                 <Button
                   type="button"
                   variant="outline"
                   onClick={() => setWinleadplusDialogOpen(false)}
                 >
                   Annuler
                 </Button>
                 <Button type="submit" disabled={saving}>
                   {saving && <Loader2 className="size-4 mr-1.5 animate-spin" />}
                   {winleadplusConfig ? "Mettre à jour" : "Enregistrer"}
                 </Button>
               </DialogFooter>
             </form>
           </DialogContent>
         </Dialog>

         {/* ================================================================== */}
         {/* Catalogue REST API Config Dialog */}
         {/* ================================================================== */}
         <Dialog open={catalogueDialogOpen} onOpenChange={setCatalogueDialogOpen}>
           <DialogContent className="sm:max-w-md">
             <DialogHeader>
               <DialogTitle>Configurer Catalogue REST API</DialogTitle>
               <DialogDescription>
                 Entrez l&apos;URL de votre API REST pour importer des produits
               </DialogDescription>
             </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="catalogue-url">URL de l&apos;API</Label>
                  <Input
                    id="catalogue-url"
                    placeholder="https://api.example.com/products"
                    value={catalogueForm.apiUrl}
                    onChange={(e) =>
                      setCatalogueForm({ ...catalogueForm, apiUrl: e.target.value })
                    }
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Formats supportés: array, {`{data: [...]}`}, {`{products: [...]}`}
                  </p>
                </div>

                <div>
                  <Label htmlFor="catalogue-token">Token d&apos;authentification (optionnel — auto si vide)</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="catalogue-token"
                      type={showCatalogueToken ? "text" : "password"}
                      placeholder="eyJhbGciOiJSUzI1NiIs..."
                      value={catalogueForm.authToken}
                      onChange={(e) =>
                        setCatalogueForm({ ...catalogueForm, authToken: e.target.value })
                      }
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCatalogueToken(!showCatalogueToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showCatalogueToken ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Laissez vide pour utiliser le token de votre session Keycloak</p>
                </div>

                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestCatalogueApi}
                    disabled={catalogueTestResult.status === "loading"}
                    className="w-full"
                  >
                    {catalogueTestResult.status === "loading" ? (
                      <Loader2 className="size-4 mr-1.5 animate-spin" />
                    ) : (
                      <Wifi className="size-4 mr-1.5" />
                    )}
                    Tester la connexion
                  </Button>
                </div>

               {renderTestBadge(catalogueTestResult)}
             </div>

             <DialogFooter>
               <Button
                 type="button"
                 variant="outline"
                 onClick={() => setCatalogueDialogOpen(false)}
               >
                 Annuler
               </Button>
               <Button
                 onClick={handleImportCatalogue}
                 disabled={
                   catalogueImporting ||
                   catalogueTestResult.status !== "success"
                 }
               >
                 {catalogueImporting && (
                   <Loader2 className="size-4 mr-1.5 animate-spin" />
                 )}
                 Importer
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
       </main>
     </TooltipProvider>
   )
 }
