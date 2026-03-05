"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import type {
  ProvisioningLifecycle,
  GetProvisioningStatsResponse,
} from "@proto/telecom/telecom"
import { ProvisioningStateBadge } from "@/components/telecom/provisioning-state-badge"
import { MockIndicator } from "@/components/telecom/mock-indicator"
import { listProvisioningLifecycles } from "@/actions/telecom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  if (!dateStr) return "—"
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return "—"
  }
}

function formatMontant(montant: number, devise: string): string {
  if (!montant && montant !== 0) return "—"
  return `${montant.toFixed(2)} ${devise || "€"}`
}

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

  const totalPages = Math.ceil(total / 20) || 1

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
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Provisioning Télécom</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestion des cycles de provisioning J+14
          </p>
        </div>
        <MockIndicator />
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters row */}
      <div className="flex gap-3 mb-4 items-center flex-wrap">
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
          <p className="text-lg font-medium">Aucun cycle de provisioning</p>
          <p className="text-sm mt-1">
            Aucun résultat pour les filtres sélectionnés
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contrat</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>État</TableHead>
                <TableHead>Statut Abo</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date Signature</TableHead>
                <TableHead>Date J+14</TableHead>
                <TableHead>Dernière MàJ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lifecycles.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/telecom/${item.id}`)}
                >
                  <TableCell className="font-medium">
                    {item.contratId || "—"}
                  </TableCell>
                  <TableCell>{item.clientId || "—"}</TableCell>
                  <TableCell>
                    <ProvisioningStateBadge state={item.provisioningState} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.abonnementStatus || "—"}</Badge>
                  </TableCell>
                  <TableCell>
                    {formatMontant(item.montantAbonnement, item.devise)}
                  </TableCell>
                  <TableCell>{formatDate(item.dateSignature)}</TableCell>
                  <TableCell>{formatDate(item.dateFinRetractation)}</TableCell>
                  <TableCell>{formatDate(item.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && lifecycles.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-muted-foreground">
            Page {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
