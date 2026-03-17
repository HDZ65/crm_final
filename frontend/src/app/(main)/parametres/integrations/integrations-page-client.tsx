"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  getCfastConfig,
  saveCfastConfig,
  testCfastConnection,
} from "@/actions/cfast"
import {
  savePSPAccount,
  getPSPAccount,
  testPSPConnection,
  deactivatePSPAccount,
} from "@/actions/psp-account-config"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Zap, Loader2, Eye, EyeOff } from "lucide-react"
import { AskAiCardButton } from "@/components/ask-ai-card-button"

// Section components
import { CfastIntegrationSection } from "./components/CfastIntegrationSection"
import { PspIntegrationSection } from "./components/PspIntegrationSection"
import { WinLeadPlusIntegrationSection } from "./components/WinLeadPlusIntegrationSection"
import { WooCommerceIntegrationSection } from "./components/WooCommerceIntegrationSection"
import { CatalogueApiIntegrationSection } from "./components/CatalogueApiIntegrationSection"
import { InterFastIntegrationCard } from "./components/InterFastIntegrationCard"

import type { PspAccount } from "./components/PspIntegrationCard"
import { useSocietes } from "@/hooks/clients/use-societes"
import type { WinLeadPlusConfig } from "@proto/winleadplus/winleadplus"
import type { WooCommerceConfig } from "@proto/woocommerce/woocommerce"
import type { CfastConfig } from "@proto/cfast/cfast"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IntegrationsPageClientProps {
  activeOrgId?: string | null
  initialWinLeadPlusConfig: WinLeadPlusConfig | null
  initialWooCommerceConfig: WooCommerceConfig | null
  initialCfastConfig: CfastConfig | null
}

// ---------------------------------------------------------------------------
// CFAST schema
// ---------------------------------------------------------------------------

const cfastSchema = z.object({
  baseUrl: z.string().url("URL invalide"),
  clientId: z.string().min(1, "Client ID obligatoire"),
  clientSecret: z.string().min(1, "Client Secret obligatoire"),
  username: z.string().min(1, "Nom d'utilisateur obligatoire"),
  password: z.string().min(1, "Mot de passe obligatoire"),
  scopes: z.string().optional(),
})

