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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useOrganisation } from "@/contexts/organisation-context"
import { useSocietes } from "@/hooks/clients"
import { PSPName, type CreatePaymentIntentDto } from "@/types/payment-intent"

interface PaymentIntentFormProps {
  onSubmit: (data: CreatePaymentIntentDto) => Promise<void>
  loading?: boolean
  scheduleId?: string
}

const pspOptions: PSPName[] = [
  PSPName.GOCARDLESS,
  PSPName.SLIMPAY,
  PSPName.MULTISAFEPAY,
  PSPName.EMERCHANTPAY,
  PSPName.STRIPE,
]

export function PaymentIntentForm({
  onSubmit,
  loading,
  scheduleId,
}: PaymentIntentFormProps) {
  const { activeOrganisation } = useOrganisation()
  const { societes } = useSocietes(activeOrganisation?.organisationId)

  const [formData, setFormData] = useState<CreatePaymentIntentDto>({
    organisationId: "",
    scheduleId: scheduleId || "",
    societeId: "",
    pspName: PSPName.GOCARDLESS,
    amount: 0,
    currency: "EUR",
    idempotencyKey: `key-${Date.now()}`,
  })

  // Mettre à jour l'organisationId quand l'organisation active change
  useEffect(() => {
    if (activeOrganisation?.organisationId) {
      setFormData(prev => ({ ...prev, organisationId: activeOrganisation.organisationId }))
    }
  }, [activeOrganisation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un Payment Intent</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organisationId">Organisation</Label>
              <Input
                id="organisationId"
                value={activeOrganisation?.organisationNom || "Aucune organisation"}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Organisation: {activeOrganisation?.organisationNom || "Non définie"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="societeId">Société</Label>
              <Select
                value={formData.societeId}
                onValueChange={(value) =>
                  setFormData({ ...formData, societeId: value })
                }
                disabled={societes.length === 0}
              >
                <SelectTrigger>
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
              {societes.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Aucune société disponible
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduleId">Schedule ID</Label>
              <Input
                id="scheduleId"
                value={formData.scheduleId}
                onChange={(e) =>
                  setFormData({ ...formData, scheduleId: e.target.value })
                }
                placeholder="schedule-abc"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pspName">PSP</Label>
              <Select
                value={formData.pspName}
                onValueChange={(value) =>
                  setFormData({ ...formData, pspName: value as PSPName })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pspOptions.map((psp) => (
                    <SelectItem key={psp} value={psp}>
                      {psp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Montant (€)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) })
                }
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="idempotencyKey">Clé d&apos;idempotence</Label>
              <Input
                id="idempotencyKey"
                value={formData.idempotencyKey}
                onChange={(e) =>
                  setFormData({ ...formData, idempotencyKey: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Clé unique pour éviter les paiements en double
              </p>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Création..." : "Créer le Payment Intent"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
