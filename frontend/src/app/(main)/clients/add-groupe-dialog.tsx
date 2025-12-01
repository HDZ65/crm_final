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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useCreateSociete } from "@/hooks/clients"
import { useOrganisation } from "@/contexts/organisation-context"

const addGroupeSchema = z.object({
  raisonSociale: z.string().min(1, "La raison sociale est requise"),
  siren: z
    .string()
    .min(1, "Le SIREN est requis")
    .regex(/^\d{9}$/, "Le SIREN doit contenir 9 chiffres"),
  numeroTVA: z
    .string()
    .min(1, "Le numéro TVA est requis")
    .regex(/^[A-Z]{2}\d{11}$/, "Format TVA invalide (ex: FR12345678901)"),
})

type AddGroupeFormValues = z.infer<typeof addGroupeSchema>

interface AddGroupeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddGroupeDialog({ open, onOpenChange, onSuccess }: AddGroupeDialogProps) {
  const { activeOrganisation } = useOrganisation()
  const { createSociete, loading } = useCreateSociete()

  const form = useForm<AddGroupeFormValues>({
    resolver: zodResolver(addGroupeSchema),
    defaultValues: {
      raisonSociale: "",
      siren: "",
      numeroTVA: "",
    },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({
        raisonSociale: "",
        siren: "",
        numeroTVA: "",
      })
    }
  }, [open, form])

  const onSubmit = async (data: AddGroupeFormValues) => {
    if (!activeOrganisation) {
      toast.error("Aucune organisation active")
      return
    }

    try {
      await createSociete({
        organisationId: activeOrganisation.id,
        raisonSociale: data.raisonSociale,
        siren: data.siren,
        numeroTVA: data.numeroTVA,
      })
      toast.success("Groupe créé avec succès")
      onOpenChange(false)
      onSuccess?.()
    } catch {
      toast.error("Erreur lors de la création du groupe")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Ajouter un groupe</DialogTitle>
          <DialogDescription>
            Créez une nouvelle société/groupe pour organiser vos clients.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="raisonSociale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raison sociale</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Auchan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="siren"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SIREN</FormLabel>
                  <FormControl>
                    <Input placeholder="123456789" maxLength={9} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numeroTVA"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro TVA</FormLabel>
                  <FormControl>
                    <Input placeholder="FR12345678901" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Création..." : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
