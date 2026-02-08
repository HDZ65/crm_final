"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { DataTable } from "@/components/data-table-basic"
import { createColumns } from "./columns"
import { useClientSearchStore } from "@/stores/client-search-store"
import { useSocieteStore } from "@/stores/societe-store"
import { getClientsByOrganisation } from "@/actions/clients"
import { useOrganisation } from "@/contexts/organisation-context"
import { Search, User, Mail, Phone, Building2, CreditCard, Globe, Shield, UserPlus, RefreshCw, Upload, Download, SlidersHorizontal, ChevronDown, X } from "lucide-react"
import { CreateClientDialog } from "@/components/create-client-dialog"
import { ImportClientDialog } from "@/components/clients/import-client-dialog"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ClientRow, ClientStatus } from "@/lib/ui/display-types/client"
import type { ClientBase } from "@proto/clients/clients"
import type { StatutClient } from "@/constants/statuts-client"
import { formatCreatedAgo, formatFullName } from "@/lib/formatters"

// Helper pour mapper le statut vers le type UI
function mapStatutToStatus(statutCode: string): ClientStatus {
  const code = statutCode.toLowerCase()
  if (code === 'actif' || code === 'active') return 'Actif'
  if (code === 'impaye' || code === 'impayé') return 'Impaye'
  if (code === 'suspendu' || code === 'suspended') return 'Suspendu'
  return 'Actif'
}

// Mapper ClientBase gRPC vers ClientRow frontend
function mapClientToRow(client: ClientBase, statutsMap: Map<string, string>): ClientRow {
  const statutCode = statutsMap.get(client.statut) || client.statut
  return {
    id: client.id,
    name: formatFullName(client.nom, client.prenom),
    status: mapStatutToStatus(statutCode),
    contracts: [],
    createdAgo: formatCreatedAgo(client.createdAt),
    email: client.email,
    phone: client.telephone,
    societeIds: [],
  }
}

const normalizePhone = (value: string) => value.replace(/\D/g, "")

interface ClientsPageClientProps {
  initialClients: ClientBase[]
  statuts: readonly StatutClient[] | StatutClient[]
}

