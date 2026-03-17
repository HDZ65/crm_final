"use client"

import * as React from "react"
import { Plus, Search, Filter, X, ChevronDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { DataTable } from "@/components/data-table-basic"
import { columns } from "./columns"
import { toast } from "sonner"
import { listDocumentsGED } from "@/actions/documents"
import type { PieceJointe } from "@proto/documents/documents"
import { TypeDocument } from "@proto/documents/documents"
import { getTypeDocumentLabel, SELECTABLE_TYPE_DOCUMENTS } from "@/components/documents/document-type-badge"
import { cn } from "@/lib/utils"

interface DocumentsPageClientProps {
  initialDocuments?: PieceJointe[] | null
}

export function DocumentsPageClient({ initialDocuments }: DocumentsPageClientProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false)

  // Ref to track initial fetch
  const hasFetched = React.useRef(!!initialDocuments)

  // State pour les données - initialize with SSR data if available
  const [documents, setDocuments] = React.useState<PieceJointe[]>(() =>
    initialDocuments ? initialDocuments : []
  )
  const [loading, setLoading] = React.useState(!initialDocuments)
  const [error, setError] = React.useState<string | null>(null)

  // Filtres locaux
  const [filters, setFilters] = React.useState({
    globalSearch: "",
    typeDocument: "",
  })

  // Fetch des documents
  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    const typeDocFilter = filters.typeDocument ? (parseInt(filters.typeDocument) as TypeDocument) : undefined

    const result = await listDocumentsGED({
      search: filters.globalSearch,
      typeDocument: typeDocFilter,
    })

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setDocuments(result.data.pieces || [])
    }

    setLoading(false)
  }, [filters])

  // Initial load when component mounts - skip if SSR data provided
  React.useEffect(() => {
    const isInitialLoad = !hasFetched.current
    hasFetched.current = true

    if (isInitialLoad && initialDocuments) {
      return
    }

    fetchData()
  }, [fetchData, initialDocuments])

  const refetch = fetchData

  // Compter les filtres avancés actifs
  const activeAdvancedFiltersCount = React.useMemo(() => {
    let count = 0
    if (filters.typeDocument) count++
    return count
  }, [filters])

  // Derived flag: panel is open if user toggled it OR if there are active filters
  const isAdvancedFiltersOpen = showAdvancedFilters || activeAdvancedFiltersCount > 0

  // Réinitialiser les filtres
  const resetFilters = React.useCallback(() => {
    setFilters({
      globalSearch: "",
      typeDocument: "",
    })
  }, [])

  // Filtrage côté client
  const filteredDocuments = React.useMemo(() => {
    return documents.filter((doc: PieceJointe) => {
      // Recherche globale
      if (filters.globalSearch) {
        const search = filters.globalSearch.toLowerCase()
        const nomFichier = doc.nomFichier?.toLowerCase() || ""
        if (!nomFichier.includes(search)) {
          return false
        }
      }

      // Filtre par type de document
      if (filters.typeDocument) {
        const typeDocFilter = parseInt(filters.typeDocument) as TypeDocument
        if (doc.typeDocument !== typeDocFilter) {
          return false
        }
      }

      return true
    })
  }, [documents, filters])

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

  const handleRowClick = (document: PieceJointe) => {
    // TODO: Open DocumentDetailDialog
  }

  return (
    <main className="flex flex-1 flex-col gap-4 min-h-0">
      <div className="flex flex-col gap-4 min-h-full">
        {/* Barre de recherche principale + Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom de fichier..."
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
            <Filter className="size-4" />
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
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </Button>

          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            Ajouter
          </Button>
        </div>

        {/* Filtres avancés (collapsible) */}
        <Collapsible open={isAdvancedFiltersOpen}>
          <CollapsibleContent>
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="relative">
                    <Select
                      value={filters.typeDocument || ""}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, typeDocument: value }))}
                    >
                      <SelectTrigger className="bg-white w-full">
                        <SelectValue placeholder="Type de document" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tous les types</SelectItem>
                        {SELECTABLE_TYPE_DOCUMENTS.map((typeDoc) => (
                          <SelectItem key={typeDoc} value={typeDoc.toString()}>
                            {getTypeDocumentLabel(typeDoc)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Card du tableau */}
        <Card className="flex-1 min-h-0 bg-card border-border flex flex-col">
          <CardContent className="flex-1 min-h-0 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {filteredDocuments.length} document{filteredDocuments.length > 1 ? "s" : ""}
              </span>
            </div>

            {/* Tableau */}
            <div className="flex-1 min-h-0">
              {filteredDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="rounded-full bg-muted p-4">
                    <svg className="size-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">Aucun document</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {documents.length === 0
                        ? "Ajoutez votre premier document pour commencer"
                        : "Aucun document ne correspond à vos critères de recherche"}
                    </p>
                  </div>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredDocuments}
                  headerClassName="bg-sidebar hover:bg-sidebar"
                  onRowClick={handleRowClick}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
