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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Package,
  Settings,
  Loader2,
  Wifi,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Download,
  FileJson,
  Globe,
} from "lucide-react"
import {
  testCatalogueApiConnection,
  importCatalogueFromApi,
} from "@/actions/catalogue-api"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CatalogueApiIntegrationSectionProps {
  activeOrgId?: string | null
}

interface ConnectionTestResult {
  status: "idle" | "loading" | "success" | "error"
  message?: string
}

const FEATURES = [
  { label: "REST API", icon: Globe },
  { label: "Multi-format", icon: FileJson },
  { label: "Import bulk", icon: Download },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CatalogueApiIntegrationSection({
  activeOrgId,
}: CatalogueApiIntegrationSectionProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [form, setForm] = React.useState({
    apiUrl: "",
    authToken: "",
  })
  const [testResult, setTestResult] = React.useState<ConnectionTestResult>({
    status: "idle",
  })
  const [importing, setImporting] = React.useState(false)
  const [showToken, setShowToken] = React.useState(false)

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const openDialog = () => {
    setForm({ apiUrl: "", authToken: "" })
    setTestResult({ status: "idle" })
    setShowToken(false)
    setDialogOpen(true)
  }

  const handleTest = async () => {
    if (!form.apiUrl) {
      toast.error("Veuillez saisir l'URL de l'API")
      return
    }
    setTestResult({ status: "loading" })
    const result = await testCatalogueApiConnection(
      form.apiUrl,
      form.authToken || undefined
    )
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

  const handleImport = async () => {
    if (!activeOrgId || !form.apiUrl) {
      toast.error("Veuillez saisir l'URL de l'API")
      return
    }
    setImporting(true)
    const result = await importCatalogueFromApi({
      organisationId: activeOrgId,
      apiUrl: form.apiUrl,
      authToken: form.authToken || undefined,
    })
    setImporting(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(
        `Importation réussie: ${result.data?.imported} produits importés, ${result.data?.skipped} ignorés`
      )
      setDialogOpen(false)
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20">
        {/* Subtle gradient glow at top */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/20 to-transparent" />

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-sky-200 text-sky-600 ring-1 ring-sky-200/50 dark:from-sky-900 dark:to-sky-800 dark:text-sky-300 dark:ring-sky-700/50">
                <Package className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Catalogue REST API</CardTitle>
                <CardDescription className="mt-0.5">
                  Connecteur API REST générique pour catalogues
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className="gap-1.5 border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-400"
            >
              Disponible
            </Badge>
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

          {/* Description panel */}
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Importez des catalogues depuis n&apos;importe quelle API REST
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Formats : <code className="bg-muted px-1 rounded text-[10px]">array</code>{" "}
              <code className="bg-muted px-1 rounded text-[10px]">{`{data: [...]}`}</code>{" "}
              <code className="bg-muted px-1 rounded text-[10px]">{`{products: [...]}`}</code>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={openDialog}>
              <Settings className="size-4 mr-1.5" />
              Configurer &amp; Importer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Config Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurer Catalogue REST API</DialogTitle>
            <DialogDescription>
              Entrez l&apos;URL de votre API REST pour importer des produits
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="catalogue-url">URL de l&apos;API *</Label>
              <Input
                id="catalogue-url"
                placeholder="https://api.example.com/products"
                value={form.apiUrl}
                onChange={(e) =>
                  setForm({ ...form, apiUrl: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Formats supportés : array, {`{data: [...]}`},{" "}
                {`{products: [...]}`}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="catalogue-token">
                Token d&apos;authentification
              </Label>
              <div className="relative">
                <Input
                  id="catalogue-token"
                  type={showToken ? "text" : "password"}
                  placeholder="eyJhbGciOiJSUzI1NiIs..."
                  value={form.authToken}
                  onChange={(e) =>
                    setForm({ ...form, authToken: e.target.value })
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showToken ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Optionnel — laissez vide pour utiliser votre session Keycloak
              </p>
            </div>

            {/* Test connection */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testResult.status === "loading" || !form.apiUrl}
              className="w-full"
            >
              {testResult.status === "loading" ? (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              ) : (
                <Wifi className="size-4 mr-1.5" />
              )}
              Tester la connexion
            </Button>

            {/* Test result inline */}
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
                <span className="text-xs font-medium">
                  {testResult.status === "loading" ? "Test en cours…" : testResult.message}
                </span>
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
            <Button
              onClick={handleImport}
              disabled={importing || testResult.status !== "success"}
            >
              {importing && (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              )}
              <Download className="size-4 mr-1.5" />
              Importer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
