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
import { createClientAction, getStatutClients } from "@/actions/clients"
import { getInitialFormState } from "@/lib/form-state"
import type { StatutClient } from "@proto-frontend/referentiel/referentiel"
import type { ClientBase } from "@proto-frontend/clients/clients"

interface CreateClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateClientDialog({ open, onOpenChange, onSuccess }: CreateClientDialogProps) {
  const { activeOrganisation } = useOrganisation()
  const formRef = useRef<HTMLFormElement>(null)
  const [statuts, setStatuts] = React.useState<StatutClient[]>([])
  const [statutsLoading, setStatutsLoading] = React.useState(false)

  const [state, formAction] = useActionState(createClientAction, getInitialFormState<ClientBase>())

  // Fetch statuts on mount
  useEffect(() => {
    const fetchStatuts = async () => {
      setStatutsLoading(true)
      const result = await getStatutClients()
      if (result.data?.statuts) {
        setStatuts(result.data.statuts)
      }
      setStatutsLoading(false)
    }
    fetchStatuts()
  }, [])

  // Trouver le statut "actif" par défaut
  const defaultStatutId = React.useMemo(() => {
    return statuts.find(s => s.code === "actif")?.id || ""
  }, [statuts])

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      formRef.current?.reset()
    }
  }, [open])

  // Handle success
  useEffect(() => {
    if (state.success) {
      toast.success("Client créé avec succès")
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
            Créez un nouveau client en remplissant les informations ci-dessous.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          {/* Champs cachés */}
          <input type="hidden" name="organisationId" value={activeOrganisation?.organisationId || ""} />

          {/* Erreurs globales */}
          <FormError errors={state.errors?._form} />

          <NativeFormField
            name="typeClient"
            label="Type de client"
            errors={state.errors?.typeClient}
          >
            <Select name="typeClient" defaultValue="particulier">
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="particulier">Particulier</SelectItem>
                <SelectItem value="entreprise">Entreprise</SelectItem>
                <SelectItem value="association">Association</SelectItem>
              </SelectContent>
            </Select>
          </NativeFormField>

          <div className="grid grid-cols-2 gap-4">
            <NativeFormField name="nom" label="Nom" errors={state.errors?.nom}>
              <Input placeholder="Nom" required />
            </NativeFormField>

            <NativeFormField name="prenom" label="Prénom" errors={state.errors?.prenom}>
              <Input placeholder="Prénom" required />
            </NativeFormField>
          </div>

          <NativeFormField
            name="dateNaissance"
            label="Date de naissance"
            errors={state.errors?.dateNaissance}
          >
            <Input type="date" />
          </NativeFormField>

          <NativeFormField name="telephone" label="Téléphone" errors={state.errors?.telephone}>
            <Input placeholder="Téléphone" required />
          </NativeFormField>

          <NativeFormField name="email" label="Email" errors={state.errors?.email}>
            <Input type="email" placeholder="Email" />
          </NativeFormField>

          <NativeFormField name="statutId" label="Statut" errors={state.errors?.statutId}>
            <Select name="statutId" defaultValue={defaultStatutId} key={defaultStatutId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un statut" />
              </SelectTrigger>
              <SelectContent>
                {statuts.map((statut) => (
                  <SelectItem key={statut.id} value={statut.id}>
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
              disabled={statutsLoading}
            >
              Annuler
            </Button>
            <SubmitButton disabled={statutsLoading} pendingText="Création...">
              Créer le client
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
