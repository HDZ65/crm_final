"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import type {
  ProvisioningLifecycle,
  GetProvisioningStatsResponse,
} from "@proto/telecom/telecom"
import { MockIndicator } from "@/components/telecom/mock-indicator"
import { DataTable } from "@/components/data-table-basic"
import { columns } from "./columns"
import { listProvisioningLifecycles } from "@/actions/telecom"
import { AskAiCardButton } from "@/components/ask-ai-card-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, RefreshCw } from "lucide-react"

// ---------------------------------------------------------------------------
// State filter options
// ---------------------------------------------------------------------------

const STATE_FILTER_OPTIONS = [
  { value: "", label: "Tous les états" },
  { value: "EN_ATTENTE_RETRACTATION", label: "En Attente Rétractation" },
  { value: "DELAI_RETRACTATION_ECOULE", label: "Délai Écoulé" },
  { value: "EN_COURS", label: "En Cours" },
  { value: "ACTIVE", label: "Actif" },
  { value: "ERREUR_TECHNIQUE", label: "Erreur Technique" },
  { value: "SUSPENDU", label: "Suspendu" },
  { value: "RESILIE", label: "Résilié" },
] as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TelecomPageClientProps {
  societeId: string
  initialLifecycles: ProvisioningLifecycle[]
  initialTotal: number
  initialStats: GetProvisioningStatsResponse | null
}

export function TelecomPageClient({
  societeId,
  initialLifecycles,
  initialTotal,
  initialStats,
}: TelecomPageClientProps) {
  const router = useRouter()

  // State
  const [lifecycles, setLifecycles] =
    useState<ProvisioningLifecycle[]>(initialLifecycles)
  const [total, setTotal] = useState(initialTotal)
  const [stats, setStats] = useState<GetProvisioningStatsResponse | null>(
    initialStats
  )
  const [page, setPage] = useState(1)
  const [stateFilter, setStateFilter] = useState("")
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchData = useCallback(
    async (p?: number) => {
      if (!societeId) return
      setIsLoading(true)
      setError(null)
      try {
        const result = await listProvisioningLifecycles({
          organisationId: societeId,
          stateFilter: stateFilter || undefined,
          search: search || undefined,
          page: p ?? page,
          limit: 20,
        })
        if (result.error) {
          setError(result.error)
        } else {
          setLifecycles(result.data?.items ?? [])
          setTotal(result.data?.total ?? 0)
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors du chargement"
        )
      } finally {
        setIsLoading(false)
      }
    },
    [societeId, stateFilter, search, page]
  )

  // Re-fetch when filter / search / page changes
  useEffect(() => {
    // Skip initial render — we already have SSR data
    if (page === 1 && !stateFilter && !search) return
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, stateFilter])

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleStateFilterChange(value: string) {
    setStateFilter(value === "ALL" ? "" : value)
    setPage(1)
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      setPage(1)
      fetchData(1)
    }
  }

  function handleRefresh() {
    fetchData(page)
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activation Télécom</h1>
          <p className="text-muted-foreground">
            Gestion des cycles d’activation J+14
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MockIndicator />
          <AskAiCardButton
            prompt={`Analyse les cycles d'activation télécom. Stats: ${stats ? `Total: ${stats.total}, En Attente: ${stats.enAttente}, En Cours: ${stats.enCours}, Actif: ${stats.active}, Suspendu: ${stats.suspendu}, Résilié: ${stats.resilie}, Erreur: ${stats.erreur}` : "non disponibles"}. ${lifecycles.length} cycles affichés. Identifie les blocages, les erreurs récurrentes et propose des actions prioritaires.`}
            title="Analyser les cycles avec l'IA"
          />
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                En Attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.enAttente}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                En Cours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {stats.enCours}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Actif
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {stats.active}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Suspendu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600">
                {stats.suspendu}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Résilié
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-700">
                {stats.resilie}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Erreur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{stats.erreur}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters row */}
      <div className="flex gap-3 items-center flex-wrap">
        <Select
          value={stateFilter || "ALL"}
          onValueChange={handleStateFilterChange}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Tous les états" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les états</SelectItem>
            {STATE_FILTER_OPTIONS.filter((o) => o.value !== "").map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Rechercher par contrat ou client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-[300px]"
        />

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <Loader2 className="animate-spin mx-auto my-8 h-8 w-8 text-muted-foreground" />
      ) : lifecycles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">Aucun cycle d’activation</p>
          <p className="text-sm mt-1">
            Aucun résultat pour les filtres sélectionnés
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={lifecycles}
          headerClassName="bg-sidebar hover:bg-sidebar"
          onRowClick={(row) => router.push(`/telecom/${row.id}`)}
        />
      )}
    </main>
  )
}
