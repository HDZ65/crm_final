"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { updateClient } from "@/actions/clients"
import { STATUTS_CLIENT, type StatutClient } from "@/constants/statuts-client"
import { useSocietes } from "@/hooks/clients"
import { useOrganisation } from "@/contexts/organisation-context"

const editClientSchema = z.object({
  typeClient: z.string().min(1, "Le type de client est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  dateNaissance: z.string()
    .refine(val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), "Date au format YYYY-MM-DD requise")
    .optional(),
  telephone: z.string().min(1, "Le téléphone est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  statutId: z.string().min(1, "Le statut est requis"),
  societeId: z.string().optional(),
  civilite: z.string().optional(),
  csp: z.string().max(100).optional(),
  lieuNaissance: z.string().max(100).optional(),
  paysNaissance: z.string().max(100).optional(),
  regimeSocial: z.string().max(100).optional(),
  numss: z.string().max(20).optional(),
  canalAcquisition: z.string().max(100).optional(),
  source: z.string().max(50).optional(),
  iban: z.string().regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/, "IBAN invalide").optional().or(z.literal("")),
  bic: z.string().regex(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "BIC invalide").optional().or(z.literal("")),
})

type EditClientFormValues = z.infer<typeof editClientSchema>

interface UpdateClientDto {
  typeClient: string
  nom: string
  prenom: string
  dateNaissance?: string | null
  telephone: string
  email?: string
  statut?: string
}

interface EditClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: {
    id: string
    name: string
    email?: string
    phone?: string
    typeClient?: string
    statutId?: string
    dateNaissance?: string
    societeId?: string
    civilite?: string
    csp?: string
    lieuNaissance?: string
    paysNaissance?: string
    regimeSocial?: string
    numss?: string
    canalAcquisition?: string
    source?: string
    iban?: string
    bic?: string
  }
  onSuccess?: () => void
}

