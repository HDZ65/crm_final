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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Loader2, Calculator, AlertTriangle, Pencil } from "lucide-react"
import { toast } from "sonner"
import { useUpdateBareme, useToggleBaremeActif } from "@/hooks/commissions"
import type { TypeOption, DureeOption } from "@/hooks/commissions/use-commission-config"
import type { BaremeCommissionResponseDto } from "@/types/commission-dto"

const editBaremeSchema = z.object({
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
  typeProduit: z.string().optional(),
  profilRemuneration: z.string().optional(),
  canalVente: z.string().optional(),
  repartitionCommercial: z.coerce.number().min(0).max(100).default(100),
  repartitionManager: z.coerce.number().min(0).max(100).default(0),
  repartitionAgence: z.coerce.number().min(0).max(100).default(0),
  repartitionEntreprise: z.coerce.number().min(0).max(100).default(0),
  dateFin: z.string().optional(),
  motifModification: z.string().max(200, "200 caractères maximum").optional(),
}).refine((data) => {
  const total = data.repartitionCommercial + data.repartitionManager + data.repartitionAgence + data.repartitionEntreprise
  return total === 100
}, {
  message: "Le total de la répartition doit être égal à 100%",
  path: ["repartitionCommercial"],
})

interface EditBaremeFormValues {
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
  typeProduit?: string
  profilRemuneration?: string
  canalVente?: string
  repartitionCommercial: number
  repartitionManager: number
  repartitionAgence: number
  repartitionEntreprise: number
  dateFin?: string
  motifModification?: string
}

interface EditBaremeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bareme: BaremeCommissionResponseDto
  typesCalcul: TypeOption[]
  typesBase: TypeOption[]
  typesProduit: TypeOption[]
  typesApporteur: TypeOption[]
  dureesReprise: DureeOption[]
  loadingConfig?: boolean
  onSuccess?: (bareme: BaremeCommissionResponseDto) => void
}

