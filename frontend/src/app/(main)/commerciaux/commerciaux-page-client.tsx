"use client"

import * as React from "react"
import { UserPlus, RefreshCw, Upload, Download, Search, User, Mail, Phone, Briefcase, Power, SlidersHorizontal, ChevronDown, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { DataTable } from "@/components/data-table-basic"
import { createColumns } from "./columns"
import { toast } from "sonner"
import { CreateCommercialDialog } from "@/components/commerciaux/create-commercial-dialog"
import { ImportCommercialDialog } from "@/components/commerciaux/import-commercial-dialog"
import { getApporteursByOrganisation } from "@/actions/commerciaux"
import { useOrganisation } from "@/contexts/organisation-context"
import type { Commercial } from "@/types/commercial"
import { getCommercialFullName, TYPE_COMMERCIAL_LABELS } from "@/types/commercial"
import type { Apporteur } from "@proto-frontend/commerciaux/commerciaux"
import { cn } from "@/lib/utils"

interface CommerciauxPageClientProps {
  initialCommerciaux?: Apporteur[] | null
}

export function CommerciauxPageClient({ initialCommerciaux }: CommerciauxPageClientProps) {
  const { activeOrganisation } = useOrganisation()
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [importDialogOpen, setImportDialogOpen] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false)

  // Ref to track initial fetch
  const hasFetched = React.useRef(!!initialCommerciaux)

  // State pour les données - initialize with SSR data if available
  const [commerciaux, setCommerciaux] = React.useState<Commercial[]>((initialCommerciaux as unknown as Commercial[]) || [])
  const [error, setError] = React.useState<string | null>(null)

  // Filtres locaux
  const [filters, setFilters] = React.useState({
    globalSearch: "",
    nom: "",
    email: "",
    telephone: "",
    typeApporteur: "",
    actif: "",
  })

  // Fetch des données via Server Action
  const fetchData = React.useCallback(async () => {
    if (!activeOrganisation) return

    setError(null)

    const result = await getApporteursByOrganisation(activeOrganisation.organisationId)

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setCommerciaux(result.data.apporteurs as unknown as Commercial[])
    }
  }, [activeOrganisation])

  // Skip initial fetch if SSR data provided
  React.useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    fetchData()
  }, [fetchData])

  // Créer les colonnes avec la fonction de rafraîchissement
  const columns = React.useMemo(() => createColumns(fetchData), [fetchData])

  // Compter les filtres avancés actifs
  const activeAdvancedFiltersCount = React.useMemo(() => {
    let count = 0
    if (filters.nom) count++
    if (filters.email) count++
    if (filters.telephone) count++
    if (filters.typeApporteur && filters.typeApporteur !== "all") count++
    if (filters.actif && filters.actif !== "all") count++
    return count
  }, [filters])

  // Réinitialiser les filtres
  const resetFilters = React.useCallback(() => {
    setFilters({
      globalSearch: "",
      nom: "",
      email: "",
      telephone: "",
      typeApporteur: "",
      actif: "",
    })
  }, [])

  // Filtrage côté client
  const filteredCommerciaux = React.useMemo(() => {
    return commerciaux.filter((commercial: Commercial) => {
      // Recherche globale
      if (filters.globalSearch) {
        const search = filters.globalSearch.toLowerCase()
        const fullName = getCommercialFullName(commercial).toLowerCase()
        const email = commercial.email?.toLowerCase() || ""
        const phone = commercial.telephone || ""

        const matchesGlobal =
          fullName.includes(search) ||
          email.includes(search) ||
          phone.includes(search)

        if (!matchesGlobal) return false
      }

      // Filtres avancés
      if (filters.nom) {
        const fullName = getCommercialFullName(commercial).toLowerCase()
        if (!fullName.includes(filters.nom.toLowerCase())) {
          return false
        }
      }

      if (filters.email && commercial.email) {
        if (!commercial.email.toLowerCase().includes(filters.email.toLowerCase())) {
          return false
        }
      } else if (filters.email && !commercial.email) {
        return false
      }

      if (filters.telephone && commercial.telephone) {
        if (!commercial.telephone.includes(filters.telephone)) {
          return false
        }
      } else if (filters.telephone && !commercial.telephone) {
        return false
      }

      if (filters.typeApporteur && filters.typeApporteur !== "all" && commercial.typeApporteur !== filters.typeApporteur) {
        return false
      }

      if (filters.actif && filters.actif !== "all") {
        const isActif = filters.actif === "true"
        if (commercial.actif !== isActif) {
          return false
        }
      }

      return true
    })
  }, [commerciaux, filters])

  const handleFilterChange = (field: keyof typeof filters) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFilters((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
    toast.success("Liste actualisée")
  }, [fetchData])

  const handleExport = React.useCallback(() => {
    if (filteredCommerciaux.length === 0) {
      toast.error("Aucune donnée à exporter")
      return
    }

    const headers = ["Nom", "Prénom", "Type", "Email", "Téléphone", "Actif"]
    const rows = filteredCommerciaux.map((c) => [
      c.nom,
      c.prenom,
      c.typeApporteur,
      c.email || "",
      c.telephone || "",
      c.actif ? "Oui" : "Non",
    ])

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
    ].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `commerciaux_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Export CSV téléchargé")
  }, [filteredCommerciaux])

  return (
    <main className="flex flex-1 flex-col gap-4 min-h-0">
      <div className="flex flex-col gap-4 min-h-full">
        {/* Barre de recherche principale + Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email ou téléphone..."
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
              showAdvancedFilters && "bg-accent"
            )}
          >
            <SlidersHorizontal className="size-4" />
            Filtres
            {activeAdvancedFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 size-5 p-0 flex items-center justify-center text-xs">
                {activeAdvancedFiltersCount}
              </Badge>
            )}
            <ChevronDown className={cn("size-4 transition-transform", showAdvancedFilters && "rotate-180")} />
          </Button>

          {activeAdvancedFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground">
              <X className="size-4" />
              Réinitialiser
            </Button>
          )}

          <div className="flex-1" />

          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
            <Upload className="mr-2 size-4" />
            Importer
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 size-4" />
            Exporter
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <UserPlus className="size-4" />
            Nouveau commercial
          </Button>
        </div>

        {/* Filtres avancés (collapsible) */}
        <Collapsible open={showAdvancedFilters}>
          <CollapsibleContent>
            <Card className="bg-card border">
              <CardContent className="pt-4 pb-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Nom / Prénom"
                      className="bg-white pl-10"
                      value={filters.nom}
                      onChange={handleFilterChange("nom")}
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Email"
                      type="email"
                      className="bg-white pl-10"
                      value={filters.email}
                      onChange={handleFilterChange("email")}
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Téléphone"
                      className="bg-white pl-10"
                      value={filters.telephone}
                      onChange={handleFilterChange("telephone")}
                    />
                  </div>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10" />
                    <Select
                      value={filters.typeApporteur || "all"}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, typeApporteur: value }))}
                    >
                      <SelectTrigger className="bg-white w-full pl-10">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        {Object.entries(TYPE_COMMERCIAL_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative">
                    <Power className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10" />
                    <Select
                      value={filters.actif || "all"}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, actif: value }))}
                    >
                      <SelectTrigger className="bg-white w-full pl-10">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="true">Actif</SelectItem>
                        <SelectItem value="false">Inactif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Table des commerciaux */}
        <Card className="flex-1 min-h-0 bg-card border flex flex-col">
          <CardContent className="flex-1 min-h-0 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {filteredCommerciaux.length} {filteredCommerciaux.length > 1 ? "commerciaux" : "commercial"}
              </span>
            </div>

            <div className="flex-1 min-h-0">
              <DataTable
                columns={columns}
                data={filteredCommerciaux}
                headerClassName="bg-sidebar hover:bg-sidebar"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateCommercialDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchData}
      />

      <ImportCommercialDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={fetchData}
      />
    </main>
  )
}
