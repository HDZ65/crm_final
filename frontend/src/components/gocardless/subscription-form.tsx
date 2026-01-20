"use client"

import { useState } from "react"
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Euro, RefreshCw } from "lucide-react"
import type { CreateSubscriptionRequest, GocardlessSubscription, IntervalUnit } from "@/types/gocardless"

interface GocardlessSubscriptionFormProps {
  onSubmit: (data: CreateSubscriptionRequest) => Promise<GocardlessSubscription | null>
  loading?: boolean
  disabled?: boolean
  disabledMessage?: string
}

const INTERVAL_LABELS: Record<IntervalUnit, string> = {
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  yearly: "Annuel",
}

const DAY_OPTIONS = Array.from({ length: 28 }, (_, i) => i + 1)

export function GocardlessSubscriptionForm({
  onSubmit,
  loading,
  disabled,
  disabledMessage = "Vous devez configurer un mandat actif avant de créer un abonnement",
}: GocardlessSubscriptionFormProps) {
  const [formData, setFormData] = useState({
    amount: "",
    name: "",
    intervalUnit: "monthly" as IntervalUnit,
    interval: "1",
    dayOfMonth: "1",
    startDate: "",
    endDate: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<GocardlessSubscription | null>(null)

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
        name: formData.name || undefined,
        intervalUnit: formData.intervalUnit,
        interval: parseInt(formData.interval) || 1,
        dayOfMonth: formData.intervalUnit === "monthly" ? parseInt(formData.dayOfMonth) : undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      })

      if (result) {
        setSuccess(result)
        setFormData({
          amount: "",
          name: "",
          intervalUnit: "monthly",
          interval: "1",
          dayOfMonth: "1",
          startDate: "",
          endDate: "",
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création de l'abonnement")
    }
  }

  // Date minimum pour le début (demain)
  const minStartDate = new Date()
  minStartDate.setDate(minStartDate.getDate() + 1)
  const minStartDateStr = minStartDate.toISOString().split("T")[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Créer un abonnement
        </CardTitle>
        <CardDescription>
          Configurez des prélèvements récurrents automatiques
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
                  Abonnement créé avec succès ! ID: {success.gocardlessSubscriptionId}
                  {success.upcomingPayments && success.upcomingPayments.length > 0 && (
                    <>
                      <br />
                      Prochain prélèvement: {success.upcomingPayments[0].chargeDate} -{" "}
                      {(success.upcomingPayments[0].amount / 100).toFixed(2)} EUR
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nom de l&apos;abonnement</Label>
              <Input
                id="name"
                placeholder="Abonnement Premium"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant (EUR) *</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="49.90"
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
                <Label htmlFor="intervalUnit">Fréquence *</Label>
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
                    {Object.entries(INTERVAL_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="interval">Intervalle</Label>
                <Select
                  value={formData.interval}
                  onValueChange={(value) =>
                    setFormData({ ...formData, interval: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 6, 12].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        Tous les {n} {formData.intervalUnit === "weekly" ? "semaine(s)" : formData.intervalUnit === "monthly" ? "mois" : "an(s)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.intervalUnit === "monthly" && (
                <div className="space-y-2">
                  <Label htmlFor="dayOfMonth">Jour du mois</Label>
                  <Select
                    value={formData.dayOfMonth}
                    onValueChange={(value) =>
                      setFormData({ ...formData, dayOfMonth: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_OPTIONS.map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          Le {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Jour 28 max pour éviter les problèmes de fin de mois
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  type="date"
                  min={minStartDateStr}
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Si vide, commence dès que possible
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin (optionnel)</Label>
                <Input
                  id="endDate"
                  type="date"
                  min={formData.startDate || minStartDateStr}
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Laisser vide pour un abonnement sans fin
                </p>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Création en cours...' : "Créer l'abonnement"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
