"use client"

import * as React from "react"
import { DeselectionReasonDialog } from "@/components/commissions/deselection-reason-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getLignesForValidation,
  preselectionnerLignes,
  recalculerTotaux,
  validerBordereauFinal,
} from "@/actions/commissions"
import {
  StatutLigne,
  StatutBordereau,
  type Bordereau,
  type LigneBordereau,
  type TotauxResponse,
} from "@proto/commission/commission"
import { toast } from "sonner"

interface ValidationPageClientProps {
  organisationId: string | null
  validateurId: string
  initialBordereaux: Bordereau[]
}

const ZERO_TOTALS: TotauxResponse = {
  totalBrut: "0.00",
  totalReprises: "0.00",
  totalAcomptes: "0.00",
  totalNet: "0.00",
  nombreLignesSelectionnees: 0,
}

function formatCurrency(value: string): string {
  const amount = Number(value || 0)
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount)
}

function getStatutBadge(statut: StatutLigne): { label: string; className: string } {
  switch (statut) {
    case StatutLigne.STATUT_LIGNE_SELECTIONNEE:
      return { label: "Selectionnee", className: "bg-emerald-100 text-emerald-800" }
    case StatutLigne.STATUT_LIGNE_DESELECTIONNEE:
      return { label: "Deselectionnee", className: "bg-amber-100 text-amber-800" }
    case StatutLigne.STATUT_LIGNE_VALIDEE:
      return { label: "Validee", className: "bg-blue-100 text-blue-800" }
    case StatutLigne.STATUT_LIGNE_REJETEE:
      return { label: "Rejetee", className: "bg-rose-100 text-rose-800" }
    default:
      return { label: "Inconnu", className: "bg-muted text-muted-foreground" }
  }
}

