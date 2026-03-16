"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/data-table-basic"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EnergieStatut =
  | "DEMANDE_ENVOYEE"
  | "EN_COURS"
  | "RACCORDE"
  | "ACTIF"
  | "ANNULE"

type Partenaire = "PLENITUDE" | "OHM"

interface EnergieRow {
  id: string
  clientId: string
  partenaire: Partenaire
  statut: EnergieStatut
  dateDemande: string
}

// ---------------------------------------------------------------------------
// Badge configs
// ---------------------------------------------------------------------------

const STATUT_CONFIG: Record<
  EnergieStatut,
  { label: string; className: string }
> = {
  DEMANDE_ENVOYEE: {
    label: "Demande envoyée",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  EN_COURS: {
    label: "En cours",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  RACCORDE: {
    label: "Raccordé",
    className: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  ACTIF: {
    label: "Actif",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  ANNULE: {
    label: "Annulé",
    className: "bg-red-50 text-red-700 border-red-200",
  },
}

const PARTENAIRE_CONFIG: Record<
  Partenaire,
  { label: string; className: string }
> = {
  PLENITUDE: {
    label: "Plenitude",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  OHM: {
    label: "OHM Énergie",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
}

function StatutBadge({ statut }: { statut: EnergieStatut }) {
  const config = STATUT_CONFIG[statut]
  return (
    <Badge variant="outline" className={cn(config.className)}>
      {config.label}
    </Badge>
  )
}

function PartenaireBadge({ partenaire }: { partenaire: Partenaire }) {
  const config = PARTENAIRE_CONFIG[partenaire]
  return (
    <Badge variant="outline" className={cn(config.className)}>
      {config.label}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_ENERGIE: EnergieRow[] = [
  {
    id: "ENR-001",
    clientId: "CLI-1042",
    partenaire: "PLENITUDE",
    statut: "ACTIF",
    dateDemande: "2025-10-05T09:00:00Z",
  },
  {
    id: "ENR-002",
    clientId: "CLI-1108",
    partenaire: "OHM",
    statut: "DEMANDE_ENVOYEE",
    dateDemande: "2026-01-12T14:30:00Z",
  },
  {
    id: "ENR-003",
    clientId: "CLI-1055",
    partenaire: "PLENITUDE",
    statut: "EN_COURS",
    dateDemande: "2025-12-18T11:00:00Z",
  },
  {
    id: "ENR-004",
    clientId: "CLI-1201",
    partenaire: "OHM",
    statut: "RACCORDE",
    dateDemande: "2025-11-22T16:45:00Z",
  },
  {
    id: "ENR-005",
    clientId: "CLI-1089",
    partenaire: "PLENITUDE",
    statut: "ANNULE",
    dateDemande: "2025-09-30T08:15:00Z",
  },
]

const MOCK_STATS = {
  total: 67,
  demandeEnvoyee: 12,
  enCours: 18,
  raccorde: 9,
  actif: 28,
}

// ---------------------------------------------------------------------------
// Columns
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

const columns: ColumnDef<EnergieRow>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.id}</span>
    ),
  },
  {
    accessorKey: "clientId",
    header: "Client",
    cell: ({ row }) => row.original.clientId,
  },
  {
    accessorKey: "partenaire",
    header: "Partenaire",
    cell: ({ row }) => (
      <PartenaireBadge partenaire={row.original.partenaire} />
    ),
  },
  {
    accessorKey: "statut",
    header: "Statut",
    cell: ({ row }) => <StatutBadge statut={row.original.statut} />,
  },
  {
    accessorKey: "dateDemande",
    header: "Date Demande",
    cell: ({ row }) => formatDate(row.original.dateDemande),
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EnergiePageClient() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Énergie</h1>
        <p className="text-muted-foreground">
          Suivi des contrats énergie et raccordements
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{MOCK_STATS.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Demande envoyée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {MOCK_STATS.demandeEnvoyee}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              En cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {MOCK_STATS.enCours}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Raccordé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-cyan-600">
              {MOCK_STATS.raccorde}
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
              {MOCK_STATS.actif}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {MOCK_ENERGIE.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">Aucun contrat énergie</p>
          <p className="text-sm mt-1">
            Aucun résultat pour les filtres sélectionnés
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={MOCK_ENERGIE}
          headerClassName="bg-sidebar hover:bg-sidebar"
        />
      )}
    </main>
  )
}
