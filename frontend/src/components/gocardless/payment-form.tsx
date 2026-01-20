"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Euro } from "lucide-react"
import type { CreatePaymentRequest, GocardlessPayment } from "@/types/gocardless"

interface GocardlessPaymentFormProps {
  onSubmit: (data: CreatePaymentRequest) => Promise<GocardlessPayment | null>
  loading?: boolean
  disabled?: boolean
  disabledMessage?: string
}

export function GocardlessPaymentForm({
  onSubmit,
  loading,
  disabled,
  disabledMessage = "Vous devez configurer un mandat actif avant de créer un paiement",
}: GocardlessPaymentFormProps) {
  const [formData, setFormData] = useState({
    amount: "",
    reference: "",
    description: "",
    chargeDate: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<GocardlessPayment | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const amountInCents = Math.round(parseFloat(formData.amount) * 100)

    if (isNaN(amountInCents) || amountInCents <= 0) {
      setError("Le montant doit être supérieur à 0")
      return
    }

    try {
      const result = await onSubmit({
        amount: amountInCents,
        currency: "EUR",
        reference: formData.reference || undefined,
        description: formData.description || undefined,
        chargeDate: formData.chargeDate || undefined,
      })

      if (result) {
        setSuccess(result)
        setFormData({
          amount: "",
          reference: "",
          description: "",
          chargeDate: "",
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création du paiement")
    }
  }

  // Date minimum pour le prélèvement (J+3)
  const minChargeDate = new Date()
  minChargeDate.setDate(minChargeDate.getDate() + 3)
  const minChargeDateStr = minChargeDate.toISOString().split("T")[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Euro className="h-5 w-5" />
          Créer un paiement
        </CardTitle>
        <CardDescription>
          Créez un prélèvement ponctuel sur le compte du client
        </CardDescription>
      </CardHeader>
      <CardContent>
        {disabled ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{disabledMessage}</AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>
                  Paiement créé avec succès ! ID: {success.gocardlessPaymentId}
                  <br />
                  Date de prélèvement prévue: {success.chargeDate}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant (EUR) *</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="25.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    required
                    className="pl-8"
                  />
                  <Euro className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chargeDate">Date de prélèvement</Label>
                <Input
                  id="chargeDate"
                  type="date"
                  min={minChargeDateStr}
                  value={formData.chargeDate}
                  onChange={(e) =>
                    setFormData({ ...formData, chargeDate: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Minimum J+3. Si vide, GoCardless choisira la date optimale.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Référence</Label>
              <Input
                id="reference"
                placeholder="FACTURE-2024-001"
                maxLength={140}
                value={formData.reference}
                onChange={(e) =>
                  setFormData({ ...formData, reference: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Apparaîtra sur le relevé bancaire du client (max 140 caractères)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Paiement de la facture janvier 2024"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Création en cours...' : "Créer le paiement"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
