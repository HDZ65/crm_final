"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calculator, CheckCircle2, AlertTriangle, Info } from "lucide-react"
import { useCalculerCommission, useApporteurs } from "@/hooks"
import { useOrganisation } from "@/contexts/organisation-context"
import type { TypeProduit, CalculerCommissionResponse } from "@/lib/ui/display-types/commission"
import type { TypeOption } from "@/hooks/commissions/use-commission-config"
import { formatMontant } from "@/lib/ui/helpers/format"

interface CalculateCommissionDialogProps {
  trigger?: React.ReactNode
  typesProduit: TypeOption[]
  loadingConfig?: boolean
}

export function CalculateCommissionDialog({
  trigger,
  typesProduit,
  loadingConfig,
}: CalculateCommissionDialogProps) {
  const { activeOrganisation } = useOrganisation()
  const { apporteurs, loading: loadingApporteurs } = useApporteurs(
    activeOrganisation ? { organisationId: activeOrganisation.organisationId } : undefined
  )
  const { result, loading, error, calculer, reset } = useCalculerCommission()

  const [open, setOpen] = React.useState(false)
  const [formData, setFormData] = React.useState({
    contratId: "",
    apporteurId: "",
    periode: new Date().toISOString().slice(0, 7), // YYYY-MM
    montantBase: "",
    typeProduit: "" as TypeProduit | "",
  })

  // Helper pour obtenir le label d'un type produit
  const getTypeProduitLabel = React.useCallback((value: string): string => {
    const type = typesProduit.find((t) => t.value === value)
    return type?.label || value
  }, [typesProduit])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      reset()
      setFormData({
        contratId: "",
        apporteurId: "",
        periode: new Date().toISOString().slice(0, 7),
        montantBase: "",
        typeProduit: "",
      })
    }
  }

  const handleCalculate = async () => {
    if (!activeOrganisation) return

    await calculer({
      organisationId: activeOrganisation.organisationId,
      contratId: formData.contratId,
      apporteurId: formData.apporteurId,
      periode: formData.periode,
      montantBase: formData.montantBase || "0",
      typeProduit: formData.typeProduit || "",
      profilRemuneration: "",
    })
  }

  const isFormValid =
    formData.contratId.trim() !== "" &&
    formData.apporteurId !== "" &&
    formData.periode !== "" &&
    formData.montantBase !== "" &&
    parseFloat(formData.montantBase) > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Calculator className="size-4" />
            Tester un calcul
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="size-5" />
            Simuler un calcul de commission
          </DialogTitle>
          <DialogDescription>
            Testez le calcul d&apos;une commission pour vérifier le barème applicable et les primes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Formulaire de saisie */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contratId">ID Contrat *</Label>
              <Input
                id="contratId"
                placeholder="Ex: CTR-2024-001"
                value={formData.contratId}
                onChange={(e) => setFormData({ ...formData, contratId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apporteurId">Apporteur *</Label>
              <Select
                value={formData.apporteurId}
                onValueChange={(value) => setFormData({ ...formData, apporteurId: value })}
                disabled={loadingApporteurs}
              >
                <SelectTrigger id="apporteurId">
                  <SelectValue placeholder={loadingApporteurs ? "Chargement..." : "Sélectionner"} />
                </SelectTrigger>
                <SelectContent>
                  {apporteurs.map((apporteur) => (
                    <SelectItem key={apporteur.id} value={apporteur.id}>
                      {apporteur.prenom} {apporteur.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periode">Période *</Label>
              <Input
                id="periode"
                type="month"
                value={formData.periode}
                onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="montantBase">Montant base (€) *</Label>
              <Input
                id="montantBase"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 150.00"
                value={formData.montantBase}
                onChange={(e) => setFormData({ ...formData, montantBase: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="typeProduit">Type de produit (optionnel)</Label>
              <Select
                value={formData.typeProduit || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, typeProduit: value === "none" ? "" : (value as TypeProduit) })
                }
                disabled={loadingConfig}
              >
                <SelectTrigger id="typeProduit">
                  <SelectValue placeholder={loadingConfig ? "Chargement..." : "Tous les produits"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tous les produits</SelectItem>
                  {typesProduit.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Résultat du calcul */}
          {result && <CalculationResult result={result} getTypeProduitLabel={getTypeProduitLabel} />}

          {/* Erreur */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-4" />
                <span className="font-medium">Erreur de calcul</span>
              </div>
              <p className="mt-1 text-sm text-destructive">{error.message}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Fermer
          </Button>
          <Button onClick={handleCalculate} disabled={!isFormValid || loading}>
            Calculer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface CalculationResultProps {
  result: CalculerCommissionResponse
  getTypeProduitLabel: (value: string) => string
}

function CalculationResult({ result, getTypeProduitLabel }: CalculationResultProps) {
  if (result.erreur) {
    return (
      <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
        <div className="flex items-center gap-2 text-warning">
          <AlertTriangle className="size-4" />
          <span className="font-medium">Avertissement</span>
        </div>
        <p className="mt-1 text-sm">{result.erreur}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Separator />

      <div className="flex items-center gap-2 text-success">
        <CheckCircle2 className="size-4" />
        <span className="font-medium">Calcul effectué avec succès</span>
      </div>

      {/* Barème appliqué */}
      {result.bareme && (
        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Info className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Barème appliqué</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Code:</span>{" "}
              <Badge variant="outline">{result.bareme.code}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Nom:</span> {result.bareme.nom}
            </div>
            <div>
              <span className="text-muted-foreground">Type:</span> {result.bareme.typeCalcul}
            </div>
            <div>
              <span className="text-muted-foreground">Base:</span> {result.bareme.baseCalcul}
            </div>
            {result.bareme.tauxPourcentage && (
              <div>
                <span className="text-muted-foreground">Taux:</span> {result.bareme.tauxPourcentage}%
              </div>
            )}
            {result.bareme.montantFixe && (
              <div>
                <span className="text-muted-foreground">Montant fixe:</span>{" "}
                {formatMontant(result.bareme.montantFixe)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Commission calculée */}
      {result.commission && (
        <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Commission calculée</span>
            <span className="text-2xl font-bold text-success">
              {formatMontant(result.commission.montantBrut)}
            </span>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Référence: {result.commission.reference}
          </div>
        </div>
      )}

      {/* Primes applicables */}
      {result.primes && result.primes.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium">Primes et bonus applicables</span>
          <div className="space-y-1">
            {result.primes.map((prime) => (
              <div
                key={prime.id}
                className="flex justify-between items-center p-2 bg-info/10 border border-info/20 rounded"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{prime.nom}</span>
                  <span className="text-xs text-muted-foreground">
                    Palier: {prime.seuilMin} - {prime.seuilMax || "∞"}
                  </span>
                </div>
                <Badge className="bg-info text-info-foreground">
                  +{formatMontant(prime.montantPrime)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