export function ClientsPageClient({ initialClients, statuts }: ClientsPageClientProps) {
  const { activeOrganisation } = useOrganisation()
  const [createClientOpen, setCreateClientOpen] = React.useState(false)
  const [importDialogOpen, setImportDialogOpen] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Map statuts for quick lookup
  const statutsMap = React.useMemo(() => {
    const map = new Map<string, string>()
    statuts.forEach(s => map.set(s.id, s.code))
    return map
  }, [statuts])

  // Données SSR - toujours dérivées des props (garantit affichage immédiat)
  const ssrClients = React.useMemo(() => {
    return initialClients.map(c => mapClientToRow(c, statutsMap))
  }, [initialClients, statutsMap])

  // State pour les mises à jour client uniquement (null = utiliser SSR)
  const [clientUpdates, setClientUpdates] = React.useState<ClientRow[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Clients finaux: mises à jour client si disponibles, sinon SSR
  const clients = clientUpdates ?? ssrClients

  // Zustand store
  const filters = useClientSearchStore((state) => state.filters)
  const updateFilter = useClientSearchStore((state) => state.updateFilter)
  const showAdvancedFilters = useClientSearchStore((state) => state.showAdvancedFilters)
  const toggleAdvancedFilters = useClientSearchStore((state) => state.toggleAdvancedFilters)
  const resetFilters = useClientSearchStore((state) => state.resetFilters)

  // Société active depuis le store global
  const activeSocieteId = useSocieteStore((state) => state.activeSocieteId)

  // Ref pour éviter les appels multiples - initialisé à true si on a des données SSR
  const hasFetchedRef = React.useRef(initialClients.length > 0)
  const previousFiltersRef = React.useRef({ clientType: filters.clientType, societeId: activeSocieteId })

  // Fetch des clients (pour refresh et après filtre serveur)
  const fetchData = React.useCallback(async () => {
    if (!activeOrganisation) return

    setError(null)

    const result = await getClientsByOrganisation({
      organisationId: activeOrganisation.organisationId,
      statutId: filters.clientType || undefined,
      societeId: activeSocieteId || undefined,
    })

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setClientUpdates(result.data.clients.map(c => mapClientToRow(c, statutsMap)))
    }

  }, [activeOrganisation, filters.clientType, activeSocieteId, statutsMap])

  // Initial data load - only fetch if no SSR data was provided
  React.useEffect(() => {
    if (hasFetchedRef.current) return
    if (!activeOrganisation) return

    hasFetchedRef.current = true
    getClientsByOrganisation({
      organisationId: activeOrganisation.organisationId,
    }).then(result => {
      if (result.data) {
        setClientUpdates(result.data.clients.map(c => mapClientToRow(c, statutsMap)))
      } else if (result.error) {
        setError(result.error)
      }
    })
  }, [statutsMap, activeOrganisation])

  // Refetch only when filters actually change (not on every render)
  React.useEffect(() => {
    const prev = previousFiltersRef.current
    const hasFilterChanged = prev.clientType !== filters.clientType || prev.societeId !== activeSocieteId

    if (hasFilterChanged && hasFetchedRef.current) {
      previousFiltersRef.current = { clientType: filters.clientType, societeId: activeSocieteId }
      fetchData()
    }
  }, [filters.clientType, activeSocieteId, fetchData])

   // Compter les filtres avancés actifs
   const activeAdvancedFiltersCount = React.useMemo(() => {
     let count = 0
     if (filters.name) count++
     if (filters.firstName) count++
     if (filters.email) count++
     if (filters.phone) count++
     if (filters.clientType) count++
     if (filters.company) count++
     if (filters.iban) count++
     if (filters.source) count++
     return count
   }, [filters])

   // Derived flag: panel is open if user toggled it OR if there are active filters
   const isAdvancedFiltersOpen = showAdvancedFilters || activeAdvancedFiltersCount > 0

  const columns = React.useMemo(() => createColumns(fetchData), [fetchData])

  const handleFilterChange = (field: keyof typeof filters) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    updateFilter(field, e.target.value)
  }

  const handleSelectChange = (value: string) => {
    updateFilter("clientType", value)
  }

  // Filtrage local combiné (recherche globale + filtres avancés)
  const filteredClients = React.useMemo(() => {
    return clients.filter((client) => {
      // Recherche globale (nom, prénom, email, téléphone)
      if (filters.globalSearch) {
        const search = filters.globalSearch.toLowerCase()
        const normalizedSearch = normalizePhone(filters.globalSearch)
        const clientPhone = client.phone ? normalizePhone(client.phone) : ""

        const matchesGlobal =
          client.name.toLowerCase().includes(search) ||
          (client.email?.toLowerCase().includes(search) ?? false) ||
          (clientPhone && clientPhone.includes(normalizedSearch))

        if (!matchesGlobal) return false
      }

      // Filtres avancés
      const matchesName = !filters.name || client.name.toLowerCase().includes(filters.name.toLowerCase())
      const matchesEmail = !filters.email || (client.email?.toLowerCase().includes(filters.email.toLowerCase()) ?? false)
      const clientPhone = client.phone ? normalizePhone(client.phone) : ""
      const filterPhone = normalizePhone(filters.phone)
      const matchesPhone = !filters.phone || clientPhone.includes(filterPhone)

      return matchesName && matchesEmail && matchesPhone
    })
  }, [filters.globalSearch, filters.name, filters.email, filters.phone, clients])

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
    toast.success("Liste actualisée")
  }, [fetchData])

  const handleExport = React.useCallback(() => {
    if (filteredClients.length === 0) {
      toast.error("Aucune donnée à exporter")
      return
    }

    const headers = ["Nom", "Email", "Téléphone", "Statut"]
    const rows = filteredClients.map((c) => [
      c.name,
      c.email || "",
      c.phone || "",
      c.status,
    ])

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
    ].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `clients_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Export CSV téléchargé")
  }, [filteredClients])

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
             onClick={toggleAdvancedFilters}
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
          <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
            <Upload className="mr-2 size-4" />
            Importer
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 size-4" />
            Exporter
          </Button>
          <Button size="sm" onClick={() => setCreateClientOpen(true)} className="gap-2">
            <UserPlus className="size-4" />
            Nouveau client
          </Button>
        </div>

         {/* Filtres avancés (collapsible) */}
         <Collapsible open={isAdvancedFiltersOpen}>
          <CollapsibleContent>
            <Card className="bg-card border">
              <CardContent className="pt-4 pb-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Nom"
                      className="bg-white pl-10"
                      value={filters.name}
                      onChange={handleFilterChange("name")}
                    />
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Prénom"
                      className="bg-white pl-10"
                      value={filters.firstName}
                      onChange={handleFilterChange("firstName")}
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
                      value={filters.phone}
                      onChange={handleFilterChange("phone")}
                    />
                  </div>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Select value={filters.clientType || "all"} onValueChange={(value) => handleSelectChange(value === "all" ? "" : value)}>
                      <SelectTrigger className="bg-white w-full pl-10">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        {statuts.map((statut) => (
                          <SelectItem key={statut.id} value={statut.id}>
                            {statut.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Entreprise client"
                      className="bg-white pl-10"
                      value={filters.company}
                      onChange={handleFilterChange("company")}
                    />
                  </div>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="IBAN"
                      className="bg-white pl-10"
                      value={filters.iban}
                      onChange={handleFilterChange("iban")}
                    />
                  </div>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Source"
                      className="bg-white pl-10"
                      value={filters.source}
                      onChange={handleFilterChange("source")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Table des clients */}
        <Card className="flex-1 min-h-0 bg-card border flex flex-col">
          <CardContent className="flex-1 min-h-0 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {filteredClients.length} client{filteredClients.length > 1 ? "s" : ""}
              </span>
            </div>

            {error ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <p className="text-destructive">Erreur lors du chargement des clients</p>
              </div>
            ) : (
              <div className="flex-1 min-h-0">
                <DataTable
                  columns={columns}
                  data={filteredClients}
                  headerClassName="bg-sidebar hover:bg-sidebar"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {createClientOpen && (
        <CreateClientDialog
          open={createClientOpen}
          onOpenChange={setCreateClientOpen}
          onSuccess={fetchData}
        />
      )}

      {importDialogOpen && (
        <ImportClientDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onSuccess={fetchData}
        />
      )}
    </main>
  )
}