export function ValidationPageClient({
  organisationId,
  validateurId,
  initialBordereaux,
}: ValidationPageClientProps) {
  const bordereaux = React.useMemo(
    () => initialBordereaux.filter((b) => b.statutBordereau === StatutBordereau.STATUT_BORDEREAU_BROUILLON),
    [initialBordereaux]
  )

  const [selectedBordereauId, setSelectedBordereauId] = React.useState<string>("")
  const [lignes, setLignes] = React.useState<LigneBordereau[]>([])
  const [selectedLigneIds, setSelectedLigneIds] = React.useState<string[]>([])
  const [totaux, setTotaux] = React.useState<TotauxResponse>(ZERO_TOTALS)
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const [deselectionDialogOpen, setDeselectionDialogOpen] = React.useState(false)
  const [pendingDeselection, setPendingDeselection] = React.useState<{ id: string; ref: string } | null>(null)

  const loadValidationData = React.useCallback(async (bordereauId: string) => {
    if (!organisationId || !bordereauId) {
      setLignes([])
      setSelectedLigneIds([])
      setTotaux(ZERO_TOTALS)
      return
    }

    setLoading(true)
    const preselection = await preselectionnerLignes(bordereauId, organisationId)
    const lignesResult = await getLignesForValidation(bordereauId, organisationId)

    if (lignesResult.error || !lignesResult.data) {
      toast.error(lignesResult.error || "Erreur lors du chargement des lignes")
      setLoading(false)
      return
    }

    const allLignes = lignesResult.data.lignes
    const validIds = new Set(allLignes.map((ligne) => ligne.id))
    const preselectedIds = (preselection.data?.ligneIdsSelectionnees || []).filter((id) => validIds.has(id))

    setLignes(allLignes)
    setSelectedLigneIds(preselectedIds)
    setTotaux(lignesResult.data.totaux || ZERO_TOTALS)
    setLoading(false)
  }, [organisationId])

  React.useEffect(() => {
    if (!selectedBordereauId) {
      setLignes([])
      setSelectedLigneIds([])
      setTotaux(ZERO_TOTALS)
      return
    }
    loadValidationData(selectedBordereauId)
  }, [selectedBordereauId, loadValidationData])

  React.useEffect(() => {
    if (!selectedBordereauId) {
      return
    }

    const run = async () => {
      const result = await recalculerTotaux(selectedBordereauId, selectedLigneIds)
      if (!result.error && result.data) {
        setTotaux(result.data)
      }
    }

    run()
  }, [selectedBordereauId, selectedLigneIds])

  const allChecked = lignes.length > 0 && selectedLigneIds.length === lignes.length
  const someChecked = selectedLigneIds.length > 0 && selectedLigneIds.length < lignes.length

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedLigneIds(lignes.map((ligne) => ligne.id))
      return
    }
    setSelectedLigneIds([])
  }

  const toggleRow = (ligne: LigneBordereau, checked: boolean) => {
    if (checked) {
      setSelectedLigneIds((prev) => (prev.includes(ligne.id) ? prev : [...prev, ligne.id]))
      return
    }

    setPendingDeselection({ id: ligne.id, ref: ligne.contratReference })
    setDeselectionDialogOpen(true)
  }

  const handleConfirmDeselection = (_reason: string) => {
    if (!pendingDeselection) return
    setSelectedLigneIds((prev) => prev.filter((id) => id !== pendingDeselection.id))
    setPendingDeselection(null)
  }

  const handleValiderFinal = async () => {
    if (!selectedBordereauId) {
      toast.error("Selectionnez un bordereau")
      return
    }
    if (selectedLigneIds.length === 0) {
      toast.error("Aucune ligne selectionnee")
      return
    }

    setSaving(true)
    const result = await validerBordereauFinal(
      selectedBordereauId,
      validateurId || "adv-validation",
      selectedLigneIds
    )
    setSaving(false)

    if (result.error || !result.data?.success) {
      toast.error(result.error || "Erreur lors de la validation finale")
      return
    }

    toast.success("Bordereau valide avec succes")
    await loadValidationData(selectedBordereauId)
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pb-20">
      <Card>
        <CardHeader>
          <CardTitle>Validation ADV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md">
            <Select value={selectedBordereauId} onValueChange={setSelectedBordereauId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un bordereau" />
              </SelectTrigger>
              <SelectContent>
                {bordereaux.map((bordereau) => (
                  <SelectItem key={bordereau.id} value={bordereau.id}>
                    {bordereau.periode} - {bordereau.apporteurId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allChecked || (someChecked ? "indeterminate" : false)}
                      onCheckedChange={(value) => toggleAll(!!value)}
                      disabled={lignes.length === 0}
                      aria-label="Selectionner toutes les lignes"
                    />
                  </TableHead>
                  <TableHead>Contrat</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Brut</TableHead>
                  <TableHead className="text-right">Reprise</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!selectedBordereauId && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Selectionnez un bordereau pour commencer la validation.
                    </TableCell>
                  </TableRow>
                )}
                {selectedBordereauId && !loading && lignes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Aucune ligne disponible.
                    </TableCell>
                  </TableRow>
                )}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Chargement des lignes...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && lignes.map((ligne) => {
                  const checked = selectedLigneIds.includes(ligne.id)
                  const statut = getStatutBadge(ligne.statutLigne)
                  return (
                    <TableRow key={ligne.id}>
                      <TableCell>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => toggleRow(ligne, !!value)}
                          aria-label={`Selectionner la ligne ${ligne.contratReference}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{ligne.contratReference}</TableCell>
                      <TableCell>{ligne.clientNom || "-"}</TableCell>
                      <TableCell>{ligne.produitNom || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(ligne.montantBrut)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(ligne.montantReprise)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(ligne.montantNet)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statut.className}>
                          {statut.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={!selectedBordereauId || selectedLigneIds.length === 0 || saving}>
                Valider le bordereau
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la validation finale</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action verrouille le bordereau et valide {selectedLigneIds.length} ligne(s).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleValiderFinal}>Confirmer</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card className="sticky bottom-0 z-20 border shadow-md">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="text-sm text-muted-foreground">
            {totaux.nombreLignesSelectionnees} ligne(s) selectionnee(s)
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Brut: </span>
              <span className="font-semibold">{formatCurrency(totaux.totalBrut)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Reprises: </span>
              <span className="font-semibold">{formatCurrency(totaux.totalReprises)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Net: </span>
              <span className="font-semibold">{formatCurrency(totaux.totalNet)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <DeselectionReasonDialog
        open={deselectionDialogOpen}
        onOpenChange={setDeselectionDialogOpen}
        onConfirm={handleConfirmDeselection}
        commissionRef={pendingDeselection?.ref || "ligne"}
      />
    </main>
  )
}
