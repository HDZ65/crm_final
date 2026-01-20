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
import { useOrganisation } from "@/contexts/organisation-context"
import { createApporteur } from "@/actions/commerciaux"
import { getSocietesByOrganisation } from "@/actions/catalogue"
import { TYPE_COMMERCIAL_LABELS } from "@/types/commercial"
import type { Societe } from "@proto-frontend/organisations/organisations"

const createCommercialSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  typeApporteur: z.string().min(1, "Le type est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  telephone: z.string().optional().or(z.literal("")),
  societeId: z.string().optional(), // empty/undefined = toutes les sociétés
})

type CreateCommercialFormValues = z.infer<typeof createCommercialSchema>

interface CreateCommercialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateCommercialDialog({ open, onOpenChange, onSuccess }: CreateCommercialDialogProps) {
  const { activeOrganisation } = useOrganisation()
  const [loading, setLoading] = React.useState(false)
  const [societes, setSocietes] = React.useState<Societe[]>([])

  const form = useForm<CreateCommercialFormValues>({
    resolver: zodResolver(createCommercialSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      typeApporteur: "vrp",
      email: "",
      telephone: "",
      societeId: "", // empty = toutes les sociétés
    },
  })

  // Charger les sociétés
  React.useEffect(() => {
    async function loadSocietes() {
      if (!activeOrganisation) return
      const result = await getSocietesByOrganisation(activeOrganisation.organisationId)
      if (result.data?.societes) {
        setSocietes(result.data.societes)
      }
    }
    loadSocietes()
  }, [activeOrganisation])

  React.useEffect(() => {
    if (open) {
      form.reset({
        nom: "",
        prenom: "",
        typeApporteur: "vrp",
        email: "",
        telephone: "",
        societeId: "",
      })
    }
  }, [open, form])

  const onSubmit = async (data: CreateCommercialFormValues) => {
    if (!activeOrganisation) {
      toast.error("Aucune organisation sélectionnée")
      return
    }

    setLoading(true)
    const result = await createApporteur({
      organisationId: activeOrganisation.organisationId,
      nom: data.nom,
      prenom: data.prenom,
      typeApporteur: data.typeApporteur.toUpperCase(),
      email: data.email || undefined,
      telephone: data.telephone || undefined,
      societeId: data.societeId || undefined, // undefined = toutes les sociétés
    })
    setLoading(false)

    if (result.data) {
      toast.success("Commercial créé avec succès")
      onOpenChange(false)
      onSuccess?.()
    } else {
      toast.error(result.error || "Erreur lors de la création du commercial")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouveau commercial</DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau commercial en remplissant les informations ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input placeholder="Prénom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="typeApporteur"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(TYPE_COMMERCIAL_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemple.com" {...field} />
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
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input placeholder="06 12 34 56 78" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="societeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Société</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les sociétés" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Toutes les sociétés</SelectItem>
                      {societes.map((societe) => (
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Création..." : "Créer le commercial"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
