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
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  Loader2,
  Layers,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import { usePaliersCommission, useCreatePalier, useUpdatePalier, useDeletePalier } from "@/hooks/commissions"
import { useOrganisation } from "@/contexts/organisation-context"
import type { TypeOption } from "@/hooks/commissions/use-commission-config"
import type { BaremeCommissionResponseDto, PalierCommissionResponseDto } from "@/types/commission-dto"

const palierSchema = z.object({
  code: z.string().min(1, "Le code est requis").max(50, "50 caractères maximum"),
  nom: z.string().min(1, "Le nom est requis").max(100, "100 caractères maximum"),
  description: z.string().max(500, "500 caractères maximum").optional(),
  typePalier: z.enum(["volume", "ca", "prime_produit"]),
  seuilMin: z.coerce.number().min(0, "Le seuil minimum doit être positif"),
  seuilMax: z.coerce.number().min(0).optional(),
  montantPrime: z.coerce.number().min(0, "Le montant doit être positif"),
  tauxBonus: z.coerce.number().min(0).max(100).optional(),
  cumulable: z.boolean().default(false),
  parPeriode: z.boolean().default(true),
  typeProduit: z.string().optional(),
  ordre: z.coerce.number().min(0).default(0),
})

interface PalierFormValues {
  code: string
  nom: string
  description?: string
  typePalier: "volume" | "ca" | "prime_produit"
  seuilMin: number
  seuilMax?: number
  montantPrime: number
  tauxBonus?: number
  cumulable: boolean
  parPeriode: boolean
  typeProduit?: string
  ordre: number
}

interface ManagePaliersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bareme: BaremeCommissionResponseDto
  typesPalier: TypeOption[]
  typesProduit: TypeOption[]
  loadingConfig?: boolean
  onSuccess?: () => void
}

