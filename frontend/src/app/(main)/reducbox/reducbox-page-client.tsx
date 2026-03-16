"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/data-table-basic"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReducBoxRow {
  id: string
  clientId: string
  contratId: string
  status: "ACTIVE" | "SUSPENDED" | "PENDING" | "CANCELLED"
  createdAt: string
}

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  ReducBoxRow["status"],
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Actif",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  SUSPENDED: {
    label: "Suspendu",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  PENDING: {
    label: "En attente",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  CANCELLED: {
    label: "Annulé",
    className: "bg-red-50 text-red-700 border-red-200",
  },
}

function StatusBadge({ status }: { status: ReducBoxRow["status"] }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={cn(config.className)}>
      {config.label}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_REDUCBOX: ReducBoxRow[] = [
  {
    id: "RBX-001",
    clientId: "CLI-1042",
    contratId: "CTR-2024-0087",
    status: "ACTIVE",
    createdAt: "2025-11-15T10:30:00Z",
  },
  {
    id: "RBX-002",
    clientId: "CLI-1108",
    contratId: "CTR-2024-0112",
    status: "PENDING",
    createdAt: "2025-12-02T14:00:00Z",
  },
  {
    id: "RBX-003",
    clientId: "CLI-1055",
    contratId: "CTR-2024-0095",
    status: "SUSPENDED",
    createdAt: "2025-10-20T09:15:00Z",
  },
  {
    id: "RBX-004",
    clientId: "CLI-1201",
    contratId: "CTR-2025-0003",
    status: "ACTIVE",
    createdAt: "2026-01-08T11:45:00Z",
  },
  {
    id: "RBX-005",
    clientId: "CLI-1089",
    contratId: "CTR-2024-0101",
    status: "CANCELLED",
    createdAt: "2025-09-14T16:20:00Z",
  },
]

const MOCK_STATS = {
  total: 42,
  active: 28,
  suspended: 6,
  cancelled: 8,
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

const columns: ColumnDef<ReducBoxRow>[] = [
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
    accessorKey: "contratId",
    header: "Contrat",
    cell: ({ row }) => row.original.contratId,
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "createdAt",
    header: "Créé le",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReducBoxPageClient() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ReducBox</h1>
        <p className="text-muted-foreground">
          Gestion des box de réduction client
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              Actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {MOCK_STATS.active}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Suspendues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {MOCK_STATS.suspended}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Annulées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {MOCK_STATS.cancelled}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {MOCK_REDUCBOX.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">Aucune ReducBox</p>
          <p className="text-sm mt-1">
            Aucun résultat pour les filtres sélectionnés
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={MOCK_REDUCBOX}
          headerClassName="bg-sidebar hover:bg-sidebar"
        />
      )}
    </main>
  )
}
