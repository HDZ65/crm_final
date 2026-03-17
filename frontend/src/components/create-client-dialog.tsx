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
import { DatePicker } from "@/components/ui/date-picker"
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nouveau client</DialogTitle>
          <DialogDescription>
            Creez un nouveau client en remplissant les informations ci-dessous.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction}>
          <input type="hidden" name="organisationId" value={activeOrganisation?.organisationId || ""} />
          <input type="hidden" name="societeId" value={selectedSocieteId === "__none__" ? "" : selectedSocieteId} />

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <FormError errors={state.errors?._form} />

            <div className="grid grid-cols-1 gap-4">
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
              <DatePicker name="dateNaissance" placeholder="Sélectionnez une date" />
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

            {/* Identite & Compliance */}
            <div className="border-t pt-4 mt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identite & Compliance</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <NativeFormField name="civilite" label="Civilite" errors={state.errors?.civilite}>
                <Select name="civilite">
                  <SelectTrigger>
                    <SelectValue placeholder="Civilite" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M.">M.</SelectItem>
                    <SelectItem value="Mme">Mme</SelectItem>
                    <SelectItem value="Dr">Dr</SelectItem>
                    <SelectItem value="Me">Me</SelectItem>
                    <SelectItem value="Pr">Pr</SelectItem>
                  </SelectContent>
                </Select>
              </NativeFormField>

              <NativeFormField name="csp" label="CSP" errors={state.errors?.csp}>
                <Input placeholder="Cat. socioprofessionnelle" />
              </NativeFormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <NativeFormField name="lieuNaissance" label="Lieu de naissance" errors={state.errors?.lieuNaissance}>
                <Input placeholder="Ville de naissance" />
              </NativeFormField>

              <NativeFormField name="paysNaissance" label="Pays de naissance" errors={state.errors?.paysNaissance}>
                <Input placeholder="Pays" />
              </NativeFormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <NativeFormField name="regimeSocial" label="Regime social" errors={state.errors?.regimeSocial}>
                <Input placeholder="Regime social" />
              </NativeFormField>

              <NativeFormField name="numss" label="N° Securite sociale" errors={state.errors?.numss}>
                <Input placeholder="N° SS" />
              </NativeFormField>
            </div>

            {/* Acquisition */}
            <div className="border-t pt-4 mt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acquisition</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <NativeFormField name="canalAcquisition" label="Canal d'acquisition" errors={state.errors?.canalAcquisition}>
                <Select name="canalAcquisition">
                  <SelectTrigger>
                    <SelectValue placeholder="Canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRM">CRM</SelectItem>
                    <SelectItem value="WinLeadPlus">WinLeadPlus</SelectItem>
                    <SelectItem value="API">API</SelectItem>
                    <SelectItem value="Import">Import</SelectItem>
                    <SelectItem value="Telephone">Telephone</SelectItem>
                    <SelectItem value="Site web">Site web</SelectItem>
                    <SelectItem value="Partenaire">Partenaire</SelectItem>
                  </SelectContent>
                </Select>
              </NativeFormField>

              <NativeFormField name="source" label="Source" errors={state.errors?.source}>
                <Select name="source">
                  <SelectTrigger>
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRM">CRM</SelectItem>
                    <SelectItem value="WinLeadPlus">WinLeadPlus</SelectItem>
                    <SelectItem value="API">API</SelectItem>
                    <SelectItem value="Import">Import</SelectItem>
                    <SelectItem value="Telephone">Telephone</SelectItem>
                    <SelectItem value="Site web">Site web</SelectItem>
                    <SelectItem value="Partenaire">Partenaire</SelectItem>
                  </SelectContent>
                </Select>
              </NativeFormField>
            </div>
          </div>

          <DialogFooter className="pt-4">
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
