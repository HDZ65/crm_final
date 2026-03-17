"use client"

import { useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CreditCard, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { PSP_PROVIDERS, type PspProviderConfig } from "../data/psp-providers"
import { PspIntegrationCard, type PspAccount } from "./PspIntegrationCard"
import { PspConfigDialog } from "./PspConfigDialog"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PspIntegrationSectionProps {
  societes: { id: string; nom: string }[]
  accounts: Record<string, PspAccount | null>
  onSave: (
    societeId: string,
    pspType: string,
    data: Record<string, any>
  ) => Promise<void>
  onTest: (
    societeId: string,
    pspType: string
  ) => Promise<{ success: boolean; message: string }>
  onDisconnect: (societeId: string, pspType: string) => Promise<void>
  onSocieteChange: (societeId: string) => void
  isLoading: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PspIntegrationSection({
  societes,
  accounts,
  onSave,
  onTest,
  onDisconnect,
  onSocieteChange,
  isLoading,
}: PspIntegrationSectionProps) {
  // Internal state
  const [selectedSocieteId, setSelectedSocieteId] = useState<string>(
    societes[0]?.id ?? ""
  )
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] =
    useState<PspProviderConfig | null>(null)
  const [testStatuses, setTestStatuses] = useState<
    Record<string, "idle" | "loading" | "success" | "error">
  >({})
  const [isDisconnecting, setIsDisconnecting] = useState<
    Record<string, boolean>
  >({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSocieteChange = useCallback(
    (id: string) => {
      setSelectedSocieteId(id)
      // Reset per-PSP states when société changes
      setTestStatuses({})
      setIsDisconnecting({})
      onSocieteChange(id)
    },
    [onSocieteChange]
  )

  const handleConfigure = useCallback((provider: PspProviderConfig) => {
    setSelectedProvider(provider)
    setConfigDialogOpen(true)
  }, [])

  const handleTest = useCallback(
    async (pspType: string) => {
      if (!selectedSocieteId) return
      setTestStatuses((prev) => ({ ...prev, [pspType]: "loading" }))
      try {
        const result = await onTest(selectedSocieteId, pspType)
        setTestStatuses((prev) => ({
          ...prev,
          [pspType]: result.success ? "success" : "error",
        }))
        if (result.success) {
          toast.success(result.message || "Connexion réussie")
        } else {
          toast.error(result.message || "Échec de la connexion")
        }
      } catch {
        setTestStatuses((prev) => ({ ...prev, [pspType]: "error" }))
        toast.error("Erreur lors du test de connexion")
      }
    },
    [selectedSocieteId, onTest]
  )

  const handleDisconnect = useCallback(
    async (pspType: string) => {
      if (!selectedSocieteId) return
      setIsDisconnecting((prev) => ({ ...prev, [pspType]: true }))
      try {
        await onDisconnect(selectedSocieteId, pspType)
        toast.success("PSP déconnecté avec succès")
      } catch {
        toast.error("Erreur lors de la déconnexion")
      } finally {
        setIsDisconnecting((prev) => ({ ...prev, [pspType]: false }))
      }
    },
    [selectedSocieteId, onDisconnect]
  )

  const handleDialogSubmit = useCallback(
    async (data: Record<string, any>) => {
      if (!selectedSocieteId || !selectedProvider) return
      setIsSubmitting(true)
      try {
        await onSave(selectedSocieteId, selectedProvider.id, data)
        toast.success(`${selectedProvider.name} configuré avec succès`)
        setConfigDialogOpen(false)
      } catch {
        toast.error("Erreur lors de l'enregistrement")
      } finally {
        setIsSubmitting(false)
      }
    },
    [selectedSocieteId, selectedProvider, onSave]
  )

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <Card className="group relative md:col-span-2 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20">
        {/* Subtle gradient glow at top */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600 ring-1 ring-emerald-200/50 dark:from-emerald-900 dark:to-emerald-800 dark:text-emerald-300 dark:ring-emerald-700/50">
                <CreditCard className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  Prestataires de Paiement
                </CardTitle>
                <CardDescription>
                  Gérez vos intégrations avec les prestataires de services de
                  paiement (PSP)
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Société selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Société :
            </span>
            <Select
              value={selectedSocieteId}
              onValueChange={handleSocieteChange}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Sélectionner une société" />
              </SelectTrigger>
              <SelectContent>
                {societes.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="size-5 animate-spin mr-2" />
              Chargement des configurations…
            </div>
          ) : (
            /* PSP cards grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PSP_PROVIDERS.map((provider) => (
                <PspIntegrationCard
                  key={provider.id}
                  provider={provider}
                  account={accounts[provider.id] ?? null}
                  onConfigure={() => handleConfigure(provider)}
                  onTest={() => handleTest(provider.id)}
                  onDisconnect={() => handleDisconnect(provider.id)}
                  testStatus={testStatuses[provider.id] ?? "idle"}
                  isDisconnecting={isDisconnecting[provider.id] ?? false}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Config dialog — rendered outside card to avoid z-index issues */}
      {selectedProvider && (
        <PspConfigDialog
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
          provider={selectedProvider}
          existingAccount={
            accounts[selectedProvider.id]
              ? (accounts[selectedProvider.id] as Record<string, any>)
              : null
          }
          onSubmit={handleDialogSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  )
}
