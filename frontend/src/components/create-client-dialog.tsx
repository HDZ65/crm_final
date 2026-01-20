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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { useOrganisation } from "@/contexts/organisation-context"
import { createClient } from "@/actions/clients"

const createClientSchema = z.object({
  typeClient: z.string().min(1, "Le type de client est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prenom est requis"),
  dateNaissance: z.string()
    .refine(val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), "Date au format YYYY-MM-DD requise")
    .optional(),
  telephone: z.string().min(1, "Le telephone est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
})

type CreateClientFormValues = z.infer<typeof createClientSchema>

interface CreateClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateClientDialog({ open, onOpenChange, onSuccess }: CreateClientDialogProps) {
  const { activeOrganisation } = useOrganisation()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const form = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      typeClient: "particulier",
      nom: "",
      prenom: "",
      dateNaissance: "",
      telephone: "",
      email: "",
    },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({
        typeClient: "particulier",
        nom: "",
        prenom: "",
        dateNaissance: "",
        telephone: "",
        email: "",
      })
      setError(null)
    }
  }, [open, form])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    const data = form.getValues()
    const isValid = await form.trigger()
    if (!isValid) return

    if (!activeOrganisation) {
      toast.error("Aucune organisation selectionnee")
      return
    }

    setIsSubmitting(true)
    setError(null)

    const result = await createClient({
      organisationId: activeOrganisation.organisationId,
      typeClient: data.typeClient,
      nom: data.nom,
      prenom: data.prenom,
      dateNaissance: data.dateNaissance || undefined,
      compteCode: `CLI-${Date.now().toString(36).toUpperCase()}`,
      partenaireId: activeOrganisation.organisationId,
      telephone: data.telephone,
      email: data.email || "",
      statut: "", // Le backend attribuera un statut par défaut
    })

    setIsSubmitting(false)

    if (result.data) {
      toast.success("Client cree avec succes")
      onOpenChange(false)
      onSuccess?.()
    } else {
      setError(result.error || "Erreur lors de la creation du client")
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
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creation..." : "Creer le client"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
