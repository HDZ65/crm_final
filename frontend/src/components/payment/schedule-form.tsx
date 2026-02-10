"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { type CreateScheduleRequest } from "@proto/payments/payment"

interface ScheduleFormProps {
  onSubmit: (data: CreateScheduleRequest) => Promise<void>
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

const pspOptions = [
  { value: "stripe", label: "Stripe (Carte bancaire)" },
  { value: "gocardless", label: "GoCardless (SEPA)" },
  { value: "slimpay", label: "SlimPay (SEPA)" },
  { value: "multisafepay", label: "MultiSafePay" },
  { value: "emerchantpay", label: "eMerchantPay" },
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

  const [formData, setFormData] = useState({
    organisationId: "",
    factureId: "",
    contratId: "",
    societeId: "",
    clientId: "",
    amount: 0,
    currency: "EUR",
    dueDate: new Date().toISOString().split("T")[0],
    description: "",
    autoProcess: false,
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
      if (facture?.montantTtc) {
        setFormData(prev => ({ ...prev, amount: facture.montantTtc }))
      }
    }
  }, [formData.factureId, factures])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Reset des erreurs
    setFieldErrors({})
    setGeneralError(null)

    const request: CreateScheduleRequest = {
      organisationId: formData.organisationId,
      societeId: formData.societeId || "",
      contratId: formData.contratId || undefined,
      factureId: formData.factureId || undefined,
      clientId: formData.clientId || undefined,
      amount: formData.amount,
      currency: formData.currency,
      dueDate: formData.dueDate,
      description: formData.description || undefined,
      autoProcess: formData.autoProcess,
      metadata: {},
    }

    try {
      await onSubmit(request)
    } catch (error: unknown) {
      const err = error as { details?: string; message?: string; validationErrors?: Record<string, string[]> };
      if (err.validationErrors) {
        setFieldErrors(err.validationErrors)
      }
      setGeneralError(err.details || err.message || "Une erreur est survenue")
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
                      {facture.numero || facture.id.slice(0, 8)} - {facture.montantTtc?.toFixed(2) || 0}€
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

            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description du paiement"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Création..." : "Créer le Schedule"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
