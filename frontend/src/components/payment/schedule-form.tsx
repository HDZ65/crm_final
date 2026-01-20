"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useOrganisation } from "@/contexts/organisation-context"
import { useSocietes } from "@/hooks/clients"
import { useFactures } from "@/hooks/factures"
import { useContrats } from "@/hooks/contracts"
import { useClients } from "@/hooks/clients"
import { useProduits } from "@/hooks/catalogue/use-produits"
import { ApiError } from "@/lib/api"
import { ScheduleStatus, PSPName, type CreateScheduleDto, type IntervalUnit } from "@/types/schedule"

interface ScheduleFormProps {
  onSubmit: (data: CreateScheduleDto) => Promise<void>
  loading?: boolean
}

// Composant pour afficher l'erreur d'un champ
function FieldError({ error }: { error?: string[] }) {
  if (!error || error.length === 0) return null
  return (
    <p className="text-sm text-destructive mt-1">
      {error[0]}
    </p>
  )
}

const statusOptions: ScheduleStatus[] = [
  ScheduleStatus.PLANNED,
  ScheduleStatus.PROCESSING,
  ScheduleStatus.PENDING,
  ScheduleStatus.PAID,
  ScheduleStatus.FAILED,
  ScheduleStatus.UNPAID,
  ScheduleStatus.CANCELLED,
]

const pspOptions = [
  { value: PSPName.STRIPE, label: "Stripe (Carte bancaire)" },
  { value: PSPName.GOCARDLESS, label: "GoCardless (SEPA)" },
  { value: PSPName.SLIMPAY, label: "SlimPay (SEPA)" },
  { value: PSPName.MULTISAFEPAY, label: "MultiSafePay" },
  { value: PSPName.EMERCHANTPAY, label: "eMerchantPay" },
]

const intervalOptions: { value: IntervalUnit; label: string }[] = [
  { value: "day", label: "Jour(s)" },
  { value: "week", label: "Semaine(s)" },
  { value: "month", label: "Mois" },
  { value: "year", label: "Année(s)" },
]

