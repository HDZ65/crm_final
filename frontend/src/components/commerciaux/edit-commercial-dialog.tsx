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
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { updateApporteur, activerApporteur, desactiverApporteur } from "@/actions/commerciaux"
import { TYPE_COMMERCIAL_LABELS } from "@/types/commercial"
import type { Commercial } from "@/types/commercial"

const editCommercialSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  typeApporteur: z.string().min(1, "Le type est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  telephone: z.string().optional().or(z.literal("")),
  actif: z.boolean(),
})

type EditCommercialFormValues = z.infer<typeof editCommercialSchema>

interface EditCommercialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  commercial: Commercial
  onSuccess?: () => void
}

export function EditCommercialDialog({ open, onOpenChange, commercial, onSuccess }: EditCommercialDialogProps) {
  const [loading, setLoading] = React.useState(false)

  const form = useForm<EditCommercialFormValues>({
    resolver: zodResolver(editCommercialSchema),
    defaultValues: {
      nom: commercial.nom || "",
      prenom: commercial.prenom || "",
      typeApporteur: commercial.typeApporteur || "vrp",
      email: commercial.email || "",
      telephone: commercial.telephone || "",
      actif: commercial.actif ?? true,
    },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({
        nom: commercial.nom || "",
        prenom: commercial.prenom || "",
        typeApporteur: commercial.typeApporteur || "vrp",
        email: commercial.email || "",
        telephone: commercial.telephone || "",
        actif: commercial.actif ?? true,
      })
    }
  }, [open, commercial, form])

  const onSubmit = async (data: EditCommercialFormValues) => {
    setLoading(true)

    // First update the basic info
    const result = await updateApporteur({
      id: commercial.id,
      nom: data.nom,
      prenom: data.prenom,
      typeApporteur: data.typeApporteur,
      email: data.email || "",
      telephone: data.telephone || "",
    })

    if (result.error) {
      setLoading(false)
      toast.error(result.error || "Erreur lors de la modification du commercial")
      return
    }

    // Then handle actif status change if needed
    if (data.actif !== commercial.actif) {
      const statusResult = data.actif
        ? await activerApporteur(commercial.id)
        : await desactiverApporteur(commercial.id)

      if (statusResult.error) {
        setLoading(false)
        toast.error(statusResult.error || "Erreur lors de la modification du statut")
        return
      }
    }

    setLoading(false)
    toast.success("Commercial modifié avec succès")
    onOpenChange(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier le commercial</DialogTitle>
          <DialogDescription>
            Modifiez les informations du commercial.
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
              name="actif"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Actif</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Modification..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
