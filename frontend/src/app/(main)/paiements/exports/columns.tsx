"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

export interface ExportJobRow {
  id: string
  exportType?: string
  export_type?: string
  fromDate?: string
  from_date?: string
  toDate?: string
  to_date?: string
  format?: string
  recordCount?: number
  record_count?: number
  status?: string
  createdAt?: string
  created_at?: string
  fileUrl?: string
  file_url?: string
  fileName?: string
  file_name?: string
}

function formatDate(value?: string) {
  if (!value) return "-"
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return value
  return parsedDate.toLocaleString("fr-FR")
}

function getStatusVariant(status: string) {
  if (status === "FAILED") return "destructive"
  if (status === "COMPLETED") return "default"
  return "secondary"
}

export function createExportColumns(): ColumnDef<ExportJobRow>[] {
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
      id: "period",
      header: "Periode",
      cell: ({ row }) => {
        const fromDate = row.original.fromDate ?? row.original.from_date
        const toDate = row.original.toDate ?? row.original.to_date
        return fromDate && toDate ? `${fromDate} -> ${toDate}` : "-"
      },
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
      id: "status",
      header: "Statut",
      cell: ({ row }) => {
        const status = String(row.original.status || "PENDING")
        return (
          <Badge variant={getStatusVariant(status) as any}>{status}</Badge>
        )
      },
    },
    {
      id: "createdAt",
      header: "Creation",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.createdAt ?? row.original.created_at)}
        </span>
      ),
    },
    {
      id: "file",
      header: "Fichier",
      enableHiding: false,
      cell: ({ row }) => {
        const fileUrl = row.original.fileUrl ?? row.original.file_url
        const fileName = row.original.fileName ?? row.original.file_name
        if (!fileUrl) {
          return <span className="text-xs text-muted-foreground">Indisponible</span>
        }
        return (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => window.open(fileUrl, "_blank")}
              className="gap-1"
            >
              <Download className="size-4" />
              {fileName || "Telecharger"}
            </Button>
          </div>
        )
      },
    },
  ]
}