export function EditBaremeDialog({
  open,
  onOpenChange,
  bareme,
  typesCalcul,
  typesBase,
  typesProduit,
  typesApporteur,
  dureesReprise,
  loadingConfig,
  onSuccess,
}: EditBaremeDialogProps) {
  const { loading, error, update, reset } = useUpdateBareme()
  const { loading: toggleLoading, toggle } = useToggleBaremeActif()

  const form = useForm<EditBaremeFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(editBaremeSchema) as any,
    defaultValues: {
      nom: bareme.nom,
      description: bareme.description || "",
      typeCalcul: bareme.typeCalcul,
      baseCalcul: bareme.baseCalcul,
      montantFixe: bareme.montantFixe ?? undefined,
      tauxPourcentage: bareme.tauxPourcentage ?? undefined,
      precomptee: bareme.precomptee ?? false,
      recurrenceActive: bareme.recurrenceActive,
      tauxRecurrence: bareme.tauxRecurrence ?? undefined,
      dureeRecurrenceMois: bareme.dureeRecurrenceMois ?? undefined,
      dureeReprisesMois: bareme.dureeReprisesMois,
      tauxReprise: bareme.tauxReprise,
      typeProduit: bareme.typeProduit || "__all__",
      profilRemuneration: bareme.profilRemuneration || "__all__",
      canalVente: bareme.canalVente || "__all__",
      repartitionCommercial: bareme.repartitionCommercial ?? 100,
      repartitionManager: bareme.repartitionManager ?? 0,
      repartitionAgence: bareme.repartitionAgence ?? 0,
      repartitionEntreprise: bareme.repartitionEntreprise ?? 0,
      dateFin: bareme.dateFin ? new Date(bareme.dateFin).toISOString().split("T")[0] : "",
      motifModification: "",
    },
  })

  // Reset form when bareme changes
  React.useEffect(() => {
    if (open) {
      form.reset({
        nom: bareme.nom,
        description: bareme.description || "",
        typeCalcul: bareme.typeCalcul,
        baseCalcul: bareme.baseCalcul,
        montantFixe: bareme.montantFixe ?? undefined,
        tauxPourcentage: bareme.tauxPourcentage ?? undefined,
        precomptee: bareme.precomptee ?? false,
        recurrenceActive: bareme.recurrenceActive,
        tauxRecurrence: bareme.tauxRecurrence ?? undefined,
        dureeRecurrenceMois: bareme.dureeRecurrenceMois ?? undefined,
        dureeReprisesMois: bareme.dureeReprisesMois,
        tauxReprise: bareme.tauxReprise,
        typeProduit: bareme.typeProduit || "__all__",
        profilRemuneration: bareme.profilRemuneration || "__all__",
        canalVente: bareme.canalVente || "__all__",
        repartitionCommercial: bareme.repartitionCommercial ?? 100,
        repartitionManager: bareme.repartitionManager ?? 0,
        repartitionAgence: bareme.repartitionAgence ?? 0,
        repartitionEntreprise: bareme.repartitionEntreprise ?? 0,
        dateFin: bareme.dateFin ? new Date(bareme.dateFin).toISOString().split("T")[0] : "",
        motifModification: "",
      })
    }
  }, [open, bareme, form])

  const typeCalcul = form.watch("typeCalcul")
  const recurrenceActive = form.watch("recurrenceActive")

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      reset()
      form.reset()
    }
  }

  const handleToggleActif = async () => {
    const result = await toggle(bareme.id, !bareme.actif)
    if (result) {
      toast.success(bareme.actif ? "Barème désactivé" : "Barème activé")
      onSuccess?.(result)
    }
  }

  const onSubmit = async (data: EditBaremeFormValues) => {
    const result = await update(bareme.id, {
      nom: data.nom,
      description: data.description || undefined,
      typeCalcul: data.typeCalcul,
      baseCalcul: data.baseCalcul,
      montantFixe: data.montantFixe || undefined,
      tauxPourcentage: data.tauxPourcentage || undefined,
      precomptee: data.precomptee,
      recurrenceActive: data.recurrenceActive,
      tauxRecurrence: data.recurrenceActive ? data.tauxRecurrence : undefined,
      dureeRecurrenceMois: data.recurrenceActive ? data.dureeRecurrenceMois : undefined,
      dureeReprisesMois: data.dureeReprisesMois,
      tauxReprise: data.tauxReprise,
      typeProduit: data.typeProduit && data.typeProduit !== "__all__" ? data.typeProduit : undefined,
      profilRemuneration: data.profilRemuneration && data.profilRemuneration !== "__all__" ? data.profilRemuneration : undefined,
      canalVente: data.canalVente && data.canalVente !== "__all__" ? data.canalVente as "terrain" | "web" | "televente" : undefined,
      repartitionCommercial: data.repartitionCommercial,
      repartitionManager: data.repartitionManager,
      repartitionAgence: data.repartitionAgence,
      repartitionEntreprise: data.repartitionEntreprise,
      dateFin: data.dateFin || undefined,
      motifModification: data.motifModification || undefined,
    })

    if (result) {
      toast.success("Barème modifié avec succès")
      onSuccess?.(result)
      handleOpenChange(false)
    }
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-5" />
            Modifier le barème
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span className="font-mono">{bareme.code}</span>
            <Badge variant={bareme.actif ? "default" : "secondary"}>
              {bareme.actif ? "Actif" : "Inactif"}
            </Badge>
            <Badge variant="outline">v{bareme.version}</Badge>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="max-h-[55vh] pr-4">
              <div className="space-y-6 pb-4">
                {/* Info lecture seule */}
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Date d&apos;effet: </span>
                      <span className="font-medium">{formatDate(bareme.dateEffet)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Créé le: </span>
                      <span className="font-medium">{formatDate(bareme.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Informations de base */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Informations de base</h3>
                  <FormField
                    control={form.control}
                    name="nom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom *</FormLabel>
                        <FormControl>
                          <Input placeholder="Barème VRP Télécom" {...field} />
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Description du barème..."
                            className="resize-none"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Type de calcul */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Configuration du calcul</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="typeCalcul"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de calcul *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={loadingConfig}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {typesCalcul.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
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
                      name="baseCalcul"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base de calcul *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={loadingConfig}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {typesBase.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Montants selon type */}
                  <div className="grid grid-cols-2 gap-4">
                    {(typeCalcul === "fixe" || typeCalcul === "mixte") && (
                      <FormField
                        control={form.control}
                        name="montantFixe"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Montant fixe (EUR)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                              <Input type="number" step="0.1" min="0" max="100" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Commission précomptée */}
                  <FormField
                    control={form.control}
                    name="precomptee"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Commission précomptée</FormLabel>
                          <FormDescription>
                            Commission versée en une seule fois à la signature du contrat
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Filtres d'application */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Filtres d&apos;application</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="typeProduit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de produit</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={loadingConfig}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Tous les produits" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="__all__">Tous les produits</SelectItem>
                              {typesProduit.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
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
                      name="profilRemuneration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profil de rémunération</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={loadingConfig}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Tous les profils" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="__all__">Tous les profils</SelectItem>
                              {typesApporteur.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
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
                      name="canalVente"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Canal de vente</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Tous les canaux" />
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
                  </div>
                </div>

                <Separator />

                {/* Répartition */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Répartition de la commission</h3>
                  <FormDescription>
                    Définissez comment la commission est répartie entre les différents acteurs. Le total doit être égal à 100%.
                  </FormDescription>
                  <div className="grid grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="repartitionCommercial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commercial (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" min="0" max="100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="repartitionManager"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manager (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" min="0" max="100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="repartitionAgence"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agence (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" min="0" max="100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="repartitionEntreprise"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entreprise (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" min="0" max="100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Récurrence */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Récurrence</h3>
                  <FormField
                    control={form.control}
                    name="recurrenceActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Activer la récurrence</FormLabel>
                          <FormDescription>
                            Versement de commissions récurrentes sur plusieurs mois
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {recurrenceActive && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tauxRecurrence"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Taux de récurrence (%)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" min="0" max="100" placeholder="0" {...field} />
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
                            <FormLabel>Durée (mois)</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" max="60" placeholder="12" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Reprises */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Configuration des reprises</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dureeReprisesMois"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fenêtre de reprise</FormLabel>
                          <Select
                            onValueChange={(v) => field.onChange(parseInt(v))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {dureesReprise.map((duree) => (
                                <SelectItem key={duree.value} value={duree.value.toString()}>
                                  {duree.label}
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
                      name="tauxReprise"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taux de reprise (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" min="0" max="100" placeholder="100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Date de fin et motif */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Fin de validité</h3>
                  <FormField
                    control={form.control}
                    name="dateFin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de fin</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>Laisser vide pour une durée illimitée</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="motifModification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motif de modification</FormLabel>
                        <FormControl>
                          <Input placeholder="Raison de la modification..." {...field} />
                        </FormControl>
                        <FormDescription>Optionnel - sera enregistré dans l&apos;historique</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Erreur API */}
                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="size-4" />
                      <span className="font-medium">Erreur</span>
                    </div>
                    <p className="mt-1 text-sm text-destructive">{error.message}</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="mt-4 gap-2">
              <Button
                type="button"
                variant={bareme.actif ? "destructive" : "outline"}
                onClick={handleToggleActif}
                disabled={toggleLoading}
                className="mr-auto"
              >
                {toggleLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
                {bareme.actif ? "Désactiver" : "Activer"}
              </Button>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading || loadingConfig}>
                {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
