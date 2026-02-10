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
  Layers,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Euro,
  Target,
} from "lucide-react"
import { toast } from "sonner"
import {
  getPaliersByBareme,
  createPalier as createPalierAction,
  updatePalier as updatePalierAction,
  deletePalier as deletePalierAction,
} from "@/actions/commissions"
import { useOrganisation } from "@/contexts/organisation-context"
import type { TypeOption } from "@/hooks/commissions/use-commission-config"
import type { BaremeWithPaliers, PalierDisplay } from "@/lib/ui/display-types/commission"
import { formatMontant, parseMontant } from "@/lib/ui/helpers/format"

const palierSchema = z.object({
  code: z.string().min(1, "Le code est requis").max(50, "50 caractères maximum"),
  nom: z.string().min(1, "Le nom est requis").max(100, "100 caractères maximum"),
  typePalier: z.enum(["volume", "ca", "prime_produit"]),
  seuilMin: z.coerce.number().min(0, "Le seuil minimum doit être positif"),
  seuilMax: z.coerce.number().min(0).optional(),
  montantPrime: z.coerce.number().min(0, "Le montant doit être positif"),
  tauxBonus: z.coerce.number().min(0).max(100).optional(),
  cumulable: z.boolean().default(false),
  parPeriode: z.boolean().default(true),
  ordre: z.coerce.number().min(0).default(0),
})

interface PalierFormValues {
  code: string
  nom: string
  typePalier: "volume" | "ca" | "prime_produit"
  seuilMin: number
  seuilMax?: number
  montantPrime: number
  tauxBonus?: number
  cumulable: boolean
  parPeriode: boolean
  ordre: number
}

interface ManagePaliersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bareme: BaremeWithPaliers
  typesPalier: TypeOption[]
  loadingConfig?: boolean
  onSuccess?: () => void
}

