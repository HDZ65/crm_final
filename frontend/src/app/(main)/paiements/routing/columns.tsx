"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

export interface RoutingRule {
  id: string
  name: string
  priority?: number
  conditions?: string
  providerAccountId?: string
  provider_account_id?: string
  isFallback?: boolean
  is_fallback?: boolean
  isEnabled?: boolean
  is_enabled?: boolean
  updatedAt?: string
  updated_at?: string
}

function formatDate(value?: string) {
  if (!value) return "-"
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return value
  return parsedDate.toLocaleString("fr-FR")
}

interface RoutingCallbacks {
  onEdit: (rule: RoutingRule) => void
  onDelete: (rule: RoutingRule) => void
}

export function createRoutingColumns(callbacks: RoutingCallbacks): ColumnDef<RoutingRule>[] {
  return [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priorite",
      cell: ({ row }) => row.original.priority ?? "-",
    },
    {
      id: "providerAccountId",
      header: "Compte fournisseur",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.providerAccountId ?? row.original.provider_account_id ?? "-"}
        </span>
      ),
    },
    {
      id: "isFallback",
      header: "Fallback",
      cell: ({ row }) => {
        const isFallback = Boolean(row.original.isFallback ?? row.original.is_fallback ?? false)
        return (
          <Badge variant={isFallback ? "default" : "secondary"}>
            {isFallback ? "Oui" : "Non"}
          </Badge>
        )
      },
    },
    {
      id: "isEnabled",
      header: "Statut",
      cell: ({ row }) => {
        const isEnabled = Boolean(row.original.isEnabled ?? row.original.is_enabled ?? false)
        return (
          <Badge variant={isEnabled ? "default" : "secondary"}>
            {isEnabled ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      id: "updatedAt",
      header: "Derniere maj",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.updatedAt ?? row.original.updated_at)}
        </span>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const rule = row.original
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => callbacks.onEdit(rule)}>
                  <Pencil className="size-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => callbacks.onDelete(rule)}>
                  <Trash2 className="size-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
}
