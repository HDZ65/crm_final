"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table-basic"
import { getColumns } from "./columns"
import { CreateTacheDialog } from "./create-tache-dialog"
import { EditTacheDialog } from "./edit-tache-dialog"
import { useOrganisation } from "@/contexts/organisation-context"
import { useAuth } from "@/hooks/auth"
import { listMembresWithUsers, type MembreWithUserDto } from "@/actions/membres"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Plus,
  ListTodo,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import type { TacheDto, TacheStatsDto, TacheStatut, PaginatedTachesDto } from "@/types/tache"
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

// Server Actions
import {
  listTaches,
  getTacheStats,
  marquerTacheEnCours,
  marquerTacheTerminee,
  marquerTacheAnnulee,
  deleteTache as deleteTacheAction,
} from "@/actions/taches"

type FilterType = "toutes" | "a_faire" | "en_cours" | "terminees" | "en_retard"

interface TachesPageClientProps {
  initialTaches?: PaginatedTachesDto | null
  initialStats?: TacheStatsDto | null
  initialMembres?: MembreWithUserDto[] | null
}

export function TachesPageClient({
  initialTaches,
  initialStats,
  initialMembres,
}: TachesPageClientProps) {
  const { activeOrganisation } = useOrganisation()
  const { profile } = useAuth()
  const [membres, setMembres] = React.useState<MembreWithUserDto[]>(initialMembres || [])
  const [activeFilter, setActiveFilter] = React.useState<FilterType>("toutes")

  // Refs to track if we've already fetched data
  const hasFetchedMembres = React.useRef(!!initialMembres)
  const hasFetchedInitial = React.useRef(!!initialTaches)

  // Fetch membres only if not provided via SSR
  React.useEffect(() => {
    if (!activeOrganisation?.organisationId || hasFetchedMembres.current) return
    hasFetchedMembres.current = true
    listMembresWithUsers(activeOrganisation.organisationId).then((result) => {
      if (result.data) setMembres(result.data)
    })
  }, [activeOrganisation?.organisationId])
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedTache, setSelectedTache] = React.useState<TacheDto | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [mesTachesOnly, setMesTachesOnly] = React.useState(true)
  const pageSize = 20

  // State for data from Server Actions - initialize with SSR data if available
  const [taches, setTaches] = React.useState<TacheDto[]>(initialTaches?.data || [])
  const [loading, setLoading] = React.useState(!initialTaches)
  const [isRefetching, setIsRefetching] = React.useState(false)
  const [total, setTotal] = React.useState(initialTaches?.total || 0)
  const [totalPages, setTotalPages] = React.useState(initialTaches?.totalPages || 1)
  const [stats, setStats] = React.useState<TacheStatsDto | null>(initialStats || null)

  // Trouver l'ID utilisateur de la BDD à partir de l'email
  const currentUserDbId = React.useMemo(() => {
    if (!profile?.email || !membres.length) return null
    const currentMembre = membres.find(
      (m) => m.utilisateur?.email === profile.email
    )
    return currentMembre?.utilisateurId || null
  }, [profile?.email, membres])

  // Debounce de la recherche
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1) // Reset page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [activeFilter, mesTachesOnly])

  // Déterminer le filtre statut basé sur le filtre actif
  const statutFilter = React.useMemo(() => {
    switch (activeFilter) {
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
  }, [activeFilter])

  const enRetardFilter = activeFilter === 'en_retard'

  // Fetch taches with Server Actions
  const fetchTaches = React.useCallback(async () => {
    if (!activeOrganisation?.organisationId) return

    setIsRefetching(true)
    const result = await listTaches({
      organisationId: activeOrganisation.organisationId,
      assigneA: mesTachesOnly && currentUserDbId ? currentUserDbId : undefined,
      statut: statutFilter,
      enRetard: enRetardFilter ? true : undefined,
      search: debouncedSearch || undefined,
      page: currentPage,
      limit: pageSize,
    })

    if (result.data) {
      setTaches(result.data.data)
      setTotal(result.data.total)
      setTotalPages(result.data.totalPages)
    }
    setIsRefetching(false)
  }, [activeOrganisation?.organisationId, mesTachesOnly, currentUserDbId, statutFilter, enRetardFilter, debouncedSearch, currentPage])

  // Fetch stats with Server Actions
  const fetchStats = React.useCallback(async () => {
    if (!activeOrganisation?.organisationId) return

    const result = await getTacheStats(activeOrganisation.organisationId)
    if (result.data) {
      setStats(result.data)
    }
  }, [activeOrganisation?.organisationId])

  // Initial fetch - skip if SSR data provided
  React.useEffect(() => {
    if (hasFetchedInitial.current) return
    hasFetchedInitial.current = true
    setLoading(true)
    Promise.all([fetchTaches(), fetchStats()]).finally(() => setLoading(false))
  }, [fetchTaches, fetchStats])

  // Refetch function
  const refetch = React.useCallback(() => {
    fetchTaches()
  }, [fetchTaches])

  const refetchStats = React.useCallback(() => {
    fetchStats()
  }, [fetchStats])

  // Listener pour naviguer vers le filtre "en retard" depuis la notification
  React.useEffect(() => {
    const handleShowRetard = () => setActiveFilter("en_retard")
    window.addEventListener("tache:show-retard", handleShowRetard)
    return () => window.removeEventListener("tache:show-retard", handleShowRetard)
  }, [])

  const handleStart = async (tache: TacheDto) => {
    const result = await marquerTacheEnCours(tache.id)
    if (result.data) {
      toast.success("Tâche démarrée")
      refetch()
      refetchStats()
    } else {
      toast.error(result.error || "Erreur lors du démarrage de la tâche")
    }
  }

  const handleComplete = async (tache: TacheDto) => {
    const result = await marquerTacheTerminee(tache.id)
    if (result.data) {
      toast.success("Tâche terminée")
      refetch()
      refetchStats()
    } else {
      toast.error(result.error || "Erreur lors de la complétion de la tâche")
    }
  }

  const handleCancel = async (tache: TacheDto) => {
    const result = await marquerTacheAnnulee(tache.id)
    if (result.data) {
      toast.success("Tâche annulée")
      refetch()
      refetchStats()
    } else {
      toast.error(result.error || "Erreur lors de l'annulation de la tâche")
    }
  }

  const handleDeleteClick = (tache: TacheDto) => {
    setSelectedTache(tache)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedTache) return

    const result = await deleteTacheAction(selectedTache.id)
    if (result.data) {
      toast.success("Tâche supprimée")
      refetch()
      refetchStats()
    } else {
      toast.error(result.error || "Erreur lors de la suppression de la tâche")
    }
    setDeleteDialogOpen(false)
    setSelectedTache(null)
  }

  const handleSuccess = () => {
    refetch()
    refetchStats()
  }

  const handleView = (tache: TacheDto) => {
    setSelectedTache(tache)
    setEditDialogOpen(true)
  }

  const columns = React.useMemo(
    () =>
      getColumns({
        onView: handleView,
        onStart: handleStart,
        onComplete: handleComplete,
        onCancel: handleCancel,
        onDelete: handleDeleteClick,
        membres,
      }),
    [membres]
  )

  // Helper pour déterminer si une carte est active
  const isCardActive = (filter: FilterType) => activeFilter === filter

  return (
    <main className="flex flex-1 flex-col gap-4 min-h-0">
      {/* Stats Cards - Cliquables pour filtrer */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${isCardActive("toutes") ? "ring-2 ring-primary ring-offset-2" : ""}`}
          onClick={() => setActiveFilter("toutes")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${isCardActive("a_faire") ? "ring-2 ring-orange-500 ring-offset-2" : ""}`}
          onClick={() => setActiveFilter("a_faire")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">À faire</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.aFaire ?? 0}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${isCardActive("en_cours") ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
          onClick={() => setActiveFilter("en_cours")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.enCours ?? 0}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${isCardActive("terminees") ? "ring-2 ring-green-500 ring-offset-2" : ""}`}
          onClick={() => setActiveFilter("terminees")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminées</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.terminee ?? 0}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md border-destructive ${isCardActive("en_retard") ? "ring-2 ring-destructive ring-offset-2" : ""}`}
          onClick={() => setActiveFilter("en_retard")}
        >
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
        <CardContent className="flex-1 min-h-0 flex flex-col pt-4">
          {/* Barre d'actions */}
          <div className="flex items-center gap-4 shrink-0 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une tâche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="mes-taches"
                checked={mesTachesOnly}
                onCheckedChange={setMesTachesOnly}
              />
              <Label htmlFor="mes-taches" className="text-sm cursor-pointer">
                Mes tâches
              </Label>
            </div>
            <div className="flex-1" />
            <div className="text-sm text-muted-foreground">
              {total} tâche{total > 1 ? 's' : ''}
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle tâche
            </Button>
          </div>

          {/* Tableau */}
          <div className="flex-1 min-h-0 flex flex-col">
            {loading && taches.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : (
              <div className={`flex-1 min-h-0 transition-opacity duration-150 ${isRefetching ? "opacity-50 pointer-events-none" : ""}`}>
                <DataTable
                  columns={columns}
                  data={taches}
                  headerClassName="bg-sidebar hover:bg-sidebar"
                />
              </div>
            )}
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 px-2 py-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <CreateTacheDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleSuccess}
      />

      {/* Edit Dialog */}
      <EditTacheDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        tache={selectedTache}
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