export function ManagePaliersDialog({
  open,
  onOpenChange,
  bareme,
  typesPalier,
  loadingConfig,
  onSuccess,
}: ManagePaliersDialogProps) {
  const { activeOrganisation } = useOrganisation()

  // Local state for paliers list
  const [paliers, setPaliers] = React.useState<PalierDisplay[]>([])
  const [loadingPaliers, setLoadingPaliers] = React.useState(false)

  // Local state for loading and error
  const [createLoading, setCreateLoading] = React.useState(false)
  const [updateLoading, setUpdateLoading] = React.useState(false)
  const [deleteLoading, setDeleteLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const [showForm, setShowForm] = React.useState(false)
  const [editingPalier, setEditingPalier] = React.useState<PalierDisplay | null>(null)
  const [deletingPalier, setDeletingPalier] = React.useState<PalierDisplay | null>(null)

  // Fetch paliers when dialog opens
  const fetchPaliers = React.useCallback(async () => {
    setLoadingPaliers(true)
    const result = await getPaliersByBareme(bareme.id)
    setLoadingPaliers(false)
    if (result.data) {
      setPaliers((result.data.paliers || []) as PalierDisplay[])
    }
  }, [bareme.id])

  React.useEffect(() => {
    if (open) {
      fetchPaliers()
    }
  }, [open, fetchPaliers])

  const form = useForm<PalierFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(palierSchema) as any,
    defaultValues: {
      code: "",
      nom: "",
      typePalier: undefined,
      seuilMin: 0,
      seuilMax: undefined,
      montantPrime: 0,
      tauxBonus: undefined,
      cumulable: false,
      parPeriode: true,
      ordre: paliers.length,
    },
  })

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      setShowForm(false)
      setEditingPalier(null)
      setError(null)
      form.reset()
    }
  }

  const handleNewPalier = () => {
    setEditingPalier(null)
    form.reset({
      code: "",
      nom: "",
      typePalier: undefined,
      seuilMin: 0,
      seuilMax: undefined,
      montantPrime: 0,
      tauxBonus: undefined,
      cumulable: false,
      parPeriode: true,
      ordre: paliers.length,
    })
    setShowForm(true)
  }

  const handleEditPalier = (palier: PalierDisplay) => {
    setEditingPalier(palier)
    form.reset({
      code: palier.code,
      nom: palier.nom,
      typePalier: palier.typePalier,
      seuilMin: parseMontant(palier.seuilMin),
      seuilMax: palier.seuilMax != null ? parseMontant(palier.seuilMax) : undefined,
      montantPrime: parseMontant(palier.montantPrime),
      tauxBonus: palier.tauxBonus != null ? parseMontant(palier.tauxBonus) : undefined,
      cumulable: palier.cumulable,
      parPeriode: palier.parPeriode,
      ordre: palier.ordre,
    })
    setShowForm(true)
  }

  const handleDeletePalier = async () => {
    if (!deletingPalier) return

    setDeleteLoading(true)
    const result = await deletePalierAction(deletingPalier.id)
    setDeleteLoading(false)

    if (result.data?.success) {
      toast.success("Palier supprimé")
      fetchPaliers()
      onSuccess?.()
    } else {
      toast.error(result.error || "Erreur lors de la suppression")
    }
    setDeletingPalier(null)
  }

  const onSubmit = async (data: PalierFormValues) => {
    if (!activeOrganisation) {
      toast.error("Aucune organisation sélectionnée")
      return
    }

    setError(null)

    if (editingPalier) {
      setUpdateLoading(true)
      const result = await updatePalierAction({
        id: editingPalier.id,
        nom: data.nom,
        seuilMin: data.seuilMin.toString(),
        seuilMax: data.seuilMax?.toString(),
        montantPrime: data.montantPrime.toString(),
        tauxBonus: data.tauxBonus?.toString(),
        cumulable: data.cumulable,
        parPeriode: data.parPeriode,
        ordre: data.ordre,
      })
      setUpdateLoading(false)

      if (result.data) {
        toast.success("Palier modifié")
        fetchPaliers()
        onSuccess?.()
        setShowForm(false)
        setEditingPalier(null)
      } else {
        setError(new Error(result.error || "Erreur lors de la modification du palier"))
      }
    } else {
      setCreateLoading(true)
      const result = await createPalierAction({
        organisationId: activeOrganisation.organisationId,
        baremeId: bareme.id,
        code: data.code,
        nom: data.nom,
        typePalier: data.typePalier.toUpperCase(),
        seuilMin: data.seuilMin.toString(),
        seuilMax: data.seuilMax?.toString(),
        montantPrime: data.montantPrime.toString(),
        tauxBonus: data.tauxBonus?.toString(),
        cumulable: data.cumulable,
        parPeriode: data.parPeriode,
        ordre: data.ordre,
      })
      setCreateLoading(false)

      if (result.data) {
        toast.success("Palier créé")
        fetchPaliers()
        onSuccess?.()
        setShowForm(false)
      } else {
        setError(new Error(result.error || "Erreur lors de la création du palier"))
      }
    }
  }

  const formatCurrencyStr = (amount: string) => {
    return formatMontant(amount)
  }

  const getTypePalierLabel = (value: string) => {
    const type = typesPalier.find((t) => t.value === value)
    return type?.label || value
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[750px] max-h-[85vh] !grid-rows-[auto_1fr_auto] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="size-5" />
              {showForm ? (editingPalier ? "Modifier le palier" : "Nouveau palier") : "Gestion des paliers"}
            </DialogTitle>
            <DialogDescription>
              Barème: <span className="font-mono font-medium">{bareme.code}</span> — {bareme.nom}
            </DialogDescription>
          </DialogHeader>

          {showForm ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col min-h-0 flex-1">
                <ScrollArea className="flex-1 pr-4">
                  <div className="grid grid-cols-2 gap-4 pb-4">
                    {/* Ligne 1: Code et Nom */}
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
                              className="w-full"
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
                            <Input placeholder="Palier Bronze" {...field} className="w-full" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Ligne 2: Type et Ordre */}
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
                              <SelectTrigger className="w-full">
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
                      name="ordre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ordre d&apos;évaluation</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="1" {...field} className="w-full" />
                          </FormControl>
                          <FormDescription>Priorité (0 = premier)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Ligne 3: Seuils */}
                    <FormField
                      control={form.control}
                      name="seuilMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            <Target className="size-3.5" />
                            Seuil minimum *
                          </FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="1" placeholder="0" {...field} className="w-full" />
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
                          <FormLabel className="flex items-center gap-1.5">
                            <Target className="size-3.5" />
                            Seuil maximum
                          </FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="1" placeholder="∞ (illimité)" {...field} className="w-full" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Ligne 4: Montants */}
                    <FormField
                      control={form.control}
                      name="montantPrime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            <Euro className="size-3.5" />
                            Montant prime *
                          </FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} className="w-full" />
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
                            <Input type="number" min="0" max="100" step="0.1" placeholder="0" {...field} className="w-full" />
                          </FormControl>
                          <FormDescription>Bonus additionnel</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Ligne 5: Options (switches) */}
                    <FormField
                      control={form.control}
                      name="cumulable"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">Cumulable</FormLabel>
                            <FormDescription className="text-xs">Avec d&apos;autres paliers</FormDescription>
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
                            <FormLabel className="text-sm">Par période</FormLabel>
                            <FormDescription className="text-xs">Réinitialisé chaque mois</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
                      <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertTriangle className="size-4" />
                        <span>{error.message}</span>
                      </div>
                    </div>
                  )}
                </ScrollArea>

                <DialogFooter className="pt-4 border-t">
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="gap-2">
                    <ArrowLeft className="size-4" />
                    Retour
                  </Button>
                  <Button type="submit" disabled={createLoading || updateLoading}>
                    {editingPalier ? "Enregistrer" : "Créer le palier"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <div className="flex flex-col min-h-0 flex-1">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {paliers.length} palier{paliers.length > 1 ? "s" : ""} configuré{paliers.length > 1 ? "s" : ""}
                </p>
                <Button onClick={handleNewPalier} size="sm" className="gap-2">
                  <Plus className="size-4" />
                  Nouveau palier
                </Button>
              </div>

              <ScrollArea className="flex-1">
                {paliers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Layers className="size-12 mb-3 opacity-40" />
                    <p className="font-medium">Aucun palier configuré</p>
                    <p className="text-sm mt-1">Créez des paliers pour définir des primes progressives</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Code</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Seuil</TableHead>
                        <TableHead className="text-right">Prime</TableHead>
                        <TableHead className="text-center w-[60px]">Actif</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paliers.map((palier) => (
                        <TableRow key={palier.id} className="group">
                          <TableCell className="font-mono text-xs text-muted-foreground">{palier.code}</TableCell>
                          <TableCell className="font-medium">{palier.nom}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {getTypePalierLabel(palier.typePalier)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {palier.seuilMin} — {palier.seuilMax ?? "∞"}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600 tabular-nums">
                            {formatCurrencyStr(palier.montantPrime)}
                          </TableCell>
                          <TableCell className="text-center">
                            {palier.actif ? (
                              <CheckCircle2 className="size-4 text-green-600 inline" />
                            ) : (
                              <XCircle className="size-4 text-muted-foreground inline" />
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
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

              <DialogFooter className="pt-4 border-t">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Fermer
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
