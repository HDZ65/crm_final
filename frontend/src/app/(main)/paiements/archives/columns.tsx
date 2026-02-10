"use client"

import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"

export interface ArchiveRow {
  id: string
  exportType?: string
  export_type?: string
  format?: string
  recordCount?: number
  record_count?: number
  fileName?: string
  file_name?: string
  completedAt?: string
  completed_at?: string
  status?: string
}

function formatDate(value?: string) {
  if (!value) return "-"
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return value
  return parsedDate.toLocaleString("fr-FR")
}

export function createArchiveColumns(): ColumnDef<ArchiveRow>[] {
  return [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.id}</span>
      ),
    },
    {
      id: "exportType",
      header: "Type",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.exportType ?? row.original.export_type ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "format",
      header: "Format",
      cell: ({ row }) => row.original.format || "-",
    },
    {
      id: "recordCount",
      header: "Lignes",
      cell: ({ row }) => row.original.recordCount ?? row.original.record_count ?? 0,
    },
    {
      id: "fileName",
      header: "Fichier",
      cell: ({ row }) => (
        <span className="max-w-60 truncate block">
          {row.original.fileName ?? row.original.file_name ?? "-"}
        </span>
      ),
    },
    {
      id: "completedAt",
      header: "Termine le",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.completedAt ?? row.original.completed_at)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Statut",
      cell: ({ row }) => {
        const status = row.original.status || "-"
        return (
          <Badge variant={status === "COMPLETED" ? "default" : "secondary"}>
            {status}
          </Badge>
        )
      },
    },
  ]
}
