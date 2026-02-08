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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface CreerContestationDialogProps {
  commissionId: string
  bordereauId: string
  apporteurId: string
  trigger?: React.ReactNode
  onSubmit: (payload: {
    commissionId: string
    bordereauId: string
    apporteurId: string
    motif: string
  }) => Promise<void>
}

export function CreerContestationDialog({
  commissionId,
  bordereauId,
  apporteurId,
  trigger,
  onSubmit,
}: CreerContestationDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [motif, setMotif] = React.useState("")
  const [error, setError] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  const handleSubmit = async () => {
    if (!motif.trim()) {
      setError("Le motif est obligatoire")
      return
    }

    setSubmitting(true)
    setError("")
    try {
      await onSubmit({ commissionId, bordereauId, apporteurId, motif: motif.trim() })
      setMotif("")
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la creation")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">Contester</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Créer une contestation</DialogTitle>
          <DialogDescription>
            Le motif est obligatoire. Le dossier sera placé en statut contestée.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="contestation-motif">Motif *</Label>
          <Textarea
            id="contestation-motif"
            value={motif}
            onChange={(e) => {
              setMotif(e.target.value)
              setError("")
            }}
            placeholder="Expliquer la raison de la contestation..."
            rows={5}
            className={error ? "border-destructive" : ""}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

         <DialogFooter>
           <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
             Annuler
           </Button>
           <Button onClick={handleSubmit} disabled={submitting}>
             Créer la contestation
           </Button>
         </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
