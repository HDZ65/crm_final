"use client"

import * as React from "react"
import { Plus, RefreshCw, Download, FileText, Calendar, User, FileX, Search, SlidersHorizontal, ChevronDown, X, Filter } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { DataTable } from "@/components/data-table-basic"
import { columns } from "./columns"
import { toast } from "sonner"
import { getFacturesByOrganisation } from "@/actions/factures"
import { useOrganisation } from "@/contexts/organisation-context"
import type { Facture, StatutFacture } from "@proto/factures/factures"
import { cn } from "@/lib/utils"

// Mapper la facture gRPC vers le type frontend
function mapFacture(f: Facture): Facture {
  return {
    id: f.id,
    organisationId: f.organisationId,
    numero: f.numero,
    dateEmission: f.dateEmission,
    montantHt: f.montantHt,
    montantTtc: f.montantTtc,
    statutId: f.statutId,
    emissionFactureId: f.emissionFactureId,
    clientBaseId: f.clientBaseId,
    contratId: f.contratId || "",
    clientPartenaireId: f.clientPartenaireId,
    adresseFacturationId: f.adresseFacturationId,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
    lignes: f.lignes || [],
    client: f.client ? { id: f.client.id, nom: f.client.nom, prenom: f.client.prenom } : undefined,
    statut: f.statut ? {
      id: f.statut.id,
      code: f.statut.code,
      nom: f.statut.nom,
      description: f.statut.description,
      ordreAffichage: f.statut.ordreAffichage,
      createdAt: f.statut.createdAt,
      updatedAt: f.statut.updatedAt,
    } : undefined,
  }
}

interface FacturationPageClientProps {
  initialFactures?: Facture[] | null
  statuts: StatutFacture[]
}

