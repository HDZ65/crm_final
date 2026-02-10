"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Calculator, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useOrganisation } from "@/contexts/organisation-context"
import { createBareme } from "@/actions/commissions"
import { getGammesByOrganisation, getProduitsByOrganisation } from "@/actions/catalogue"
import type { TypeOption, DureeOption } from "@/lib/config/commission"
import type { BaremeWithPaliers } from "@/lib/ui/display-types/commission"
import type { Gamme, Produit } from "@proto/products/products"

const createBaremeSchema = z.object({
  code: z.string().min(1, "Le code est requis").max(50, "50 caractères maximum"),
  nom: z.string().min(1, "Le nom est requis").max(100, "100 caractères maximum"),
  description: z.string().max(500, "500 caractères maximum").optional(),
  typeCalcul: z.enum(["fixe", "pourcentage", "palier", "mixte"]),
  baseCalcul: z.enum(["cotisation_ht", "ca_ht", "forfait"]),
  montantFixe: z.coerce.number().min(0).optional(),
  tauxPourcentage: z.coerce.number().min(0).max(100).optional(),
  precomptee: z.boolean().default(false),
  recurrenceActive: z.boolean().default(false),
  tauxRecurrence: z.coerce.number().min(0).max(100).optional(),
  dureeRecurrenceMois: z.coerce.number().min(1).max(60).optional(),
  dureeReprisesMois: z.coerce.number().min(1).max(24).default(12),
  tauxReprise: z.coerce.number().min(0).max(100).default(100),
  gammeId: z.string().optional(),
  produitId: z.string().optional(),
  profilRemuneration: z.string().optional(),
  canalVente: z.string().optional(),
  dateEffet: z.string().min(1, "La date d'effet est requise"),
  dateFin: z.string().optional(),
})

interface CreateBaremeFormValues {
  code: string
  nom: string
  description?: string
  typeCalcul: "fixe" | "pourcentage" | "palier" | "mixte"
  baseCalcul: "cotisation_ht" | "ca_ht" | "forfait"
  montantFixe?: number
  tauxPourcentage?: number
  precomptee: boolean
  recurrenceActive: boolean
  tauxRecurrence?: number
  dureeRecurrenceMois?: number
  dureeReprisesMois: number
  tauxReprise: number
  gammeId?: string
  produitId?: string
  profilRemuneration?: string
  canalVente?: string
  dateEffet: string
  dateFin?: string
}

interface CreateBaremeDialogProps {
  trigger?: React.ReactNode
  typesCalcul: TypeOption[]
  typesBase: TypeOption[]
  typesApporteur: TypeOption[]
  dureesReprise: DureeOption[]
  loadingConfig?: boolean
  onSuccess?: (bareme: BaremeWithPaliers) => void
}

