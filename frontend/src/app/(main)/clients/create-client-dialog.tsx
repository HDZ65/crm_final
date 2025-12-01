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
import { api } from "@/lib/api"
import { useOrganisation } from "@/contexts/organisation-context"
import { useStatutClients } from "@/hooks/clients/use-statut-clients"
import { useSimpleSubmitGuard } from "@/hooks/core/use-submit-guard"

const createClientSchema = z.object({
  typeClient: z.string().min(1, "Le type de client est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prenom est requis"),
  dateNaissance: z.string().optional(),
  telephone: z.string().min(1, "Le telephone est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  statutId: z.string().min(1, "Le statut est requis"),
})

type CreateClientFormValues = z.infer<typeof createClientSchema>

interface CreateClientDto {
  organisationId: string
  typeClient: string
  nom: string
  prenom: string
  dateNaissance?: string | null
  compteCode: string
  partenaireId: string
  dateCreation: string
  telephone: string
  email?: string
  statutId: string
}

interface CreateClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateClientDialog({ open, onOpenChange, onSuccess }: CreateClientDialogProps) {
  const { activeOrganisation } = useOrganisation()
  const { statuts, loading: statutsLoading } = useStatutClients()
  const [isSubmitting, withSubmitGuard] = useSimpleSubmitGuard()

  const form = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      typeClient: "particulier",
      nom: "",
      prenom: "",
      dateNaissance: "",
      telephone: "",
      email: "",
      statutId: "",
    },
  })

  // Pre-select "actif" status when statuts are loaded
  React.useEffect(() => {
    if (statuts.length > 0 && !form.getValues("statutId")) {
      const actifStatut = statuts.find(s => s.code === "actif")
      if (actifStatut) {
        form.setValue("statutId", actifStatut.id)
      }
    }
  }, [statuts, form])

  React.useEffect(() => {
    if (open) {
      form.reset({
        typeClient: "particulier",
        nom: "",
        prenom: "",
        dateNaissance: "",
        telephone: "",
        email: "",
        statutId: statuts.find(s => s.code === "actif")?.id || "",
      })
    }
  }, [open, form, statuts])

  const handleSubmit = withSubmitGuard(async () => {
    const data = form.getValues()
    const isValid = await form.trigger()
    if (!isValid) return

    if (!activeOrganisation) {
      toast.error("Aucune organisation selectionnee")
      return
    }

    const payload: CreateClientDto = {
      organisationId: activeOrganisation.id,
      typeClient: data.typeClient,
      nom: data.nom,
      prenom: data.prenom,
      dateNaissance: data.dateNaissance || null,
      compteCode: `CLI-${Date.now().toString(36).toUpperCase()}`,
      partenaireId: activeOrganisation.id, // Default to organisation
      dateCreation: new Date().toISOString(),
      telephone: data.telephone,
      email: data.email || undefined,
      statutId: data.statutId,
    }

    await api.post("/clientbases", payload)
    toast.success("Client cree avec succes")
    onOpenChange(false)
    onSuccess?.()
  })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await handleSubmit()
    } catch {
      toast.error("Erreur lors de la creation du client")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouveau client</DialogTitle>
          <DialogDescription>
            Creez un nouveau client en remplissant les informations ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="typeClient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de client</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting || statutsLoading}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting || statutsLoading}>
                {isSubmitting ? "Creation..." : "Creer le client"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
