"use client"

import * as React from "react"
import { useActionState, useEffect, useRef } from "react"
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SubmitButton } from "@/components/ui/submit-button"
import { NativeFormField, FormError } from "@/components/ui/form-field"
import { toast } from "sonner"
import { useOrganisation } from "@/contexts/organisation-context"
import { createClientAction } from "@/actions/clients"
import { getInitialFormState } from "@/lib/forms/state"
import { STATUTS_CLIENT, DEFAULT_STATUT_CODE } from "@/constants/statuts-client"
import { useSocietes } from "@/hooks/clients"
import { useSocieteStore } from "@/stores/societe-store"
import type { ClientBase } from "@proto/clients/clients"

interface CreateClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateClientDialog({ open, onOpenChange, onSuccess }: CreateClientDialogProps) {
  const { activeOrganisation } = useOrganisation()
  const formRef = useRef<HTMLFormElement>(null)
  const { societes } = useSocietes(activeOrganisation?.organisationId)
  const { activeSocieteId } = useSocieteStore()
  const [selectedSocieteId, setSelectedSocieteId] = React.useState<string>("__none__")

  const [state, formAction] = useActionState(createClientAction, getInitialFormState<ClientBase>())

  useEffect(() => {
    if (open) {
      formRef.current?.reset()
      setSelectedSocieteId(activeSocieteId || "__none__")
    }
  }, [open, activeSocieteId])

  useEffect(() => {
    if (state.success) {
      toast.success("Client cree avec succes")
      formRef.current?.reset()
      onOpenChange(false)
      onSuccess?.()
    }
  }, [state.success, onOpenChange, onSuccess])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouveau client</DialogTitle>
          <DialogDescription>
            Creez un nouveau client en remplissant les informations ci-dessous.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="organisationId" value={activeOrganisation?.organisationId || ""} />
          <input type="hidden" name="societeId" value={selectedSocieteId === "__none__" ? "" : selectedSocieteId} />

          <FormError errors={state.errors?._form} />

          <div className="grid grid-cols-2 gap-4">
            <NativeFormField
              name="typeClient"
              label="Type de client"
              errors={state.errors?.typeClient}
            >
              <Select name="typeClient" defaultValue="particulier">
                <SelectTrigger>
                  <SelectValue placeholder="Selectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="particulier">Particulier</SelectItem>
                  <SelectItem value="entreprise">Entreprise</SelectItem>
                  <SelectItem value="association">Association</SelectItem>
                </SelectContent>
              </Select>
            </NativeFormField>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Societe (optionnel)</label>
              <Select value={selectedSocieteId} onValueChange={setSelectedSocieteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucune societe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Aucune societe</SelectItem>
                  {societes.filter(s => s.id).map((societe) => (
                    <SelectItem key={societe.id} value={societe.id}>
                      {societe.raisonSociale}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.errors?.societeId && (
                <p className="text-sm text-destructive">{state.errors.societeId[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NativeFormField name="nom" label="Nom" errors={state.errors?.nom}>
              <Input placeholder="Nom" required />
            </NativeFormField>

            <NativeFormField name="prenom" label="Prenom" errors={state.errors?.prenom}>
              <Input placeholder="Prenom" required />
            </NativeFormField>
          </div>

          <NativeFormField
            name="dateNaissance"
            label="Date de naissance"
            errors={state.errors?.dateNaissance}
          >
            <Input type="date" />
          </NativeFormField>

          <NativeFormField name="telephone" label="Telephone" errors={state.errors?.telephone}>
            <Input placeholder="Telephone" required />
          </NativeFormField>

          <NativeFormField name="email" label="Email" errors={state.errors?.email}>
            <Input type="email" placeholder="Email" />
          </NativeFormField>

          <NativeFormField name="statutId" label="Statut" errors={state.errors?.statutId}>
            <Select name="statutId" defaultValue={DEFAULT_STATUT_CODE}>
              <SelectTrigger>
                <SelectValue placeholder="Selectionnez un statut" />
              </SelectTrigger>
              <SelectContent>
                {STATUTS_CLIENT.map((statut) => (
                  <SelectItem key={statut.id} value={statut.code}>
                    {statut.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </NativeFormField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <SubmitButton pendingText="Creation...">
              Creer le client
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
