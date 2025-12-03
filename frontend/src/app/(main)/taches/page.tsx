"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/data-table-basic"
import { getColumns } from "./columns"
import { CreateTacheDialog } from "./create-tache-dialog"
import { useTaches, useTacheStats, useTacheMutations } from "@/hooks/taches"
import { useOrganisation } from "@/contexts/organisation-context"
import {
  Plus,
  ListTodo,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import type { TacheDto, TacheStatut } from "@/types/tache"
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

export default function TachesPage() {
  const { activeOrganisation } = useOrganisation()
  const [activeTab, setActiveTab] = React.useState<string>("toutes")
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedTache, setSelectedTache] = React.useState<TacheDto | null>(null)

  // Déterminer le filtre statut basé sur l'onglet actif
  const statutFilter = React.useMemo(() => {
    switch (activeTab) {
      case 'a_faire':
        return 'A_FAIRE' as TacheStatut
      case 'en_cours':
        return 'EN_COURS' as TacheStatut
      case 'terminees':
        return 'TERMINEE' as TacheStatut
      case 'en_retard':
        return undefined // Géré par enRetard
      default:
        return undefined
    }
  }, [activeTab])

  const enRetardFilter = activeTab === 'en_retard'

  const { taches, loading, refetch } = useTaches({
    organisationId: activeOrganisation?.id,
    statut: statutFilter,
    enRetard: enRetardFilter ? true : undefined,
  })

  const { stats, refetch: refetchStats } = useTacheStats(activeOrganisation?.id)
  const { marquerEnCours, marquerTerminee, marquerAnnulee, deleteTache } = useTacheMutations()

  const handleStart = async (tache: TacheDto) => {
    const result = await marquerEnCours(tache.id)
    if (result) {
      toast.success("Tâche démarrée")
      refetch()
      refetchStats()
    } else {
      toast.error("Erreur lors du démarrage de la tâche")
    }
  }

  const handleComplete = async (tache: TacheDto) => {
    const result = await marquerTerminee(tache.id)
    if (result) {
      toast.success("Tâche terminée")
      refetch()
      refetchStats()
    } else {
      toast.error("Erreur lors de la complétion de la tâche")
    }
  }

  const handleCancel = async (tache: TacheDto) => {
    const result = await marquerAnnulee(tache.id)
    if (result) {
      toast.success("Tâche annulée")
      refetch()
      refetchStats()
    } else {
      toast.error("Erreur lors de l'annulation de la tâche")
    }
  }

  const handleDeleteClick = (tache: TacheDto) => {
    setSelectedTache(tache)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedTache) return

    const result = await deleteTache(selectedTache.id)
    if (result) {
      toast.success("Tâche supprimée")
      refetch()
      refetchStats()
    } else {
      toast.error("Erreur lors de la suppression de la tâche")
    }
    setDeleteDialogOpen(false)
    setSelectedTache(null)
  }

  const handleSuccess = () => {
    refetch()
    refetchStats()
  }

  const columns = React.useMemo(
    () =>
      getColumns({
        onStart: handleStart,
        onComplete: handleComplete,
        onCancel: handleCancel,
        onDelete: handleDeleteClick,
      }),
    []
  )

  return (
    <main className="flex flex-1 flex-col gap-4 min-h-0">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">À faire</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.aFaire ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.enCours ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminées</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.terminee ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="border-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">En retard</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.enRetard ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="flex-1 min-h-0 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mes tâches</CardTitle>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle tâche
          </Button>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
            <TabsList>
              <TabsTrigger value="toutes">Toutes</TabsTrigger>
              <TabsTrigger value="a_faire">À faire</TabsTrigger>
              <TabsTrigger value="en_cours">En cours</TabsTrigger>
              <TabsTrigger value="terminees">Terminées</TabsTrigger>
              <TabsTrigger value="en_retard" className="text-destructive">
                En retard
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0 mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Chargement...</p>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={taches}
                  headerClassName="bg-sidebar hover:bg-sidebar"
                />
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <CreateTacheDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la tâche ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La tâche &quot;{selectedTache?.titre}&quot; sera
              définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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