export function CreateBaremeDialog({
  trigger,
  typesCalcul,
  typesBase,
  typesApporteur,
  dureesReprise,
  loadingConfig,
  onSuccess,
}: CreateBaremeDialogProps) {
  const { activeOrganisation } = useOrganisation()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  // State pour gammes et produits
  const [gammes, setGammes] = React.useState<Gamme[]>([])
  const [produits, setProduits] = React.useState<Produit[]>([])
  const [loadingGammes, setLoadingGammes] = React.useState(false)
  const [loadingProduits, setLoadingProduits] = React.useState(false)
  const [selectedGammeId, setSelectedGammeId] = React.useState<string | undefined>()

  // Fetch gammes when dialog opens
  React.useEffect(() => {
    if (!open || !activeOrganisation?.organisationId) return
    setLoadingGammes(true)
    getGammesByOrganisation({ organisationId: activeOrganisation.organisationId }).then((result) => {
      if (result.data) {
        setGammes(result.data.gammes || [])
      }
      setLoadingGammes(false)
    })
  }, [open, activeOrganisation?.organisationId])

  // Fetch produits when gamme changes
  React.useEffect(() => {
    if (!selectedGammeId || !activeOrganisation?.organisationId) {
      setProduits([])
      return
    }
    setLoadingProduits(true)
    getProduitsByOrganisation({ organisationId: activeOrganisation.organisationId, gammeId: selectedGammeId }).then((result) => {
      if (result.data) {
        setProduits(result.data.produits || [])
      }
      setLoadingProduits(false)
    })
  }, [selectedGammeId, activeOrganisation?.organisationId])

  const form = useForm<CreateBaremeFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createBaremeSchema) as any,
    defaultValues: {
      code: "",
      nom: "",
      description: "",
      typeCalcul: undefined,
      baseCalcul: undefined,
      montantFixe: undefined,
      tauxPourcentage: undefined,
      precomptee: false,
      recurrenceActive: false,
      tauxRecurrence: undefined,
      dureeRecurrenceMois: undefined,
      dureeReprisesMois: 12,
      tauxReprise: 100,
      gammeId: "",
      produitId: "",
      profilRemuneration: "",
      canalVente: "",
      dateEffet: new Date().toISOString().split("T")[0],
      dateFin: "",
    },
  })

  const typeCalcul = form.watch("typeCalcul")
  const recurrenceActive = form.watch("recurrenceActive")

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setError(null)
      form.reset()
      setSelectedGammeId(undefined)
    }
  }

  const onSubmit = async (data: CreateBaremeFormValues) => {
    if (!activeOrganisation) {
      toast.error("Aucune organisation sélectionnée")
      return
    }

    setLoading(true)
    setError(null)

    const result = await createBareme({
      organisationId: activeOrganisation.organisationId,
      code: data.code,
      nom: data.nom,
      description: data.description || undefined,
      typeCalcul: data.typeCalcul.toUpperCase(),
      baseCalcul: data.baseCalcul.toUpperCase(),
      montantFixe: data.montantFixe?.toString() || undefined,
      tauxPourcentage: data.tauxPourcentage?.toString() || undefined,
      recurrenceActive: data.recurrenceActive,
      tauxRecurrence: data.recurrenceActive ? data.tauxRecurrence?.toString() : undefined,
      dureeRecurrenceMois: data.recurrenceActive ? data.dureeRecurrenceMois : undefined,
      dureeReprisesMois: data.dureeReprisesMois,
      tauxReprise: data.tauxReprise.toString(),
      profilRemuneration: data.profilRemuneration && data.profilRemuneration !== "__all__" ? data.profilRemuneration : undefined,
      canalVente: data.canalVente && data.canalVente !== "__all__" ? data.canalVente : undefined,
      repartitionCommercial: "100",
      repartitionManager: "0",
      repartitionAgence: "0",
      repartitionEntreprise: "0",
      dateEffet: data.dateEffet,
      dateFin: data.dateFin || undefined,
    })

    setLoading(false)

    if (result.data) {
      toast.success("Barème créé avec succès")
      // Map to BaremeWithPaliers for onSuccess callback
      const baremeResponse: BaremeWithPaliers = {
        id: (result.data as { bareme?: { id: string } }).bareme?.id || "",
        organisationId: activeOrganisation.organisationId,
        code: data.code,
        nom: data.nom,
        description: data.description ?? null,
        typeCalcul: data.typeCalcul,
        baseCalcul: data.baseCalcul,
        montantFixe: data.montantFixe != null ? data.montantFixe.toString() : null,
        tauxPourcentage: data.tauxPourcentage != null ? data.tauxPourcentage.toString() : null,
        precomptee: data.precomptee,
        recurrenceActive: data.recurrenceActive,
        tauxRecurrence: data.tauxRecurrence != null ? data.tauxRecurrence.toString() : null,
        dureeRecurrenceMois: data.dureeRecurrenceMois ?? null,
        dureeReprisesMois: data.dureeReprisesMois,
        tauxReprise: data.tauxReprise.toString(),
        typeProduit: null,
        gammeId: data.gammeId && data.gammeId !== "__all__" ? data.gammeId : null,
        produitId: data.produitId && data.produitId !== "__all__" ? data.produitId : null,
        profilRemuneration: data.profilRemuneration && data.profilRemuneration !== "__all__" ? data.profilRemuneration as BaremeWithPaliers["profilRemuneration"] : null,
        societeId: null,
        canalVente: data.canalVente && data.canalVente !== "__all__" ? data.canalVente as BaremeWithPaliers["canalVente"] : null,
        repartitionCommercial: "100",
        repartitionManager: "0",
        repartitionAgence: "0",
        repartitionEntreprise: "0",
        version: 1,
        dateEffet: data.dateEffet,
        dateFin: data.dateFin ?? null,
        actif: true,
        creePar: null,
        modifiePar: null,
        motifModification: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      onSuccess?.(baremeResponse)
      handleOpenChange(false)
    } else {
      setError(new Error(result.error || "Erreur lors de la création du barème"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="size-4" />
            Nouveau barème
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] !grid-rows-[auto_1fr_auto] overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="size-5" />
            Créer un barème de commission
          </DialogTitle>
          <DialogDescription>
            Configurez les paramètres de calcul des commissions pour ce barème.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="contents ">
            <ScrollArea className="h-full max-h-[60vh] pr-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-2 mx-1">
                {/* Colonne gauche - Informations de base */}
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code *</FormLabel>
                      <FormControl>
                        <Input className="w-full" placeholder="BAR-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input className="w-full" placeholder="Barème VRP Télécom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Type et base de calcul */}
                <FormField
                  control={form.control}
                  name="typeCalcul"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de calcul *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={loadingConfig}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {typesCalcul.map((type) => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="baseCalcul"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base de calcul *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={loadingConfig}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {typesBase.map((type) => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Montants selon type */}
                {(typeCalcul === "fixe" || typeCalcul === "mixte") && (
                  <FormField
                    control={form.control}
                    name="montantFixe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Montant fixe (EUR)</FormLabel>
                        <FormControl>
                          <Input className="w-full" type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {(typeCalcul === "pourcentage" || typeCalcul === "mixte") && (
                  <FormField
                    control={form.control}
                    name="tauxPourcentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taux (%)</FormLabel>
                        <FormControl>
                          <Input className="w-full" type="number" step="0.1" min="0" max="100" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Gamme et Produit */}
                <FormField
                  control={form.control}
                  name="gammeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gamme</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          setSelectedGammeId(value === "__all__" ? undefined : value)
                          form.setValue("produitId", "")
                        }}
                        value={field.value}
                        disabled={loadingGammes}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={loadingGammes ? "Chargement..." : "Toutes"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__all__">Toutes les gammes</SelectItem>
                          {gammes.map((gamme) => (
                            <SelectItem key={gamme.id} value={gamme.id}>{gamme.nom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="produitId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produit</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loadingProduits || !selectedGammeId}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={!selectedGammeId ? "Sélectionnez une gamme" : loadingProduits ? "Chargement..." : "Tous"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__all__">Tous les produits</SelectItem>
                          {produits.map((produit) => (
                            <SelectItem key={produit.id} value={produit.id}>{produit.nom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profilRemuneration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profil apporteur</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={loadingConfig}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Tous" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__all__">Tous les profils</SelectItem>
                          {typesApporteur.map((type) => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Canal et dates */}
                <FormField
                  control={form.control}
                  name="canalVente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canal de vente</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Tous" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__all__">Tous les canaux</SelectItem>
                          <SelectItem value="terrain">Terrain</SelectItem>
                          <SelectItem value="web">Web</SelectItem>
                          <SelectItem value="televente">Télévente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateEffet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d&apos;effet *</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Sélectionnez une date"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reprises */}
                <FormField
                  control={form.control}
                  name="dureeReprisesMois"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fenêtre de reprise</FormLabel>
                      <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {dureesReprise.map((duree) => (
                            <SelectItem key={duree.value} value={duree.value.toString()}>{duree.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tauxReprise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taux de reprise (%)</FormLabel>
                      <FormControl>
                        <Input className="w-full" type="number" step="1" min="0" max="100" placeholder="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Options - sur toute la largeur */}
                <div className="col-span-2 space-y-3 pt-2">
                  <FormField
                    control={form.control}
                    name="precomptee"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel>Commission précomptée</FormLabel>
                          <FormDescription className="text-xs">Versée en une fois à la signature</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="recurrenceActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel>Récurrence active</FormLabel>
                          <FormDescription className="text-xs">Versements récurrents sur plusieurs mois</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Champs récurrence conditionnels */}
                {recurrenceActive && (
                  <>
                    <FormField
                      control={form.control}
                      name="tauxRecurrence"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taux récurrence (%)</FormLabel>
                          <FormControl>
                            <Input className="w-full" type="number" step="0.1" min="0" max="100" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dureeRecurrenceMois"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Durée récurrence (mois)</FormLabel>
                          <FormControl>
                            <Input className="w-full" type="number" min="1" max="60" placeholder="12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Description - sur toute la largeur */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Description optionnelle..." className="resize-none" rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Erreur API */}
                {error && (
                  <div className="col-span-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertTriangle className="size-4" />
                      <span>{error.message}</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading || loadingConfig}>
                Créer le barème
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
