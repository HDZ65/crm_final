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
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"

interface DeselectionReasonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
  commissionRef: string
}

export function DeselectionReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  commissionRef,
}: DeselectionReasonDialogProps) {
  const [reason, setReason] = React.useState("")
  const [error, setError] = React.useState("")

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError("Le motif est obligatoire pour décocher une ligne présélectionnée")
      return
    }
    if (reason.trim().length < 10) {
      setError("Le motif doit contenir au moins 10 caractères")
      return
    }
    onConfirm(reason)
    setReason("")
    setError("")
    onOpenChange(false)
  }

  const handleCancel = () => {
    setReason("")
    setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-warning" />
            Motif de désélection
          </DialogTitle>
          <DialogDescription>
            Vous êtes sur le point de décocher la commission <strong>{commissionRef}</strong>.
            <br />
            Veuillez indiquer le motif de cette désélection (traçabilité ADV obligatoire).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Motif de désélection *</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Dossier en cours de vérification, contrat contesté, erreur de calcul..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError("")
              }}
              rows={4}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">
              Minimum 10 caractères. Ce motif sera enregistré dans le journal d&apos;audit.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Annuler
          </Button>
          <Button onClick={handleConfirm}>Confirmer la désélection</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