export function ScheduleForm({ onSubmit, loading }: ScheduleFormProps) {
  const { activeOrganisation } = useOrganisation()
  const { societes } = useSocietes(activeOrganisation?.organisationId)

  // Récupérer les vraies factures, contrats, clients et produits
  const { factures } = useFactures(
    activeOrganisation?.organisationId ? { organisationId: activeOrganisation.organisationId } : undefined
  )
  const { contrats } = useContrats(
    activeOrganisation?.organisationId ? { organisationId: activeOrganisation.organisationId } : undefined
  )
  const { clients } = useClients(
    activeOrganisation?.organisationId ? { organisationId: activeOrganisation.organisationId } : undefined
  )
  const { produits } = useProduits(
    activeOrganisation?.organisationId ? { organisationId: activeOrganisation.organisationId } : undefined
  )

  const [formData, setFormData] = useState<CreateScheduleDto>({
    organisationId: "",
    factureId: "",
    contratId: "",
    societeId: "",
    clientId: "",
    produitId: "",
    pspName: PSPName.GOCARDLESS,
    amount: 0,
    currency: "EUR",
    dueDate: new Date().toISOString().split("T")[0],
    isRecurring: false,
    intervalUnit: "month",
    intervalCount: 1,
    status: ScheduleStatus.PLANNED,
    maxRetries: 3,
    pspMandateId: "",
    pspCustomerId: "",
  })

  // État pour les erreurs de validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  // Mettre à jour l'organisationId quand l'organisation active change
  useEffect(() => {
    if (activeOrganisation?.organisationId) {
      setFormData(prev => ({ ...prev, organisationId: activeOrganisation.organisationId }))
    }
  }, [activeOrganisation])

  // Mettre à jour le montant quand une facture est sélectionnée
  useEffect(() => {
    if (formData.factureId) {
      const facture = factures.find(f => f.id === formData.factureId)
      if (facture?.montantTTC) {
        setFormData(prev => ({ ...prev, amount: facture.montantTTC }))
      }
    }
  }, [formData.factureId, factures])

  // Mettre à jour le montant quand un produit est sélectionné
  useEffect(() => {
    if (formData.produitId) {
      const produit = produits.find(p => p.id === formData.produitId)
      if (produit?.priceTTC) {
        setFormData(prev => ({ ...prev, amount: produit.priceTTC }))
      }
    }
  }, [formData.produitId, produits])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Reset des erreurs
    setFieldErrors({})
    setGeneralError(null)

    // Clean up empty optional fields
    const cleanedData = { ...formData }
    if (!cleanedData.factureId) delete cleanedData.factureId
    if (!cleanedData.contratId) delete cleanedData.contratId
    if (!cleanedData.societeId) delete cleanedData.societeId
    if (!cleanedData.clientId) delete cleanedData.clientId
    if (!cleanedData.produitId) delete cleanedData.produitId
    if (!cleanedData.pspMandateId) delete cleanedData.pspMandateId
    if (!cleanedData.pspCustomerId) delete cleanedData.pspCustomerId
    if (!cleanedData.isRecurring) {
      delete cleanedData.intervalUnit
      delete cleanedData.intervalCount
    }

    try {
      await onSubmit(cleanedData)
    } catch (error) {
      if (error instanceof ApiError) {
        // Extraire les erreurs de validation par champ
        if (error.validationErrors) {
          setFieldErrors(error.validationErrors)
        }
        // Message d'erreur général
        setGeneralError(error.getUserMessage())
      } else {
        setGeneralError("Une erreur est survenue")
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un Schedule de paiement</CardTitle>
        <CardDescription>
          Planifiez un prélèvement automatique via Stripe (CB) ou GoCardless (SEPA)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Erreur générale */}
          {generalError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}

          {/* PSP Selection */}
          <div className="p-4 bg-muted rounded-lg space-y-4">
            <h4 className="font-semibold">Prestataire de paiement</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pspName">PSP *</Label>
                <Select
                  value={formData.pspName}
                  onValueChange={(value) =>
                    setFormData({ ...formData, pspName: value as PSPName })
                  }
                >
                  <SelectTrigger className={fieldErrors.pspName ? "border-destructive" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pspOptions.map((psp) => (
                      <SelectItem key={psp.value} value={psp.value}>
                        {psp.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError error={fieldErrors.pspName} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, currency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* PSP References */}
            <div className="grid grid-cols-2 gap-4">
              {formData.pspName === PSPName.GOCARDLESS && (
                <div className="space-y-2">
                  <Label htmlFor="pspMandateId">Mandate ID (GoCardless)</Label>
                  <Input
                    id="pspMandateId"
                    value={formData.pspMandateId || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, pspMandateId: e.target.value })
                    }
                    placeholder="MD000xxx"
                  />
                  <p className="text-xs text-muted-foreground">
                    ID du mandat SEPA du client
                  </p>
                </div>
              )}
              {formData.pspName === PSPName.STRIPE && (
                <div className="space-y-2">
                  <Label htmlFor="pspCustomerId">Customer ID (Stripe)</Label>
                  <Input
                    id="pspCustomerId"
                    value={formData.pspCustomerId || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, pspCustomerId: e.target.value })
                    }
                    placeholder="cus_xxx"
                  />
                  <p className="text-xs text-muted-foreground">
                    ID du client Stripe
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organisationId">Organisation</Label>
              <Input
                id="organisationId"
                value={activeOrganisation?.organisationNom || "Aucune organisation"}
                disabled
                className="bg-muted"
              />
              <FieldError error={fieldErrors.organisationId} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Client</Label>
              <Select
                value={formData.clientId || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, clientId: value })
                }
                disabled={clients.length === 0}
              >
                <SelectTrigger className={fieldErrors.clientId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} {client.email && `(${client.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError error={fieldErrors.clientId} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="societeId">Société</Label>
              <Select
                value={formData.societeId || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, societeId: value })
                }
                disabled={societes.length === 0}
              >
                <SelectTrigger className={fieldErrors.societeId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner une société" />
                </SelectTrigger>
                <SelectContent>
                  {societes.map((societe) => (
                    <SelectItem key={societe.id} value={societe.id}>
                      {societe.raisonSociale}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError error={fieldErrors.societeId} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="produitId">Produit</Label>
              <Select
                value={formData.produitId || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, produitId: value })
                }
                disabled={produits.length === 0}
              >
                <SelectTrigger className={fieldErrors.produitId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {produits.map((produit) => (
                    <SelectItem key={produit.id} value={produit.id}>
                      {produit.name} - {produit.priceTTC?.toFixed(2)}€
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError error={fieldErrors.produitId} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="factureId">Facture (optionnel)</Label>
              <Select
                value={formData.factureId || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, factureId: value })
                }
                disabled={factures.length === 0}
              >
                <SelectTrigger className={fieldErrors.factureId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner une facture" />
                </SelectTrigger>
                <SelectContent>
                  {factures.map((facture) => (
                    <SelectItem key={facture.id} value={facture.id}>
                      {facture.numero || facture.id.slice(0, 8)} - {facture.montantTTC?.toFixed(2) || 0}€
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError error={fieldErrors.factureId} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contratId">Contrat (optionnel)</Label>
              <Select
                value={formData.contratId || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, contratId: value })
                }
                disabled={contrats.length === 0}
              >
                <SelectTrigger className={fieldErrors.contratId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner un contrat" />
                </SelectTrigger>
                <SelectContent>
                  {contrats.map((contrat) => (
                    <SelectItem key={contrat.id} value={contrat.id}>
                      {contrat.reference || contrat.id.slice(0, 8)}
                      {contrat.clientBase?.raisonSociale && ` - ${contrat.clientBase.raisonSociale}`}
                      {contrat.clientBase?.nom && ` - ${contrat.clientBase.nom}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError error={fieldErrors.contratId} />
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                }
                required
                className={fieldErrors.amount ? "border-destructive" : ""}
              />
              <FieldError error={fieldErrors.amount} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Date d&apos;échéance *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                required
                className={fieldErrors.dueDate ? "border-destructive" : ""}
              />
              <FieldError error={fieldErrors.dueDate} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as ScheduleStatus })
                }
              >
                <SelectTrigger className={fieldErrors.status ? "border-destructive" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError error={fieldErrors.status} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRetries">Nombre max de tentatives</Label>
              <Input
                id="maxRetries"
                type="number"
                min="0"
                max="10"
                value={formData.maxRetries}
                onChange={(e) =>
                  setFormData({ ...formData, maxRetries: parseInt(e.target.value) || 3 })
                }
              />
            </div>
          </div>

          {/* Recurring Options */}
          <div className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isRecurring">Paiement récurrent</Label>
                <p className="text-xs text-muted-foreground">
                  Prélèvement automatique périodique
                </p>
              </div>
              <Switch
                id="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isRecurring: checked })
                }
              />
            </div>

            {formData.isRecurring && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="intervalCount">Intervalle</Label>
                  <Input
                    id="intervalCount"
                    type="number"
                    min="1"
                    value={formData.intervalCount}
                    onChange={(e) =>
                      setFormData({ ...formData, intervalCount: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intervalUnit">Période</Label>
                  <Select
                    value={formData.intervalUnit}
                    onValueChange={(value) =>
                      setFormData({ ...formData, intervalUnit: value as IntervalUnit })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {intervalOptions.map((interval) => (
                        <SelectItem key={interval.value} value={interval.value}>
                          {interval.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Création..." : "Créer le Schedule"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
