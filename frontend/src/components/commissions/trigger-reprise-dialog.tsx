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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useDeclencherReprise } from "@/hooks"
import { useOrganisation } from "@/contexts/organisation-context"
import type { TypeReprise, RepriseCommissionResponseDto } from "@/types/commission"
import type { TypeOption } from "@/hooks/commissions/use-commission-config"

interface TriggerRepriseDialogProps {
  trigger?: React.ReactNode
  commissionId?: string
  commissionRef?: string
  typesReprise: TypeOption[]
  loadingConfig?: boolean
  onSuccess?: (reprise: RepriseCommissionResponseDto) => void
}

export function TriggerRepriseDialog({
  trigger,
  commissionId: initialCommissionId,
  commissionRef,
  typesReprise,
  loadingConfig,
  onSuccess,
}: TriggerRepriseDialogProps) {
  const { activeOrganisation } = useOrganisation()
  const { reprise, loading, error, declencher, reset } = useDeclencherReprise()

  const [open, setOpen] = React.useState(false)
  const [formData, setFormData] = React.useState({
    commissionId: initialCommissionId || "",
    typeReprise: "" as TypeReprise | "",
    motif: "",
    commentaire: "",
  })
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({})

  // Helper pour obtenir le label et la description d'un type
  const getTypeInfo = React.useCallback((value: string) => {
    const type = typesReprise.find((t) => t.value === value)
    return {
      label: type?.label || value,
      description: type?.description || "",
    }
  }, [typesReprise])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      reset()
      setFormData({
        commissionId: initialCommissionId || "",
        typeReprise: "",
        motif: "",
        commentaire: "",
      })
      setFormErrors({})
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.commissionId.trim()) {
      errors.commissionId = "L'ID de commission est requis"
    }
    if (!formData.typeReprise) {
      errors.typeReprise = "Le type de reprise est requis"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm() || !activeOrganisation) return

    const result = await declencher({
      organisationId: activeOrganisation.organisationId,
      commissionId: formData.commissionId,
      typeReprise: formData.typeReprise as TypeReprise,
      motif: formData.motif || undefined,
      commentaire: formData.commentaire || undefined,
    })

    if (result) {
      onSuccess?.(result)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <RotateCcw className="size-4" />
            Déclencher une reprise
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="size-5" />
            Déclencher une reprise
          </DialogTitle>
          <DialogDescription>
            {commissionRef
              ? `Créer une reprise pour la commission ${commissionRef}`
              : "Créer une nouvelle reprise de commission"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* ID Commission */}
          {!initialCommissionId && (
            <div className="space-y-2">
              <Label htmlFor="commissionId">ID de la commission *</Label>
              <Input
                id="commissionId"
                placeholder="Ex: comm-xxxx-xxxx"
                value={formData.commissionId}
                onChange={(e) => setFormData({ ...formData, commissionId: e.target.value })}
                className={formErrors.commissionId ? "border-destructive" : ""}
              />
              {formErrors.commissionId && (
                <p className="text-xs text-destructive">{formErrors.commissionId}</p>
              )}
            </div>
          )}

          {/* Type de reprise */}
          <div className="space-y-2">
            <Label htmlFor="typeReprise">Type de reprise *</Label>
            <Select
              value={formData.typeReprise}
              onValueChange={(value) => setFormData({ ...formData, typeReprise: value as TypeReprise })}
              disabled={loadingConfig}
            >
              <SelectTrigger id="typeReprise" className={formErrors.typeReprise ? "border-destructive" : ""}>
                <SelectValue placeholder={loadingConfig ? "Chargement..." : "Sélectionner un type"} />
              </SelectTrigger>
              <SelectContent>
                {typesReprise.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.typeReprise && (
              <p className="text-xs text-destructive">{formErrors.typeReprise}</p>
            )}
            {formData.typeReprise && (
              <p className="text-xs text-muted-foreground">
                {getTypeInfo(formData.typeReprise).description}
              </p>
            )}
          </div>

          {/* Motif */}
          <div className="space-y-2">
            <Label htmlFor="motif">Motif</Label>
            <Input
              id="motif"
              placeholder="Motif court de la reprise"
              value={formData.motif}
              onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
            />
          </div>

          {/* Commentaire */}
          <div className="space-y-2">
            <Label htmlFor="commentaire">Commentaire</Label>
            <Textarea
              id="commentaire"
              placeholder="Commentaire détaillé (optionnel)"
              value={formData.commentaire}
              onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
              rows={3}
            />
          </div>

          {/* Résultat */}
          {reprise && (
            <>
              <Separator />
              <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                <div className="flex items-center gap-2 text-success mb-2">
                  <CheckCircle2 className="size-4" />
                  <span className="font-medium">Reprise créée avec succès</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Référence:</span>
                    <p className="font-mono">{reprise.reference}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Montant:</span>
                    <p className="font-medium text-destructive">
                      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(reprise.montantReprise)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Statut:</span>
                    <p>
                      <Badge variant="outline">{reprise.statutReprise}</Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Application:</span>
                    <p>{reprise.periodeApplication}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Erreur */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-4" />
                <span className="font-medium">Erreur</span>
              </div>
              <p className="mt-1 text-sm text-destructive">{error.message}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {reprise ? "Fermer" : "Annuler"}
          </Button>
          {!reprise && (
            <Button onClick={handleSubmit} disabled={loading} variant="destructive">
              Déclencher la reprise
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
