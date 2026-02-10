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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TypeProduit,
  CategorieProduit,
  type CreateProduitRequest,
  type Gamme,
} from "@proto/products/products"
import {
  TYPE_PRODUIT_LABELS,
  CATEGORIE_PRODUIT_LABELS,
} from "@/lib/ui/labels/product"
import type { Societe } from "@proto/organisations/organisations"

// Selectable category values (excluding unspecified and unrecognized)
const SELECTABLE_CATEGORIES = [
  CategorieProduit.ASSURANCE,
  CategorieProduit.PREVOYANCE,
  CategorieProduit.EPARGNE,
  CategorieProduit.SERVICE,
  CategorieProduit.ACCESSOIRE,
] as const

// Selectable type values
const SELECTABLE_TYPES = [
  TypeProduit.INTERNE,
  TypeProduit.PARTENAIRE,
] as const

const formSchema = z.object({
  societeId: z.string().min(1, "Veuillez sélectionner une société"),
  gammeId: z.string().min(1, "Veuillez sélectionner une gamme"),
  sku: z.string().min(1, "La référence est requise"),
  nom: z.string().min(1, "Le nom est requis"),
  description: z.string().min(1, "La description est requise"),
  type: z.coerce.number(),
  categorie: z.coerce.number(),
  prix: z.coerce.number().min(0, "Le prix doit être positif"),
  tauxTVA: z.coerce.number().min(0, "Le taux doit être positif").max(100, "Le taux ne peut pas dépasser 100%"),
  devise: z.string().default("EUR"),
  actif: z.boolean().default(true),
  // Champs promotion
  promotionActive: z.boolean().default(false),
  promotionPourcentage: z.coerce.number().min(0).max(100).optional(),
  promotionDateDebut: z.string().optional(),
  promotionDateFin: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CreateProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateProduitRequest) => Promise<void>
  societes: Societe[]
  gammes: Gamme[]
  loading?: boolean
  defaultSocieteId?: string
  defaultGammeId?: string
}

export function CreateProductDialog({
  open,
  onOpenChange,
  onSubmit,
  societes,
  gammes,
  loading = false,
  defaultSocieteId,
  defaultGammeId,
}: CreateProductDialogProps) {
  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      societeId: defaultSocieteId || "",
      gammeId: defaultGammeId || "",
      sku: "",
      nom: "",
      description: "",
      type: TypeProduit.INTERNE,
      categorie: CategorieProduit.ASSURANCE,
      prix: 0,
      tauxTVA: 20,
      devise: "EUR",
      actif: true,
      promotionActive: false,
      promotionPourcentage: undefined,
      promotionDateDebut: "",
      promotionDateFin: "",
    },
  })

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      form.reset({
        societeId: defaultSocieteId || "",
        gammeId: defaultGammeId || "",
        sku: "",
        nom: "",
        description: "",
        type: TypeProduit.INTERNE,
        categorie: CategorieProduit.ASSURANCE,
        prix: 0,
        tauxTVA: 20,
        devise: "EUR",
        actif: true,
        promotionActive: false,
        promotionPourcentage: undefined,
        promotionDateDebut: "",
        promotionDateFin: "",
      })
    }
  }, [open, defaultSocieteId, defaultGammeId, form])

  const handleSubmit = async (values: FormValues) => {
    await onSubmit({
      organisationId: values.societeId,
      gammeId: values.gammeId,
      sku: values.sku,
      nom: values.nom,
      description: values.description,
      type: values.type as TypeProduit,
      categorie: values.categorie as CategorieProduit,
      prix: values.prix,
      tauxTva: values.tauxTVA,
      devise: values.devise,
      imageUrl: "",
      codeExterne: "",
      metadata: "",
      statutCycle: 0,
    })
  }

  const productType = form.watch("type")
  const prixHT = form.watch("prix")
  const tauxTVA = form.watch("tauxTVA")
  const promotionActive = form.watch("promotionActive")
  const promotionPourcentage = form.watch("promotionPourcentage")

  // Calcul du prix TTC en temps réel
  const prixTTC = React.useMemo(() => {
    const prix = Number(prixHT) || 0
    const tva = Number(tauxTVA) || 0
    return Math.round(prix * (1 + tva / 100) * 100) / 100
  }, [prixHT, tauxTVA])

  // Calcul du prix promo en temps réel
  const prixPromo = React.useMemo(() => {
    if (!promotionActive || !promotionPourcentage) return null
    const prix = Number(prixHT) || 0
    const reduction = Number(promotionPourcentage) || 0
    return Math.round(prix * (1 - reduction / 100) * 100) / 100
  }, [prixHT, promotionActive, promotionPourcentage])

  const prixPromoTTC = React.useMemo(() => {
    if (!prixPromo) return null
    const tva = Number(tauxTVA) || 0
    return Math.round(prixPromo * (1 + tva / 100) * 100) / 100
  }, [prixPromo, tauxTVA])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un produit</DialogTitle>
          <DialogDescription>
            Créez un nouveau produit pour votre catalogue.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="societeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Société *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une société" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Référence *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: SANTE-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SELECTABLE_TYPES.map((t) => (
                          <SelectItem key={t} value={String(t)}>
                            {TYPE_PRODUIT_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du produit *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Assurance Mobile Premium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez le produit..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categorie"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie *</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SELECTABLE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={String(cat)}>
                          {CATEGORIE_PRODUIT_LABELS[cat]}
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
              name="gammeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gamme *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une gamme" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {gammes.map((gamme) => (
                        <SelectItem key={gamme.id} value={gamme.id}>
                          {gamme.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="prix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix HT *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tauxTVA"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TVA (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Prix TTC</FormLabel>
                <Input
                  type="text"
                  value={prixTTC.toFixed(2)}
                  readOnly
                  disabled
                  className="bg-muted"
                />
              </FormItem>

              <FormField
                control={form.control}
                name="devise"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Devise</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {productType === TypeProduit.PARTENAIRE && (
              <FormItem>
                <FormLabel>Fournisseur / Partenaire</FormLabel>
                <Input placeholder="Nom du partenaire" disabled />
                <FormDescription>
                  Indiquez le nom du partenaire qui fournit ce produit.
                </FormDescription>
              </FormItem>
            )}

            <FormField
              control={form.control}
              name="actif"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Produit actif</FormLabel>
                    <FormDescription>
                      Un produit inactif ne sera pas visible dans le catalogue.
                    </FormDescription>
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

            {/* Section Promotion */}
            <div className="rounded-lg border p-4 space-y-4">
              <FormField
                control={form.control}
                name="promotionActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Promotion active</FormLabel>
                      <FormDescription>
                        Activer une réduction temporaire sur ce produit.
                      </FormDescription>
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

              {promotionActive && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="promotionPourcentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Réduction (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="1"
                              min="0"
                              max="100"
                              placeholder="10"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormItem>
                      <FormLabel>Prix promo HT</FormLabel>
                      <Input
                        type="text"
                        value={prixPromo?.toFixed(2) ?? "-"}
                        readOnly
                        disabled
                        className="bg-muted"
                      />
                    </FormItem>

                    <FormItem>
                      <FormLabel>Prix promo TTC</FormLabel>
                      <Input
                        type="text"
                        value={prixPromoTTC?.toFixed(2) ?? "-"}
                        readOnly
                        disabled
                        className="bg-muted text-green-600 font-semibold"
                      />
                    </FormItem>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="promotionDateDebut"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de début</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="promotionDateFin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de fin</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Création..." : "Créer le produit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