export function FacturationPageClient({ initialFactures, statuts }: FacturationPageClientProps) {
  const { activeOrganisation } = useOrganisation()
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false)

  // Ref to track initial fetch
  const hasFetched = React.useRef(!!initialFactures)

  // State pour les données - initialize with SSR data if available
  const [factures, setFactures] = React.useState<Facture[]>(() =>
    initialFactures ? initialFactures.map(mapFacture) : []
  )
  const [loading, setLoading] = React.useState(!initialFactures)
  const [error, setError] = React.useState<string | null>(null)

  // Mapper les statuts
  const mappedStatuts = React.useMemo((): StatutFacture[] =>
    statuts.map(s => ({
      id: s.id,
      code: s.code,
      nom: s.nom,
      description: s.description,
      ordreAffichage: s.ordreAffichage,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
    [statuts]
  )

  // Filtres locaux
  const [filters, setFilters] = React.useState({
    globalSearch: "",
    numero: "",
    client: "",
    statutId: "",
    dateDebut: "",
    dateFin: "",
  })

  // Fetch des factures
  const fetchData = React.useCallback(async () => {
    if (!activeOrganisation) return

    setLoading(true)
    setError(null)

    const result = await getFacturesByOrganisation({
      organisationId: activeOrganisation.organisationId,
    })

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setFactures(result.data.factures.map(mapFacture))
    }

    setLoading(false)
  }, [activeOrganisation])

  // Initial load when organisation becomes available - skip if SSR data provided
  React.useEffect(() => {
    if (!activeOrganisation || hasFetched.current) return
    hasFetched.current = true
    fetchData()
  }, [activeOrganisation, fetchData])

  const refetch = fetchData

   // Compter les filtres avancés actifs
   const activeAdvancedFiltersCount = React.useMemo(() => {
     let count = 0
     if (filters.numero) count++
     if (filters.client) count++
     if (filters.statutId && filters.statutId !== "all") count++
     if (filters.dateDebut) count++
     if (filters.dateFin) count++
     return count
   }, [filters])

   // Derived flag: panel is open if user toggled it OR if there are active filters
   const isAdvancedFiltersOpen = showAdvancedFilters || activeAdvancedFiltersCount > 0

  // Réinitialiser les filtres
  const resetFilters = React.useCallback(() => {
    setFilters({
      globalSearch: "",
      numero: "",
      client: "",
      statutId: "",
      dateDebut: "",
      dateFin: "",
    })
  }, [])

  // Filtrage côté client
  const filteredFactures = React.useMemo(() => {
    return factures.filter((facture: Facture) => {
      // Recherche globale
      if (filters.globalSearch) {
        const search = filters.globalSearch.toLowerCase()
        const clientName = facture.client ? `${facture.client.prenom} ${facture.client.nom}`.toLowerCase() : ""
        const matchesGlobal =
          facture.numero.toLowerCase().includes(search) ||
          clientName.includes(search)
        if (!matchesGlobal) return false
      }

      // Filtres avancés
      if (filters.numero) {
        if (!facture.numero.toLowerCase().includes(filters.numero.toLowerCase())) {
          return false
        }
      }

      if (filters.client && facture.client) {
        const clientName = `${facture.client.prenom} ${facture.client.nom}`.toLowerCase()
        if (!clientName.includes(filters.client.toLowerCase())) {
          return false
        }
      } else if (filters.client && !facture.client) {
        return false
      }

      if (filters.statutId && filters.statutId !== "all" && facture.statutId !== filters.statutId) {
        return false
      }

      if (filters.dateDebut) {
        const factureDate = new Date(facture.dateEmission)
        const filterDate = new Date(filters.dateDebut)
        if (factureDate < filterDate) {
          return false
        }
      }

      if (filters.dateFin) {
        const factureDate = new Date(facture.dateEmission)
        const filterDate = new Date(filters.dateFin)
        if (factureDate > filterDate) {
          return false
        }
      }

      return true
    })
  }, [factures, filters])

  // Calculs des totaux
  const totals = React.useMemo(() => {
    return filteredFactures.reduce(
      (acc, f) => ({
        ht: acc.ht + (f.montantHt || 0),
        ttc: acc.ttc + (f.montantTtc || 0),
      }),
      { ht: 0, ttc: 0 }
    )
  }, [filteredFactures])

  const handleFilterChange = (field: keyof typeof filters) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFilters((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
    toast.success("Liste actualisée")
  }, [refetch])

  const handleExport = React.useCallback(() => {
    if (filteredFactures.length === 0) {
      toast.error("Aucune donnée à exporter")
      return
    }

    const headers = ["Numéro", "Client", "Date", "Montant HT", "Montant TTC", "Statut"]
    const rows = filteredFactures.map((f) => [
      f.numero,
      f.client ? `${f.client.prenom} ${f.client.nom}` : "",
      new Date(f.dateEmission).toLocaleDateString("fr-FR"),
      f.montantHt?.toFixed(2) || "0.00",
      f.montantTtc?.toFixed(2) || "0.00",
      f.statut?.nom || "",
    ])

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
    ].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `factures_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Export CSV téléchargé")
  }, [filteredFactures])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  return (
    <main className="flex flex-1 flex-col gap-4 min-h-0">
      <div className="flex flex-col gap-4 min-h-full">
        {/* Barre de recherche principale + Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par n° facture ou client..."
              className="pl-10"
              value={filters.globalSearch}
              onChange={handleFilterChange("globalSearch")}
            />
          </div>

           <Button
             variant="outline"
             size="sm"
             onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
             className={cn(
               "gap-2",
               isAdvancedFiltersOpen && "bg-accent"
             )}
           >
             <SlidersHorizontal className="size-4" />
             Filtres
             {activeAdvancedFiltersCount > 0 && (
               <Badge variant="secondary" className="ml-1 size-5 p-0 flex items-center justify-center text-xs">
                 {activeAdvancedFiltersCount}
               </Badge>
             )}
             <ChevronDown className={cn("size-4 transition-transform", isAdvancedFiltersOpen && "rotate-180")} />
           </Button>

           {activeAdvancedFiltersCount > 0 && (
             <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground">
               <X className="size-4" />
               Réinitialiser les filtres
             </Button>
           )}

          <div className="flex-1" />

          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 size-4" />
            Exporter
          </Button>
          <Button size="sm" onClick={() => toast.info("Création de facture à venir")} className="gap-2">
            <Plus className="size-4" />
            Nouvelle facture
          </Button>
        </div>

         {/* Filtres avancés (collapsible) */}
         <Collapsible open={isAdvancedFiltersOpen}>
          <CollapsibleContent>
            <Card className="bg-blue-100 border border-blue-200">
              <CardContent className="pt-4 pb-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="N° Facture"
                      className="bg-white pl-10"
                      value={filters.numero}
                      onChange={handleFilterChange("numero")}
                    />
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Client"
                      className="bg-white pl-10"
                      value={filters.client}
                      onChange={handleFilterChange("client")}
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10" />
                    <Select
                      value={filters.statutId || "all"}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, statutId: value }))}
                    >
                      <SelectTrigger className="bg-white w-full pl-10">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        {mappedStatuts.map((statut) => (
                          <SelectItem key={statut.id} value={statut.id}>
                            {statut.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Du</span>
                    <div className="relative flex-1">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        type="date"
                        className="bg-white pl-10"
                        value={filters.dateDebut}
                        onChange={handleFilterChange("dateDebut")}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Au</span>
                    <div className="relative flex-1">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        type="date"
                        className="bg-white pl-10"
                        value={filters.dateFin}
                        onChange={handleFilterChange("dateFin")}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Card du tableau */}
        <Card className="flex-1 min-h-0 bg-blue-100 border-blue-200 flex flex-col">
          <CardContent className="flex-1 min-h-0 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {filteredFactures.length} facture{filteredFactures.length > 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Total HT :</span>
                  <span className="font-medium tabular-nums">{formatCurrency(totals.ht)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Total TTC :</span>
                  <span className="font-bold text-lg text-primary tabular-nums">{formatCurrency(totals.ttc)}</span>
                </div>
              </div>
            </div>

            {/* Tableau */}
            <div className="flex-1 min-h-0">
              {filteredFactures.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="rounded-full bg-muted p-4">
                    <FileX className="size-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">Aucune facture</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {factures.length === 0
                        ? "Créez votre première facture pour commencer"
                        : "Aucune facture ne correspond à vos critères de recherche"}
                    </p>
                  </div>
                  {factures.length === 0 && (
                    <Button onClick={() => toast.info("Création de facture à venir")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Créer ma première facture
                    </Button>
                  )}
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredFactures}
                  headerClassName="bg-sidebar hover:bg-sidebar"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