export function EditClientDialog({ open, onOpenChange, client, onSuccess }: EditClientDialogProps) {
  const nameParts = client.name.split(" ")
  const defaultNom = nameParts[0] || ""
  const defaultPrenom = nameParts.slice(1).join(" ") || ""

  const [loading, setLoading] = React.useState(false)
  const statuts = STATUTS_CLIENT
  const { activeOrganisation } = useOrganisation()
  const { societes } = useSocietes(activeOrganisation?.organisationId)

  const getCode = (id: string) => {
    const statut = statuts.find((s) => s.id === id)
    return statut?.code || ""
  }

  const form = useForm<EditClientFormValues>({
    resolver: zodResolver(editClientSchema),
    defaultValues: {
      typeClient: client.typeClient || "particulier",
      nom: defaultNom,
      prenom: defaultPrenom,
      dateNaissance: client.dateNaissance || "",
      telephone: client.phone || "",
      email: client.email || "",
      statutId: client.statutId || "",
      societeId: client.societeId || "",
      civilite: client.civilite || "",
      csp: client.csp || "",
      lieuNaissance: client.lieuNaissance || "",
      paysNaissance: client.paysNaissance || "",
      regimeSocial: client.regimeSocial || "",
      numss: client.numss || "",
      canalAcquisition: client.canalAcquisition || "",
      source: client.source || "",
      iban: client.iban || "",
      bic: client.bic || "",
    },
  })

  React.useEffect(() => {
    if (open) {
      const nameParts = client.name.split(" ")
      form.reset({
        typeClient: client.typeClient || "particulier",
        nom: nameParts[0] || "",
        prenom: nameParts.slice(1).join(" ") || "",
        dateNaissance: client.dateNaissance || "",
        telephone: client.phone || "",
        email: client.email || "",
        statutId: client.statutId || statuts.find(s => s.code === "actif")?.id || "",
        societeId: client.societeId || "",
        civilite: client.civilite || "",
        csp: client.csp || "",
        lieuNaissance: client.lieuNaissance || "",
        paysNaissance: client.paysNaissance || "",
        regimeSocial: client.regimeSocial || "",
        numss: client.numss || "",
        canalAcquisition: client.canalAcquisition || "",
        source: client.source || "",
        iban: client.iban || "",
        bic: client.bic || "",
      })
    }
  }, [open, client, form, statuts])

  const onSubmit = async (data: EditClientFormValues) => {
    setLoading(true)

    const payload = {
      id: client.id,
      typeClient: data.typeClient,
      nom: data.nom,
      prenom: data.prenom,
      dateNaissance: data.dateNaissance || undefined,
      telephone: data.telephone,
      email: data.email || undefined,
      statut: data.statutId ? getCode(data.statutId) : undefined,
      societeId: data.societeId || null,
      civilite: data.civilite || undefined,
      csp: data.csp || undefined,
      lieuNaissance: data.lieuNaissance || undefined,
      paysNaissance: data.paysNaissance || undefined,
      regimeSocial: data.regimeSocial || undefined,
      numss: data.numss || undefined,
      canalAcquisition: data.canalAcquisition || undefined,
      source: data.source || undefined,
      iban: data.iban || undefined,
      bic: data.bic || undefined,
    }
    const result = await updateClient(payload)

    setLoading(false)

    if (result.error) {
      toast.error("Erreur lors de la modification du client", {
        description: result.error,
      })
    } else {
      toast.success("Client modifie avec succes")
      onOpenChange(false)
      onSuccess?.()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Modifier le client</DialogTitle>
          <DialogDescription>
            Modifiez les informations du client ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <FormField
                control={form.control}
                name="typeClient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de client</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectionnez un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="particulier">Particulier</SelectItem>
                        <SelectItem value="entreprise">Entreprise</SelectItem>
                        <SelectItem value="association">Association</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prenom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prenom</FormLabel>
                      <FormControl>
                        <Input placeholder="Prenom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="dateNaissance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de naissance</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telephone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telephone</FormLabel>
                    <FormControl>
                      <Input placeholder="Telephone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="statutId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectionnez un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuts.map((statut) => (
                          <SelectItem key={statut.id} value={statut.id}>
                            {statut.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="societeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Societe (optionnel)</FormLabel>
                    <Select onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)} value={field.value || "__none__"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Aucune societe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Aucune societe</SelectItem>
                        {societes.filter(s => s.id).map((societe) => (
                          <SelectItem key={societe.id} value={societe.id}>
                            {societe.raisonSociale}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Identite & Compliance */}
              <div className="border-t pt-4 mt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identite & Compliance</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="civilite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Civilite</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)} value={field.value || "__none__"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Civilite" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">Non renseigne</SelectItem>
                          <SelectItem value="M.">M.</SelectItem>
                          <SelectItem value="Mme">Mme</SelectItem>
                          <SelectItem value="Dr">Dr</SelectItem>
                          <SelectItem value="Me">Me</SelectItem>
                          <SelectItem value="Pr">Pr</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="csp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CSP</FormLabel>
                      <FormControl>
                        <Input placeholder="Cat. socioprofessionnelle" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lieuNaissance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lieu de naissance</FormLabel>
                      <FormControl>
                        <Input placeholder="Ville de naissance" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paysNaissance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pays de naissance</FormLabel>
                      <FormControl>
                        <Input placeholder="Pays" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="regimeSocial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regime social</FormLabel>
                      <FormControl>
                        <Input placeholder="Regime social" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numss"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>N° Securite sociale</FormLabel>
                      <FormControl>
                        <Input placeholder="N° SS" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Acquisition */}
              <div className="border-t pt-4 mt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acquisition</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="canalAcquisition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{"Canal d'acquisition"}</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)} value={field.value || "__none__"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Canal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">Non renseigne</SelectItem>
                          <SelectItem value="CRM">CRM</SelectItem>
                          <SelectItem value="WinLeadPlus">WinLeadPlus</SelectItem>
                          <SelectItem value="API">API</SelectItem>
                          <SelectItem value="Import">Import</SelectItem>
                          <SelectItem value="Telephone">Telephone</SelectItem>
                          <SelectItem value="Site web">Site web</SelectItem>
                          <SelectItem value="Partenaire">Partenaire</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)} value={field.value || "__none__"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">Non renseigne</SelectItem>
                          <SelectItem value="CRM">CRM</SelectItem>
                          <SelectItem value="WinLeadPlus">WinLeadPlus</SelectItem>
                          <SelectItem value="API">API</SelectItem>
                          <SelectItem value="Import">Import</SelectItem>
                          <SelectItem value="Telephone">Telephone</SelectItem>
                          <SelectItem value="Site web">Site web</SelectItem>
                          <SelectItem value="Partenaire">Partenaire</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Informations bancaires */}
              <div className="border-t pt-4 mt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Informations bancaires</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="iban"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IBAN</FormLabel>
                      <FormControl>
                        <Input placeholder="FR76 XXXX XXXX XXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>BIC</FormLabel>
                      <FormControl>
                        <Input placeholder="BNPAFRPP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
