"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ColumnDef } from "@tanstack/react-table"

export interface AlertRow {
  id: string
  title?: string
  alertType?: string
  alert_type?: string
  severity?: string
  message?: string
  acknowledged?: boolean
  createdAt?: string
  created_at?: string
}

function formatDate(value?: string) {
  if (!value) return "-"
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return value
  return parsedDate.toLocaleString("fr-FR")
}

function getSeverityVariant(severity: string) {
  if (severity === "CRITICAL") return "destructive"
  if (severity === "WARNING") return "secondary"
  return "outline"
}

interface AlertCallbacks {
  onToggleActive: (alert: AlertRow, nextActive: boolean) => void
  loading: boolean
}

export function createAlertColumns(callbacks: AlertCallbacks): ColumnDef<AlertRow>[] {
  return [
    {
      accessorKey: "title",
      header: "Titre",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title || "-"}</span>
      ),
    },
    {
      id: "alertType",
      header: "Type",
      cell: ({ row }) => row.original.alertType ?? row.original.alert_type ?? "-",
    },
    {
      id: "severity",
      header: "Niveau",
      cell: ({ row }) => {
        const severity = String(row.original.severity || "INFO")
        return (
          <Badge variant={getSeverityVariant(severity) as any}>{severity}</Badge>
        )
      },
    },
    {
      accessorKey: "message",
      header: "Message",
      cell: ({ row }) => (
        <span className="max-w-[320px] truncate block">
          {row.original.message || "-"}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.createdAt ?? row.original.created_at)}
        </span>
      ),
    },
    {
      id: "actif",
      header: "Actif",
      cell: ({ row }) => {
        const isActive = !Boolean(row.original.acknowledged)
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => callbacks.onToggleActive(row.original, checked)}
              disabled={callbacks.loading}
            />
            <span className="text-sm text-muted-foreground">
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        )
      },
    },
  ]
}
