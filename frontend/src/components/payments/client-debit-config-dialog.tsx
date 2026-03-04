"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { DebitLot } from "@/lib/ui/display-types/payment"

interface ClientDebitConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
  currentLotId?: string
}

export function ClientDebitConfigDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  currentLotId,
}: ClientDebitConfigDialogProps) {
  const [selectedLotId, setSelectedLotId] = React.useState(currentLotId ?? "")
  const [lots] = React.useState<DebitLot[]>([])

  // Reset state when dialog opens with new data
  React.useEffect(() => {
    if (open) {
      setSelectedLotId(currentLotId ?? "")
    }
  }, [open, currentLotId])

  function handleSave() {
    // Stub — no real gRPC call yet
    void clientId
    toast.success("Configuration mise à jour")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Configuration du prélèvement — {clientName}
          </DialogTitle>
          <DialogDescription>
            Modifier le lot de prélèvement pour ce client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Lot de prélèvement
            </label>
            {lots.length > 0 ? (
              <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un lot" />
                </SelectTrigger>
                <SelectContent>
                  {lots.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.name} (J{lot.startDay}–J{lot.endDay})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="rounded-md border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
                Aucun lot disponible
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
