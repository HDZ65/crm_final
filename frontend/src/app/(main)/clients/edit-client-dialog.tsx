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
import { updateClient, getStatutClients } from "@/actions/clients"
import type { StatutClient } from "@proto-frontend/referentiel/referentiel"

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
  }
  onSuccess?: () => void
}

export function EditClientDialog({ open, onOpenChange, client, onSuccess }: EditClientDialogProps) {
  // Extraire nom et prénom du name (format "NOM PRENOM")
  const nameParts = client.name.split(" ")
  const defaultNom = nameParts[0] || ""
  const defaultPrenom = nameParts.slice(1).join(" ") || ""

  const [statuts, setStatuts] = React.useState<StatutClient[]>([])
  const [statutsLoading, setStatutsLoading] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  // Helper function to get status code from ID
  const getCode = (id: string) => {
    const statut = statuts.find((s) => s.id === id)
    return statut?.code || ""
  }

  // Fetch statuts on mount
  React.useEffect(() => {
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
      })
    }
  }, [open, client, form, statuts])

  const onSubmit = async (data: EditClientFormValues) => {
    setLoading(true)

    const result = await updateClient({
      id: client.id,
      typeClient: data.typeClient,
      nom: data.nom,
      prenom: data.prenom,
      dateNaissance: data.dateNaissance || undefined,
      telephone: data.telephone,
      email: data.email || undefined,
      statut: data.statutId ? getCode(data.statutId) : undefined,
    })

    setLoading(false)

    if (result.error) {
      toast.error("Erreur lors de la modification du client", {
        description: result.error,
      })
    } else {
      toast.success("Client modifié avec succès")
      onOpenChange(false)
      onSuccess?.()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier le client</DialogTitle>
          <DialogDescription>
            Modifiez les informations du client ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input placeholder="Téléphone" {...field} />
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading || statutsLoading}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading || statutsLoading}>
                {loading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
