"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, Settings } from "lucide-react"
import {
  PSP_PROVIDERS,
  PSP_CONFIG_SCHEMAS,
} from "@/lib/billing/psp-providers"
// Mock actions - will be implemented in backend
const savePSPAccount = async (data: any) => ({ data: null, error: null })
const testPSPConnection = async (data: any) => ({ data: null, error: null })
import { PaymentProvider } from "@/types/billing"
import type { PSPAccountsSummaryResponse } from "@proto/payments/payment"
import { z } from "zod"

interface PSPConfigPageClientProps {
  activeOrgId?: string | null
  initialPSPSummary?: PSPAccountsSummaryResponse | null
}

interface PSPConfigFormData {
  [key: string]: string | boolean
}

export function PSPConfigPageClient({
  activeOrgId,
  initialPSPSummary,
}: PSPConfigPageClientProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedProvider, setSelectedProvider] = React.useState<PaymentProvider | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [testingConnection, setTestingConnection] = React.useState(false)
  const [pspSummary, setPspSummary] = React.useState<PSPAccountsSummaryResponse | null>(
    initialPSPSummary ?? null
  )

  // Get the schema for the selected provider
  const getProviderSchema = (provider: PaymentProvider) => {
    return PSP_CONFIG_SCHEMAS[provider] || z.object({})
  }

  // Create form with dynamic schema
  const form = useForm<PSPConfigFormData>({
    resolver: selectedProvider ? (zodResolver(getProviderSchema(selectedProvider) as any) as any) : undefined,
    mode: 'onChange',
    defaultValues: {},
  })

  const handleOpenDialog = (provider: PaymentProvider) => {
    setSelectedProvider(provider)
    form.reset({})
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedProvider(null)
    form.reset({})
  }

  const onSubmit = async (data: PSPConfigFormData) => {
    if (!selectedProvider || !activeOrgId) {
      toast.error("Configuration invalide")
      return
    }

    setLoading(true)
    try {
      const result = await savePSPAccount({
        societeId: activeOrgId,
        provider: selectedProvider,
        config: JSON.stringify(data),
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Configuration ${selectedProvider} sauvegardée`)
        handleCloseDialog()
        // Refresh PSP summary
        const summaryResult = await (activeOrgId
          ? (await import("@/actions/payments")).getPSPAccountsSummary(activeOrgId)
          : Promise.resolve({ data: null, error: null }))
        if (summaryResult.data) {
          setPspSummary(summaryResult.data)
        }
      }
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    if (!selectedProvider || !activeOrgId) {
      toast.error("Configuration invalide")
      return
    }

    setTestingConnection(true)
    try {
      const formData = form.getValues()
      const result = await testPSPConnection({
        societeId: activeOrgId,
        provider: selectedProvider,
        config: JSON.stringify(formData),
      })

      if (result.error) {
        toast.error(`Erreur de connexion: ${result.error}`)
      } else {
        toast.success(`Connexion ${selectedProvider} réussie`)
      }
    } catch (error) {
      toast.error("Erreur lors du test de connexion")
      console.error(error)
    } finally {
      setTestingConnection(false)
    }
  }

  const getProviderStatus = (provider: PaymentProvider): boolean => {
    // TODO: Check actual PSP account status from summary
    return false
  }

  const renderFormFields = () => {
    if (!selectedProvider) return null

    const provider = selectedProvider
    const fields: { name: string; label: string; type: string; required: boolean }[] = []

    switch (provider) {
      case PaymentProvider.STRIPE:
        fields.push(
          { name: "publishableKey", label: "Publishable Key", type: "text", required: true },
          { name: "secretKey", label: "Secret Key", type: "password", required: true },
          { name: "webhookSecret", label: "Webhook Secret", type: "password", required: false },
          { name: "environment", label: "Environment", type: "select", required: true }
        )
        break
      case PaymentProvider.GOCARDLESS:
        fields.push(
          { name: "accessToken", label: "Access Token", type: "password", required: true },
          { name: "webhookSecret", label: "Webhook Secret", type: "password", required: false },
          { name: "environment", label: "Environment", type: "select", required: true }
        )
        break
      case PaymentProvider.SLIMPAY:
        fields.push(
          { name: "merchantId", label: "Merchant ID", type: "text", required: true },
          { name: "apiKey", label: "API Key", type: "password", required: true },
          { name: "apiSecret", label: "API Secret", type: "password", required: true },
          { name: "environment", label: "Environment", type: "select", required: true }
        )
        break
      case PaymentProvider.MULTISAFEPAY:
        fields.push(
          { name: "apiKey", label: "API Key", type: "password", required: true },
          { name: "environment", label: "Environment", type: "select", required: true }
        )
        break
      case PaymentProvider.EMERCHANTPAY:
        fields.push(
          { name: "username", label: "Username", type: "text", required: true },
          { name: "password", label: "Password", type: "password", required: true },
          { name: "terminalId", label: "Terminal ID", type: "text", required: true },
          { name: "environment", label: "Environment", type: "select", required: true }
        )
        break
    }

    return fields.map((field) => (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name}
        render={({ field: fieldProps }) => (
          <FormItem>
            <FormLabel>{field.label}</FormLabel>
            <FormControl>
              {field.type === "select" ? (
                <Select value={fieldProps.value as string} onValueChange={fieldProps.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={field.type}
                  placeholder={field.label}
                  {...fieldProps}
                  value={fieldProps.value as string}
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuration PSP</h1>
        <p className="text-muted-foreground mt-2">
          Configurez vos fournisseurs de services de paiement
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PSP_PROVIDERS.map((provider) => {
          const isConnected = getProviderStatus(provider.id as PaymentProvider)

          return (
            <Card key={provider.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {provider.description}
                    </CardDescription>
                  </div>
                  <div
                    className="w-8 h-8 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: provider.color }}
                  />
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Fonctionnalités:</div>
                  <div className="flex flex-wrap gap-1">
                    {provider.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {provider.supportsSepa && (
                    <Badge variant="outline" className="text-xs">
                      SEPA
                    </Badge>
                  )}
                  {provider.supportsCards && (
                    <Badge variant="outline" className="text-xs">
                      Cartes
                    </Badge>
                  )}
                </div>

                <div className="pt-2">
                  <Badge variant={isConnected ? "default" : "secondary"}>
                    {isConnected ? "Connecté" : "Non connecté"}
                  </Badge>
                </div>

                <Button
                  onClick={() => handleOpenDialog(provider.id as PaymentProvider)}
                  className="w-full mt-4"
                  variant="outline"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configurer
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Configurer {selectedProvider && PSP_PROVIDERS.find((p) => p.id === selectedProvider)?.name}
            </DialogTitle>
            <DialogDescription>
              Entrez les paramètres de configuration pour ce fournisseur de paiement
            </DialogDescription>
          </DialogHeader>

          {selectedProvider && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {renderFormFields()}

                <DialogFooter className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={loading || testingConnection}
                  >
                    {testingConnection && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Tester la connexion
                  </Button>
                  <Button type="submit" disabled={loading || testingConnection}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Sauvegarder
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