export function ManagePaliersDialog({
  open,
  onOpenChange,
  bareme,
  typesPalier,
  typesProduit,
  loadingConfig,
  onSuccess,
}: ManagePaliersDialogProps) {
  const { activeOrganisation } = useOrganisation()
  const { paliers, loading: loadingPaliers, refetch } = usePaliersCommission({ baremeId: bareme.id })
  const { loading: createLoading, error: createError, create, reset: resetCreate } = useCreatePalier()
  const { loading: updateLoading, error: updateError, update, reset: resetUpdate } = useUpdatePalier()
  const { loading: deleteLoading, deletePalier } = useDeletePalier()

  const [showForm, setShowForm] = React.useState(false)
  const [editingPalier, setEditingPalier] = React.useState<PalierCommissionResponseDto | null>(null)
  const [deletingPalier, setDeletingPalier] = React.useState<PalierCommissionResponseDto | null>(null)

  const form = useForm<PalierFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(palierSchema) as any,
    defaultValues: {
      code: "",
      nom: "",
      description: "",
      typePalier: undefined,
      seuilMin: 0,
      seuilMax: undefined,
      montantPrime: 0,
      tauxBonus: undefined,
      cumulable: false,
      parPeriode: true,
      typeProduit: "__all__",
      ordre: paliers.length,
    },
  })

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      setShowForm(false)
      setEditingPalier(null)
      resetCreate()
      resetUpdate()
      form.reset()
    }
  }

  const handleNewPalier = () => {
    setEditingPalier(null)
    form.reset({
      code: "",
      nom: "",
      description: "",
      typePalier: undefined,
      seuilMin: 0,
      seuilMax: undefined,
      montantPrime: 0,
      tauxBonus: undefined,
      cumulable: false,
      parPeriode: true,
      typeProduit: "__all__",
      ordre: paliers.length,
    })
    setShowForm(true)
  }

  const handleEditPalier = (palier: PalierCommissionResponseDto) => {
    setEditingPalier(palier)
    form.reset({
      code: palier.code,
      nom: palier.nom,
      description: palier.description || "",
      typePalier: palier.typePalier,
      seuilMin: palier.seuilMin,
      seuilMax: palier.seuilMax ?? undefined,
      montantPrime: palier.montantPrime,
      tauxBonus: palier.tauxBonus ?? undefined,
      cumulable: palier.cumulable,
      parPeriode: palier.parPeriode,
      typeProduit: palier.typeProduit || "__all__",
      ordre: palier.ordre,
    })
    setShowForm(true)
  }

  const handleDeletePalier = async () => {
    if (!deletingPalier) return

    const success = await deletePalier(deletingPalier.id)
    if (success) {
      toast.success("Palier supprimé")
      refetch()
      onSuccess?.()
    } else {
      toast.error("Erreur lors de la suppression")
    }
    setDeletingPalier(null)
  }

  const onSubmit = async (data: PalierFormValues) => {
    if (!activeOrganisation) {
      toast.error("Aucune organisation sélectionnée")
      return
    }

    if (editingPalier) {
      // Update
      const result = await update(editingPalier.id, {
        nom: data.nom,
        description: data.description || undefined,
        typePalier: data.typePalier,
        seuilMin: data.seuilMin,
        seuilMax: data.seuilMax || undefined,
        montantPrime: data.montantPrime,
        tauxBonus: data.tauxBonus || undefined,
        cumulable: data.cumulable,
        parPeriode: data.parPeriode,
        typeProduit: data.typeProduit && data.typeProduit !== "__all__" ? data.typeProduit : undefined,
        ordre: data.ordre,
      })

      if (result) {
        toast.success("Palier modifié avec succès")
        refetch()
        onSuccess?.()
        setShowForm(false)
        setEditingPalier(null)
      }
    } else {
      // Create
      const result = await create({
        organisationId: activeOrganisation.id,
        baremeId: bareme.id,
        code: data.code,
        nom: data.nom,
        description: data.description || undefined,
        typePalier: data.typePalier,
        seuilMin: data.seuilMin,
        seuilMax: data.seuilMax || undefined,
        montantPrime: data.montantPrime,
        tauxBonus: data.tauxBonus || undefined,
        cumulable: data.cumulable,
        parPeriode: data.parPeriode,
        typeProduit: data.typeProduit && data.typeProduit !== "__all__" ? data.typeProduit : undefined,
        ordre: data.ordre,
      })

      if (result) {
        toast.success("Palier créé avec succès")
        refetch()
        onSuccess?.()
        setShowForm(false)
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const getTypePalierLabel = (value: string) => {
    const type = typesPalier.find((t) => t.value === value)
    return type?.label || value
  }

  const error = createError || updateError

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="size-5" />
              Gestion des paliers
            </DialogTitle>
            <DialogDescription>
              Barème: <span className="font-mono">{bareme.code}</span> — {bareme.nom}
            </DialogDescription>
          </DialogHeader>

          {showForm ? (
            // Formulaire de création/édition
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <ScrollArea className="max-h-[55vh] pr-4">
                  <div className="space-y-4 pb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="PAL-001"
                                {...field}
                                disabled={!!editingPalier}
                              />
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
                              <Input placeholder="Palier Bronze" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Description du palier..."
                              className="resize-none"
                              rows={2}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="typePalier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type de palier *</FormLabel>
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
                                {typesPalier.map((type) => (
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
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="seuilMin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seuil minimum *</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="seuilMax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seuil maximum</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="1" placeholder="∞" {...field} />
                            </FormControl>
                            <FormDescription>Vide = illimité</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="ordre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ordre</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="montantPrime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Montant prime (EUR) *</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tauxBonus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Taux bonus (%)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" max="100" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cumulable"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Cumulable</FormLabel>
                              <FormDescription>Peut être cumulé avec d&apos;autres paliers</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="parPeriode"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Par période</FormLabel>
                              <FormDescription>Réinitialisé chaque période</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

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

                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Retour
                  </Button>
                  <Button type="submit" disabled={createLoading || updateLoading}>
                    {(createLoading || updateLoading) && <Loader2 className="size-4 mr-2 animate-spin" />}
                    {editingPalier ? "Modifier" : "Créer"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            // Liste des paliers
            <>
              <div className="flex justify-end mb-4">
                <Button onClick={handleNewPalier} className="gap-2">
                  <Plus className="size-4" />
                  Nouveau palier
                </Button>
              </div>

              <ScrollArea className="max-h-[55vh]">
                {loadingPaliers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                  </div>
                ) : paliers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Layers className="size-12 mb-2 opacity-50" />
                    <p>Aucun palier configuré</p>
                    <p className="text-sm">Cliquez sur &quot;Nouveau palier&quot; pour en créer un</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Seuil min</TableHead>
                        <TableHead className="text-right">Seuil max</TableHead>
                        <TableHead className="text-right">Prime</TableHead>
                        <TableHead className="text-center">Actif</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paliers.map((palier) => (
                        <TableRow key={palier.id}>
                          <TableCell className="font-mono text-xs">{palier.code}</TableCell>
                          <TableCell className="font-medium">{palier.nom}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">
                              {getTypePalierLabel(palier.typePalier)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{palier.seuilMin}</TableCell>
                          <TableCell className="text-right">{palier.seuilMax ?? "∞"}</TableCell>
                          <TableCell className="text-right text-success font-medium">
                            {formatCurrency(palier.montantPrime)}
                          </TableCell>
                          <TableCell className="text-center">
                            {palier.actif ? (
                              <CheckCircle2 className="size-4 text-success inline" />
                            ) : (
                              <XCircle className="size-4 text-muted-foreground inline" />
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditPalier(palier)}>
                                  <Pencil className="size-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeletingPalier(palier)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="size-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Fermer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deletingPalier} onOpenChange={(open) => !open && setDeletingPalier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce palier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le palier &quot;{deletingPalier?.nom}&quot; sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePalier}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