type CfastFormValues = z.infer<typeof cfastSchema>

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IntegrationsPageClient({
  activeOrgId,
  initialWinLeadPlusConfig,
  initialWooCommerceConfig,
  initialCfastConfig,
}: IntegrationsPageClientProps) {
  // =========================================================================
  // CFAST state (dialog managed here since CfastIntegrationSection is external)
  // =========================================================================
  const [cfastConfig, setCfastConfig] =
    React.useState<CfastConfig | null>(initialCfastConfig)
  const [cfastDialogOpen, setCfastDialogOpen] = React.useState(false)
  const cfastForm = useForm<CfastFormValues>({
    resolver: zodResolver(cfastSchema),
    defaultValues: {
      baseUrl: "",
      clientId: "",
      clientSecret: "",
      username: "",
      password: "",
      scopes: "openid identity bill",
    },
  })
  const [showCfastSecret, setShowCfastSecret] = React.useState(false)
  const [showCfastPassword, setShowCfastPassword] = React.useState(false)
  const [cfastTestResult, setCfastTestResult] = React.useState<{
    status: "idle" | "loading" | "success" | "error"
  }>({ status: "idle" })
  const [cfastSaving, setCfastSaving] = React.useState(false)

  // =========================================================================
  // PSP state
  // =========================================================================
  const { societes: societesList } = useSocietes(activeOrgId)
  const pspSocietes = React.useMemo(
    () => societesList.map((s) => ({ id: s.id, nom: s.raisonSociale })),
    [societesList]
  )
  const [pspAccounts, setPspAccounts] = React.useState<
    Record<string, PspAccount | null>
  >({})
  const [pspLoading, setPspLoading] = React.useState(false)

  // =========================================================================
  // CFAST handlers
  // =========================================================================

  React.useEffect(() => {
    if (!activeOrgId) return
    let active = true
    const loadCfastConfig = async () => {
      const result = await getCfastConfig(activeOrgId)
      if (result.data && active) setCfastConfig(result.data)
    }
    loadCfastConfig()
    return () => {
      active = false
    }
  }, [activeOrgId])

  const openCfastDialog = () => {
    cfastForm.reset({
      baseUrl: cfastConfig?.baseUrl ?? "",
      clientId: "",
      clientSecret: "",
      username: "",
      password: "",
      scopes: cfastConfig?.scopes ?? "openid identity bill",
    })
    setCfastTestResult({ status: "idle" })
    setShowCfastSecret(false)
    setShowCfastPassword(false)
    setCfastDialogOpen(true)
  }

  const handleTestCfast = async () => {
    if (!activeOrgId) return
    setCfastTestResult({ status: "loading" })
    const result = await testCfastConnection(activeOrgId)
    if (result.data?.success) {
      toast.success(result.data.message || "Connexion CFAST réussie")
      setCfastTestResult({ status: "success" })
    } else {
      toast.error(
        result.error || result.data?.message || "Échec de la connexion CFAST"
      )
      setCfastTestResult({ status: "error" })
    }
  }

  const handleSaveCfast = cfastForm.handleSubmit(async (values) => {
    if (!activeOrgId) {
      toast.error("Organisation non trouvée")
      return
    }
    setCfastSaving(true)
    const result = await saveCfastConfig({
      organisationId: activeOrgId,
      baseUrl: values.baseUrl,
      clientId: values.clientId,
      clientSecret: values.clientSecret,
      username: values.username,
      password: values.password,
      scopes: values.scopes || undefined,
    })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(
        cfastConfig
          ? "Configuration CFAST mise à jour"
          : "Configuration CFAST créée"
      )
      setCfastDialogOpen(false)
      const refreshed = await getCfastConfig(activeOrgId)
      if (refreshed.data) setCfastConfig(refreshed.data)
    }
    setCfastSaving(false)
  })

  // =========================================================================
  // PSP handlers
  // =========================================================================

  const handlePspSocieteChange = React.useCallback(
    async (societeId: string) => {
      setPspLoading(true)
      setPspAccounts({})
      try {
        const result = await getPSPAccount({ organisationId: societeId })
        if (result.data) {
          setPspAccounts({})
        }
      } catch {
        // Service may not be deployed yet
      } finally {
        setPspLoading(false)
      }
    },
    []
  )

  const handlePspSave = React.useCallback(
    async (societeId: string, pspType: string, data: Record<string, any>) => {
      const result = await savePSPAccount({
        societeId,
        pspType,
        credentials: data,
        isTestMode: false,
      } as any)
      if (result.error) {
        throw new Error(result.error)
      }
    },
    []
  )

  const handlePspTest = React.useCallback(
    async (
      societeId: string,
      pspType: string
    ): Promise<{ success: boolean; message: string }> => {
      const result = await testPSPConnection({ societeId, pspType } as any)
      if (result.error) {
        return { success: false, message: result.error }
      }
      return {
        success: result.data?.success ?? false,
        message: result.data?.message ?? "Test terminé",
      }
    },
    []
  )

  const handlePspDisconnect = React.useCallback(
    async (societeId: string, pspType: string) => {
      const result = await deactivatePSPAccount({
        societeId,
        pspType,
      } as any)
      if (result.error) {
        throw new Error(result.error)
      }
    },
    []
  )

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <TooltipProvider>
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="size-6" />
              Intégrations Externes
            </h1>
            <AskAiCardButton prompt="Analyse cette configuration d'intégrations et suggère des améliorations" />
          </div>
          <p className="text-muted-foreground mt-1">
            Configurez les accès aux catalogues de produits et services
            externes.
          </p>
        </div>

        {/* Integration cards grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* ---- Sync & Data ---- */}
          <WinLeadPlusIntegrationSection
            activeOrgId={activeOrgId}
            initialConfig={initialWinLeadPlusConfig}
          />

          <WooCommerceIntegrationSection
            activeOrgId={activeOrgId}
            initialConfig={initialWooCommerceConfig}
          />

          <CatalogueApiIntegrationSection activeOrgId={activeOrgId} />

          <InterFastIntegrationCard />

          {/* ---- Billing & Telecom (full-width) ---- */}
          <CfastIntegrationSection
            activeOrgId={activeOrgId}
            cfastConfig={cfastConfig}
            onOpenConfigDialog={openCfastDialog}
            onTestConnection={handleTestCfast}
            testResultStatus={cfastTestResult.status}
          />

          {/* ---- Payments (full-width) ---- */}
          {pspSocietes.length > 0 && (
            <PspIntegrationSection
              societes={pspSocietes}
              accounts={pspAccounts}
              onSave={handlePspSave}
              onTest={handlePspTest}
              onDisconnect={handlePspDisconnect}
              onSocieteChange={handlePspSocieteChange}
              isLoading={pspLoading}
            />
          )}
        </div>

        {/* ================================================================ */}
        {/* CFAST Config Dialog                                              */}
        {/* ================================================================ */}
        <Dialog open={cfastDialogOpen} onOpenChange={setCfastDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {cfastConfig
                  ? "Modifier la configuration CFAST"
                  : "Configuration CFAST"}
              </DialogTitle>
              <DialogDescription>
                Saisissez les paramètres de connexion à l&apos;API CFAST.
              </DialogDescription>
            </DialogHeader>
            <Form {...cfastForm}>
              <form onSubmit={handleSaveCfast} className="space-y-4">
                {/* Base URL */}
                <FormField
                  control={cfastForm.control}
                  name="baseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base URL *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://v2.cfast.fr"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Client ID */}
                <FormField
                  control={cfastForm.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client ID *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Votre Client ID"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Client Secret */}
                <FormField
                  control={cfastForm.control}
                  name="clientSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Secret *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showCfastSecret ? "text" : "password"}
                            placeholder="Votre Client Secret"
                            className="pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowCfastSecret(!showCfastSecret)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showCfastSecret ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Username */}
                <FormField
                  control={cfastForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom d&apos;utilisateur *</FormLabel>
                      <FormControl>
                        <Input placeholder="Votre username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={cfastForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showCfastPassword ? "text" : "password"}
                            placeholder="Votre mot de passe"
                            className="pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowCfastPassword(!showCfastPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showCfastPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Scopes */}
                <FormField
                  control={cfastForm.control}
                  name="scopes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scopes (optionnel)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="openid identity bill"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCfastDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={cfastSaving}>
                    {cfastSaving && (
                      <Loader2 className="size-4 mr-1.5 animate-spin" />
                    )}
                    Enregistrer
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </main>
    </TooltipProvider>
  )
}

export function IntegrationsPageClientWrapper(
  props: IntegrationsPageClientProps
) {
  return <IntegrationsPageClient {...props} />
}
