"use client"

import * as React from "react"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"

import {
  Dialog,
  DialogContent,
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
import { createFacture } from "@/actions/factures"
import type { StatutFacture } from "@proto/factures/factures"

const ligneSchema = z.object({
  produitId: z.string(),
  description: z.string().min(1, "Description requise"),
  quantite: z.number().min(1, "Min 1"),
  prixUnitaire: z.number().min(0, "Min 0"),
  tauxTva: z.number().min(0).max(100),
})

const factureSchema = z.object({
  clientBaseId: z.string().min(1, "Client requis"),
  contratId: z.string(),
  dateEmission: z.string().min(1, "Date requise"),
  statutId: z.string().min(1, "Statut requis"),
  emissionFactureId: z.string().min(1, "Type d'émission requis"),
  lignes: z.array(ligneSchema).min(1, "Au moins une ligne requise"),
})

type FactureFormValues = z.infer<typeof factureSchema>

interface CreateFactureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  statuts: StatutFacture[]
  onSuccess?: () => void
}

const DEFAULT_LIGNE = {
  produitId: "",
  description: "",
  quantite: 1,
  prixUnitaire: 0,
  tauxTva: 20,
}

const currencyFormat = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
})

export function CreateFactureDialog({
  open,
  onOpenChange,
  statuts,
  onSuccess,
}: CreateFactureDialogProps) {
  const { activeOrganisation } = useOrganisation()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<FactureFormValues>({
    resolver: zodResolver(factureSchema),
    defaultValues: {
      clientBaseId: "",
      contratId: "",
      dateEmission: new Date().toISOString().split("T")[0],
      statutId: "",
      emissionFactureId: "",
      lignes: [{ ...DEFAULT_LIGNE }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lignes",
  })

  const watchedLignes = form.watch("lignes")
  const totalHT = watchedLignes.reduce(
    (sum, ligne) => sum + (ligne.quantite || 0) * (ligne.prixUnitaire || 0),
    0
  )
  const totalTVA = watchedLignes.reduce(
    (sum, ligne) =>
      sum +
      ((ligne.quantite || 0) *
        (ligne.prixUnitaire || 0) *
        (ligne.tauxTva || 0)) /
        100,
    0
  )
  const totalTTC = totalHT + totalTVA

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset()
    }
    onOpenChange(isOpen)
  }

  const onSubmit = async (values: FactureFormValues) => {
    setIsSubmitting(true)
    try {
      if (!activeOrganisation?.organisationId) {
        toast.error("Organisation non trouvée")
        return
      }

      const result = await createFacture({
        organisationId: activeOrganisation.organisationId,
        clientBaseId: values.clientBaseId,
        contratId: values.contratId || "",
        dateEmission: new Date(values.dateEmission).toISOString(),
        statutId: values.statutId,
        emissionFactureId: values.emissionFactureId,
        lignes: values.lignes.map((ligne) => ({
          produitId: ligne.produitId || "",
          description: ligne.description,
          quantite: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire,
          tauxTva: ligne.tauxTva,
        })),
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Facture créée avec succès")
        form.reset()
        onOpenChange(false)
        onSuccess?.()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle facture</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Main fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientBaseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ID du client"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contratId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contrat</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ID du contrat (optionnel)"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="dateEmission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d&apos;émission *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={isSubmitting}
                        {...field}
                      />
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
                    <FormLabel>Statut *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuts.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.nom}
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
                name="emissionFactureId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type d&apos;émission *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ID du type d'émission"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Line items */}
            <div className="space-y-3">
              <FormLabel>Lignes de facture</FormLabel>
              <div className="rounded-md border">
                <div className="grid grid-cols-[1fr_80px_100px_80px_110px_40px] gap-2 border-b bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground">
                  <span>Description</span>
                  <span>Qté</span>
                  <span>Prix unit.</span>
                  <span>TVA %</span>
                  <span>Montant HT</span>
                  <span />
                </div>
                {fields.map((field, index) => {
                  const ligne = watchedLignes[index]
                  const montantHT =
                    (ligne?.quantite || 0) * (ligne?.prixUnitaire || 0)
                  return (
                    <div
                      key={field.id}
                      className="grid grid-cols-[1fr_80px_100px_80px_110px_40px] items-start gap-2 border-b px-3 py-2 last:border-b-0"
                    >
                      <FormField
                        control={form.control}
                        name={`lignes.${index}.description`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Description"
                                disabled={isSubmitting}
                                {...f}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`lignes.${index}.quantite`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                disabled={isSubmitting}
                                {...f}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`lignes.${index}.prixUnitaire`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                disabled={isSubmitting}
                                {...f}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`lignes.${index}.tauxTva`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                disabled={isSubmitting}
                                {...f}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex h-9 items-center text-sm font-medium">
                        {currencyFormat.format(montantHT)}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        disabled={fields.length <= 1 || isSubmitting}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
              {form.formState.errors.lignes?.root && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.lignes.root.message}
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                disabled={isSubmitting}
                onClick={() => append({ ...DEFAULT_LIGNE })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une ligne
              </Button>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1 rounded-md border bg-muted/30 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total HT</span>
                  <span className="font-medium">
                    {currencyFormat.format(totalHT)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total TVA</span>
                  <span className="font-medium">
                    {currencyFormat.format(totalTVA)}
                  </span>
                </div>
                <div className="my-1 border-t" />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total TTC</span>
                  <span>{currencyFormat.format(totalTTC)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? "Création..." : "Créer la facture"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
