"use client"

import * as React from "react"
import { Pencil, Plus, ToggleLeft, ToggleRight } from "lucide-react"
import { toast } from "sonner"

import type { DebitLot } from "@/lib/ui/display-types/payment"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LotsEmptyState } from "@/components/payments/empty-states"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LotManagementProps {
  societeId: string
}

interface LotFormData {
  name: string
  startDay: number
  endDay: number
  description: string
}

const INITIAL_FORM_DATA: LotFormData = {
  name: "",
  startDay: 1,
  endDay: 7,
  description: "",
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return !(aEnd < bStart || aStart > bEnd)
}

function findOverlappingLot(
  lots: DebitLot[],
  startDay: number,
  endDay: number,
  excludeId?: string,
): DebitLot | undefined {
  return lots.find(
    (lot) =>
      lot.isActive &&
      lot.id !== excludeId &&
      rangesOverlap(startDay, endDay, lot.startDay, lot.endDay),
  )
}

// ---------------------------------------------------------------------------
// Lot Form Dialog
// ---------------------------------------------------------------------------

function LotFormDialog({
  open,
  onOpenChange,
  editingLot,
  lots,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingLot: DebitLot | null
  lots: DebitLot[]
  onSave: (data: LotFormData, editId?: string) => void
}) {
  const [formData, setFormData] = React.useState<LotFormData>(INITIAL_FORM_DATA)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (open) {
      if (editingLot) {
        setFormData({
          name: editingLot.name,
          startDay: editingLot.startDay,
          endDay: editingLot.endDay,
          description: "",
        })
      } else {
        setFormData(INITIAL_FORM_DATA)
      }
      setErrors({})
    }
  }, [open, editingLot])

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Le nom est requis"
    }

    if (formData.startDay < 1 || formData.startDay > 28) {
      newErrors.startDay = "Le jour doit être entre 1 et 28"
    }

    if (formData.endDay < 1 || formData.endDay > 28) {
      newErrors.endDay = "Le jour doit être entre 1 et 28"
    }

    if (formData.startDay > formData.endDay) {
      newErrors.startDay = "Le jour de début doit être ≤ au jour de fin"
    }

    const overlapping = findOverlappingLot(
      lots,
      formData.startDay,
      formData.endDay,
      editingLot?.id,
    )
    if (overlapping) {
      newErrors.overlap = `Ce lot chevauche un lot existant : ${overlapping.name}`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSave(formData, editingLot?.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingLot ? "Modifier le lot" : "Créer un lot"}
          </DialogTitle>
          <DialogDescription>
            {editingLot
              ? "Modifiez les informations du lot de prélèvement."
              : "Configurez un nouveau lot de prélèvement avec sa période."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Nom */}
          <div className="grid gap-2">
            <Label htmlFor="lot-name">Nom</Label>
            <Input
              id="lot-name"
              placeholder="Ex: Lot début de mois"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name}</p>
            )}
          </div>

          {/* Jours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="lot-start-day">Jour début</Label>
              <Input
                id="lot-start-day"
                type="number"
                min={1}
                max={28}
                value={formData.startDay}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDay: Number(e.target.value),
                  }))
                }
                aria-invalid={!!errors.startDay}
              />
              {errors.startDay && (
                <p className="text-destructive text-sm">{errors.startDay}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lot-end-day">Jour fin</Label>
              <Input
                id="lot-end-day"
                type="number"
                min={1}
                max={28}
                value={formData.endDay}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    endDay: Number(e.target.value),
                  }))
                }
                aria-invalid={!!errors.endDay}
              />
              {errors.endDay && (
                <p className="text-destructive text-sm">{errors.endDay}</p>
              )}
            </div>
          </div>

          {/* Overlap error */}
          {errors.overlap && (
            <p className="text-destructive text-sm">{errors.overlap}</p>
          )}

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="lot-description">
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optionnel)
              </span>
            </Label>
            <Textarea
              id="lot-description"
              placeholder="Description du lot…"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="min-h-20 resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit">
              {editingLot ? "Enregistrer" : "Créer le lot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Deactivate Confirmation Dialog
// ---------------------------------------------------------------------------

function DeactivateDialog({
  lot,
  onOpenChange,
  onConfirm,
}: {
  lot: DebitLot | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={!!lot} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Désactiver le lot {lot?.name} ?</AlertDialogTitle>
          <AlertDialogDescription>
            Le lot sera désactivé et ne sera plus utilisé pour les futurs
            prélèvements. Les prélèvements déjà planifiés ne seront pas
            affectés.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Désactiver
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function LotManagement({ societeId }: LotManagementProps) {
  const [lots, setLots] = React.useState<DebitLot[]>([])
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [editingLot, setEditingLot] = React.useState<DebitLot | null>(null)
  const [deactivatingLot, setDeactivatingLot] =
    React.useState<DebitLot | null>(null)

  // Stub: In the future, fetch lots from gRPC backend using societeId
  // React.useEffect(() => { fetchLots(societeId) }, [societeId])

  function handleSave(data: LotFormData, editId?: string) {
    if (editId) {
      // Update existing lot
      setLots((prev) =>
        prev.map((lot) =>
          lot.id === editId
            ? { ...lot, name: data.name, startDay: data.startDay, endDay: data.endDay }
            : lot,
        ),
      )
      setEditingLot(null)
      toast.success("Lot modifié avec succès")
    } else {
      // Create new lot
      const newLot: DebitLot = {
        id: crypto.randomUUID(),
        name: data.name,
        startDay: data.startDay,
        endDay: data.endDay,
        isActive: true,
        displayOrder: lots.length + 1,
      }
      setLots((prev) => [...prev, newLot])
      setShowCreateDialog(false)
      toast.success("Lot créé avec succès")
    }
  }

  function handleDeactivate() {
    if (!deactivatingLot) return
    setLots((prev) =>
      prev.map((lot) =>
        lot.id === deactivatingLot.id ? { ...lot, isActive: false } : lot,
      ),
    )
    toast.success(`Lot "${deactivatingLot.name}" désactivé`)
    setDeactivatingLot(null)
  }

  function handleReactivate(lotId: string) {
    setLots((prev) =>
      prev.map((lot) =>
        lot.id === lotId ? { ...lot, isActive: true } : lot,
      ),
    )
    const lot = lots.find((l) => l.id === lotId)
    if (lot) {
      toast.success(`Lot "${lot.name}" réactivé`)
    }
  }

  // Empty state
  if (lots.length === 0 && !isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Lots de prélèvement
            </h2>
            <p className="text-muted-foreground text-sm">
              Organisez vos prélèvements par période du mois.
            </p>
          </div>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="size-4" />
            Créer un lot
          </Button>
        </div>

        <LotsEmptyState onCreateLot={() => setShowCreateDialog(true)} />

        <LotFormDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          editingLot={null}
          lots={lots}
          onSave={handleSave}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Lots de prélèvement
          </h2>
          <p className="text-muted-foreground text-sm">
            Organisez vos prélèvements par période du mois.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="size-4" />
          Créer un lot
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Jours</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lots.map((lot) => (
              <TableRow key={lot.id}>
                <TableCell className="font-medium">{lot.name}</TableCell>
                <TableCell>
                  <span className="text-muted-foreground tabular-nums">
                    {lot.startDay} → {lot.endDay}
                  </span>
                </TableCell>
                <TableCell>
                  {lot.isActive ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:text-emerald-400">
                      Actif
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-muted-foreground">
                      Inactif
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditingLot(lot)}
                      title="Modifier"
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">Modifier</span>
                    </Button>
                    {lot.isActive ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeactivatingLot(lot)}
                        title="Désactiver"
                      >
                        <ToggleRight className="size-4" />
                        <span className="sr-only">Désactiver</span>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleReactivate(lot.id)}
                        title="Réactiver"
                      >
                        <ToggleLeft className="size-4" />
                        <span className="sr-only">Réactiver</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <LotFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        editingLot={null}
        lots={lots}
        onSave={handleSave}
      />

      {/* Edit Dialog */}
      <LotFormDialog
        open={!!editingLot}
        onOpenChange={(open) => {
          if (!open) setEditingLot(null)
        }}
        editingLot={editingLot}
        lots={lots}
        onSave={handleSave}
      />

      {/* Deactivate Confirmation */}
      <DeactivateDialog
        lot={deactivatingLot}
        onOpenChange={(open) => {
          if (!open) setDeactivatingLot(null)
        }}
        onConfirm={handleDeactivate}
      />
    </div>
  )
}
