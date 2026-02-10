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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface ResoudreContestationDialogProps {
  contestationId: string
  trigger?: React.ReactNode
  onSubmit: (payload: {
    id: string
    acceptee: boolean
    commentaire: string
  }) => Promise<void>
}

export function ResoudreContestationDialog({ contestationId, trigger, onSubmit }: ResoudreContestationDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [decision, setDecision] = React.useState<"acceptee" | "rejetee">("rejetee")
  const [commentaire, setCommentaire] = React.useState("")
  const [error, setError] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  const handleSubmit = async () => {
    if (!commentaire.trim()) {
      setError("Le commentaire est obligatoire")
      return
    }

    setSubmitting(true)
    setError("")
    try {
      await onSubmit({
        id: contestationId,
        acceptee: decision === "acceptee",
        commentaire: commentaire.trim(),
      })
      setCommentaire("")
      setDecision("rejetee")
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la resolution")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">Resoudre</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Resoudre la contestation</DialogTitle>
          <DialogDescription>
            Le commentaire est obligatoire pour accepter ou rejeter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Decision</Label>
            <RadioGroup value={decision} onValueChange={(value) => setDecision(value as "acceptee" | "rejetee") }>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="acceptee" id="decision-acceptee" />
                <Label htmlFor="decision-acceptee">Accepter (avec regularisation)</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="rejetee" id="decision-rejetee" />
                <Label htmlFor="decision-rejetee">Rejeter</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution-commentaire">Commentaire *</Label>
            <Textarea
              id="resolution-commentaire"
              value={commentaire}
              onChange={(e) => {
                setCommentaire(e.target.value)
                setError("")
              }}
              rows={5}
              className={error ? "border-destructive" : ""}
              placeholder="Preciser la justification de la decision..."
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            Valider la resolution
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
