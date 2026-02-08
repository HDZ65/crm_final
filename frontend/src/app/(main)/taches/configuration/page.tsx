"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useOrganisation } from "@/contexts/organisation-context"
import {
  listReglesRelance,
  createRegleRelance,
  updateRegleRelance,
  deleteRegleRelance,
  activerRegleRelance,
  desactiverRegleRelance,
  listHistoriqueRelances,
  executerRelances,
} from "@/actions/relance"
import {
  Plus,
  Play,
  Trash2,
  Edit2,
  History,
  Settings2,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronLeft,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import type { RegleRelanceDto, RelanceDeclencheur, RelanceActionType } from "@/types/regle-relance"
import { DECLENCHEUR_LABELS, ACTION_TYPE_LABELS } from "@/types/regle-relance"
import { TACHE_PRIORITE_LABELS } from "@/types/tache"

const formSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  declencheur: z.enum(['IMPAYE', 'CONTRAT_BIENTOT_EXPIRE', 'CONTRAT_EXPIRE', 'NOUVEAU_CLIENT', 'INACTIVITE_CLIENT']),
  delaiJours: z.number().min(0, "Le délai doit être positif"),
  actionType: z.enum(['CREER_TACHE', 'ENVOYER_EMAIL', 'NOTIFICATION', 'TACHE_ET_EMAIL']),
  prioriteTache: z.enum(['HAUTE', 'MOYENNE', 'BASSE']),
  templateTitreTache: z.string().optional(),
  templateDescriptionTache: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function ConfigurationRelancesPage() {
  const { activeOrganisation } = useOrganisation()

  // State for data from Server Actions
  const [regles, setRegles] = React.useState<RegleRelanceDto[]>([])
  const [historique, setHistorique] = React.useState<import("@/types/regle-relance").HistoriqueRelanceDto[]>([])
  const [loading, setLoading] = React.useState(false)
  const [mutationLoading, setMutationLoading] = React.useState(false)

   const [dialogOpen, setDialogOpen] = React.useState(false)
   const [editingRegle, setEditingRegle] = React.useState<RegleRelanceDto | null>(null)
   const [deleteRegleDialogOpen, setDeleteRegleDialogOpen] = React.useState(false)
  const [regleToDelete, setRegleToDelete] = React.useState<RegleRelanceDto | null>(null)

  // Fetch regles
  const fetchRegles = React.useCallback(async () => {
    if (!activeOrganisation?.organisationId) return
    setLoading(true)
    const result = await listReglesRelance(activeOrganisation.organisationId)
    if (result.data) {
      setRegles(result.data)
    }
    setLoading(false)
  }, [activeOrganisation?.organisationId])

  // Fetch historique
  const fetchHistorique = React.useCallback(async () => {
    if (!activeOrganisation?.organisationId) return
    const result = await listHistoriqueRelances(activeOrganisation.organisationId, { limit: 20 })
    if (result.data) {
      setHistorique(result.data)
    }
  }, [activeOrganisation?.organisationId])

  // Initial fetch
  React.useEffect(() => {
    fetchRegles()
    fetchHistorique()
  }, [fetchRegles, fetchHistorique])

  const refetch = React.useCallback(() => {
    fetchRegles()
    fetchHistorique()
  }, [fetchRegles, fetchHistorique])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: "",
      description: "",
      declencheur: "IMPAYE",
      delaiJours: 15,
      actionType: "CREER_TACHE",
      prioriteTache: "MOYENNE",
      templateTitreTache: "",
      templateDescriptionTache: "",
    },
  })

  const handleOpenDialog = (regle?: RegleRelanceDto) => {
    if (regle) {
      setEditingRegle(regle)
      form.reset({
        nom: regle.nom,
        description: regle.description || "",
        declencheur: regle.declencheur,
        delaiJours: regle.delaiJours,
        actionType: regle.actionType,
        prioriteTache: regle.prioriteTache,
        templateTitreTache: regle.templateTitreTache || "",
        templateDescriptionTache: regle.templateDescriptionTache || "",
      })
    } else {
      setEditingRegle(null)
      form.reset()
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (values: FormValues) => {
    if (!activeOrganisation?.organisationId) return

    setMutationLoading(true)
    if (editingRegle) {
      const result = await updateRegleRelance(editingRegle.id, values)
      if (result.data) {
        toast.success("Règle mise à jour")
        setDialogOpen(false)
        refetch()
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour")
      }
    } else {
      const result = await createRegleRelance({
        ...values,
        organisationId: activeOrganisation.organisationId,
      })
      if (result.data) {
        toast.success("Règle créée")
        setDialogOpen(false)
        refetch()
      } else {
        toast.error(result.error || "Erreur lors de la création")
      }
    }
    setMutationLoading(false)
  }

  const handleToggleActive = async (regle: RegleRelanceDto) => {
    if (regle.actif) {
      const result = await desactiverRegleRelance(regle.id)
      if (result.data) {
        toast.success("Règle désactivée")
        refetch()
      } else {
        toast.error(result.error || "Erreur lors de la désactivation")
      }
    } else {
      const result = await activerRegleRelance(regle.id)
      if (result.data) {
        toast.success("Règle activée")
        refetch()
      } else {
        toast.error(result.error || "Erreur lors de l'activation")
      }
    }
  }

  const handleDeleteClick = (regle: RegleRelanceDto) => {
    setRegleToDelete(regle)
    setDeleteRegleDialogOpen(true)
  }

  const handleDeleteRegleConfirm = async () => {
    if (!regleToDelete) return

    const result = await deleteRegleRelance(regleToDelete.id)
    if (result.data) {
      toast.success("Règle supprimée")
      refetch()
    } else {
      toast.error(result.error || "Erreur lors de la suppression")
    }
    setDeleteRegleDialogOpen(false)
    setRegleToDelete(null)
  }

  const handleExecuteManually = async () => {
    if (!activeOrganisation?.organisationId) return

    setMutationLoading(true)
    const result = await executerRelances(activeOrganisation.organisationId)
    setMutationLoading(false)

    if (result.data?.success) {
      toast.success(result.data.message)
      refetch()
    } else {
      toast.error(result.error || result.data?.message || "Erreur lors de l'exécution")
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-4 min-h-0">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/taches">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Retour aux tâches
        </Link>
      </Button>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configuration des relances</h1>
          <p className="text-muted-foreground">
            Gérez vos règles de relances automatiques
          </p>
        </div>
         <div className="flex gap-2">
           <Button variant="outline" onClick={handleExecuteManually} disabled={mutationLoading}>
            <Play className="mr-2 h-4 w-4" />
            Exécuter maintenant
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle règle
          </Button>
        </div>
      </div>

       <Tabs defaultValue="regles" className="flex-1">
         <TabsList>
           <TabsTrigger value="regles">Règles</TabsTrigger>
           <TabsTrigger value="historique">Historique</TabsTrigger>
         </TabsList>

         <TabsContent value="regles" className="mt-4">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Settings2 className="h-5 w-5" />
                 Règles de relance
               </CardTitle>
               <CardDescription>
                 Les règles actives s&apos;exécutent automatiquement toutes les heures
               </CardDescription>
             </CardHeader>
             <CardContent>
               {loading ? (
                 <p className="text-muted-foreground">Chargement...</p>
               ) : regles.length === 0 ? (
                 <div className="text-center py-8">
                   <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                   <p className="mt-2 text-muted-foreground">Aucune règle configurée</p>
                   <Button className="mt-4" onClick={() => handleOpenDialog()}>
                     <Plus className="mr-2 h-4 w-4" />
                     Créer une règle
                   </Button>
                 </div>
               ) : (
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Nom</TableHead>
                       <TableHead>Déclencheur</TableHead>
                       <TableHead>Délai</TableHead>
                       <TableHead>Action</TableHead>
                       <TableHead>Actif</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {regles.map((regle) => (
                       <TableRow key={regle.id}>
                         <TableCell className="font-medium">{regle.nom}</TableCell>
                         <TableCell>
                           <Badge variant="outline">
                             {DECLENCHEUR_LABELS[regle.declencheur]}
                           </Badge>
                         </TableCell>
                         <TableCell>{regle.delaiJours} jours</TableCell>
                         <TableCell>{ACTION_TYPE_LABELS[regle.actionType]}</TableCell>
                         <TableCell>
                           <Switch
                             checked={regle.actif}
                             onCheckedChange={() => handleToggleActive(regle)}
                           />
                         </TableCell>
                         <TableCell className="text-right">
                           <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => handleOpenDialog(regle)}
                           >
                             <Edit2 className="h-4 w-4" />
                           </Button>
                           <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => handleDeleteClick(regle)}
                           >
                             <Trash2 className="h-4 w-4 text-destructive" />
                           </Button>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               )}
             </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="historique" className="mt-4">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <History className="h-5 w-5" />
                 Historique récent
               </CardTitle>
             </CardHeader>
             <CardContent>
               {historique.length === 0 ? (
                 <p className="text-muted-foreground text-sm">Aucun historique</p>
               ) : (
                 <div className="space-y-3">
                   {historique.map((h) => (
                     <div key={h.id} className="flex items-start gap-2 text-sm">
                       {h.resultat === 'SUCCES' ? (
                         <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                       ) : h.resultat === 'ECHEC' ? (
                         <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                       ) : (
                         <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                       )}
                       <div className="flex-1">
                         <p className="text-muted-foreground">
                           {format(new Date(h.dateExecution), "dd MMM HH:mm", { locale: fr })}
                         </p>
                         {h.messageErreur && (
                           <p className="text-destructive text-xs">{h.messageErreur}</p>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>

      {/* Dialog de création/édition */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingRegle ? "Modifier la règle" : "Nouvelle règle de relance"}
            </DialogTitle>
            <DialogDescription>
              Configurez les paramètres de la règle de relance automatique
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de la règle</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Relance impayé J+15" {...field} />
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
                    <FormLabel>Description (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Description de la règle..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="declencheur"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Déclencheur</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(DECLENCHEUR_LABELS).map(([value, label]) => (
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
                  name="delaiJours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Délai (jours)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                        />
                      </FormControl>
                      <FormDescription>
                        Nombre de jours après le déclencheur
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="actionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type d&apos;action</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => (
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
                  name="prioriteTache"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priorité de la tâche</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(TACHE_PRIORITE_LABELS).map(([value, label]) => (
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
              </div>

              <FormField
                control={form.control}
                name="templateTitreTache"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template du titre (optionnel)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Relance impayé - {{numeroFacture}}"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Variables disponibles: {`{{numeroFacture}}, {{reference}}, {{montant}}, {{dateFin}}`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="templateDescriptionTache"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template de la description (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description de la tâche créée..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={mutationLoading}>
                  {mutationLoading ? "Enregistrement..." : editingRegle ? "Mettre à jour" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteRegleDialogOpen} onOpenChange={setDeleteRegleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la règle ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La règle &quot;{regleToDelete?.nom}&quot; sera
              définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRegleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
