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
import { AlertTriangle, Pencil } from "lucide-react"
import { toast } from "sonner"
import { updateBareme, toggleBaremeActif } from "@/actions/commissions"
import { getGammesByOrganisation, getProduitsByOrganisation } from "@/actions/catalogue"
import { useOrganisation } from "@/contexts/organisation-context"
import type { Gamme, Produit } from "@proto-frontend/products/products"
import type { TypeOption, DureeOption } from "@/hooks/commissions/use-commission-config"
import type { BaremeCommissionResponseDto } from "@/types/commission"

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
  gammeId: z.string().optional(),
  produitId: z.string().optional(),
  profilRemuneration: z.string().optional(),
  canalVente: z.string().optional(),
  dateFin: z.string().optional(),
  motifModification: z.string().max(200, "200 caractères maximum").optional(),
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
  gammeId?: string
  produitId?: string
  profilRemuneration?: string
  canalVente?: string
  dateFin?: string
  motifModification?: string
}

interface EditBaremeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bareme: BaremeCommissionResponseDto
  typesCalcul: TypeOption[]
  typesBase: TypeOption[]
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
  typesApporteur,
  dureesReprise,
  loadingConfig,
  onSuccess,
}: EditBaremeDialogProps) {
  const { activeOrganisation } = useOrganisation()

  // Local state for loading and error
  const [loading, setLoading] = React.useState(false)
  const [toggleLoading, setToggleLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  // State for gammes and produits (replace hooks)
  const [gammes, setGammes] = React.useState<Gamme[]>([])
  const [produits, setProduits] = React.useState<Produit[]>([])
  const [loadingGammes, setLoadingGammes] = React.useState(false)
  const [loadingProduits, setLoadingProduits] = React.useState(false)
  const [selectedGammeId, setSelectedGammeId] = React.useState<string | undefined>(
    (bareme as { gammeId?: string }).gammeId || undefined
  )

  // Fetch gammes when dialog opens
  React.useEffect(() => {
    if (!open || !activeOrganisation?.organisationId) return

    setLoadingGammes(true)
    getGammesByOrganisation({ organisationId: activeOrganisation.organisationId })
      .then((result) => {
        if (result.data) {
          setGammes(result.data.gammes || [])
        }
      })
      .finally(() => setLoadingGammes(false))
  }, [open, activeOrganisation?.organisationId])

  // Fetch produits when gamme is selected
  React.useEffect(() => {
    if (!selectedGammeId || !activeOrganisation?.organisationId) {
      setProduits([])
      return
    }

    setLoadingProduits(true)
    getProduitsByOrganisation({
      organisationId: activeOrganisation.organisationId,
      gammeId: selectedGammeId,
    })
      .then((result) => {
        if (result.data) {
          setProduits(result.data.produits || [])
        }
      })
      .finally(() => setLoadingProduits(false))
  }, [selectedGammeId, activeOrganisation?.organisationId])

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
      gammeId: (bareme as { gammeId?: string }).gammeId || "",
      produitId: (bareme as { produitId?: string }).produitId || "",
      profilRemuneration: bareme.profilRemuneration || "__all__",
      canalVente: bareme.canalVente || "__all__",
      dateFin: bareme.dateFin ? new Date(bareme.dateFin).toISOString().split("T")[0] : "",
      motifModification: "",
    },
  })

  // Reset form when bareme changes
  React.useEffect(() => {
    if (open) {
      const baremeWithGamme = bareme as { gammeId?: string; produitId?: string }
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
        gammeId: baremeWithGamme.gammeId || "",
        produitId: baremeWithGamme.produitId || "",
        profilRemuneration: bareme.profilRemuneration || "__all__",
        canalVente: bareme.canalVente || "__all__",
        dateFin: bareme.dateFin ? new Date(bareme.dateFin).toISOString().split("T")[0] : "",
        motifModification: "",
      })
      setSelectedGammeId(baremeWithGamme.gammeId || undefined)
    }
  }, [open, bareme, form])

  const typeCalcul = form.watch("typeCalcul")
  const recurrenceActive = form.watch("recurrenceActive")

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      setError(null)
      form.reset()
      setSelectedGammeId(undefined)
    }
  }

  const handleToggleActif = async () => {
    setToggleLoading(true)
    const result = await toggleBaremeActif(bareme.id, !bareme.actif)
    setToggleLoading(false)

    if (result.data) {
      toast.success(bareme.actif ? "Barème désactivé" : "Barème activé")
      // Return updated bareme with toggled actif status
      onSuccess?.({ ...bareme, actif: !bareme.actif })
    } else if (result.error) {
      toast.error(result.error)
    }
  }

  const onSubmit = async (data: EditBaremeFormValues) => {
    setLoading(true)
    setError(null)

    const result = await updateBareme({
      id: bareme.id,
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
      dateFin: data.dateFin || undefined,
    })

    setLoading(false)

    if (result.data) {
      toast.success("Barème modifié avec succès")
      // Map to BaremeCommissionResponseDto for onSuccess callback
      const updatedBareme: BaremeCommissionResponseDto = {
        ...bareme,
        nom: data.nom,
        description: data.description ?? null,
        typeCalcul: data.typeCalcul,
        baseCalcul: data.baseCalcul,
        montantFixe: data.montantFixe ?? null,
        tauxPourcentage: data.tauxPourcentage ?? null,
        precomptee: data.precomptee,
        recurrenceActive: data.recurrenceActive,
        tauxRecurrence: data.tauxRecurrence ?? null,
        dureeRecurrenceMois: data.dureeRecurrenceMois ?? null,
        dureeReprisesMois: data.dureeReprisesMois,
        tauxReprise: data.tauxReprise,
        profilRemuneration: data.profilRemuneration && data.profilRemuneration !== "__all__" ? data.profilRemuneration as BaremeCommissionResponseDto["profilRemuneration"] : null,
        canalVente: data.canalVente && data.canalVente !== "__all__" ? data.canalVente as BaremeCommissionResponseDto["canalVente"] : null,
        dateFin: data.dateFin ?? null,
        updatedAt: new Date().toISOString(),
      }
      onSuccess?.(updatedBareme)
      handleOpenChange(false)
    } else {
      setError(new Error(result.error || "Erreur lors de la mise à jour du barème"))
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
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] !grid-rows-[auto_1fr_auto] overflow-hidden">
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="contents">
            <ScrollArea className="h-full max-h-[60vh] pr-4">
              <div className="space-y-6 py-2">
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
                  <div className="grid grid-cols-2 gap-4">
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
                              <SelectTrigger>
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
                              <SelectTrigger>
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
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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

            <DialogFooter className="gap-2 pt-4 border-t">
              <Button
                type="button"
                variant={bareme.actif ? "destructive" : "outline"}
                onClick={handleToggleActif}
                disabled={toggleLoading}
                className="mr-auto"
              >
                {bareme.actif ? "Désactiver" : "Activer"}
              </Button>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading || loadingConfig}>
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
