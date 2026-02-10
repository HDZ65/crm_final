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
import type { Subscription, SubscriptionPlan } from "@proto/subscriptions/subscriptions"

const STATUS_OPTIONS = [
  { value: 0, label: "Non defini", variant: "outline" },
  { value: 1, label: "En attente", variant: "secondary" },
  { value: 2, label: "Essai", variant: "outline" },
  { value: 3, label: "Actif", variant: "default" },
  { value: 4, label: "En pause", variant: "secondary" },
  { value: 5, label: "Impaye", variant: "destructive" },
  { value: 6, label: "Suspendu", variant: "destructive" },
  { value: 7, label: "Annule", variant: "destructive" },
  { value: 8, label: "Expire", variant: "secondary" },
] as const

const INTERVAL_OPTIONS = [
  { value: 0, label: "Mensuel" },
  { value: 1, label: "Annuel" },
  { value: 2, label: "Hebdomadaire" },
] as const

function getStatusOption(status: number) {
  return STATUS_OPTIONS.find((option) => option.value === status) || STATUS_OPTIONS[0]
}

function getIntervalLabel(interval: number): string {
  return INTERVAL_OPTIONS.find((option) => option.value === interval)?.label || "Inconnu"
}

function formatDateDisplay(value?: string): string {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("fr-FR")
}

// --- Subscription columns ---

interface SubscriptionCallbacks {
  onEdit: (subscription: Subscription) => void
  onDelete: (subscription: Subscription) => void
}

export function createSubscriptionColumns(callbacks: SubscriptionCallbacks): ColumnDef<Subscription>[] {
  return [
    {
      accessorKey: "clientId",
      header: "Client",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.clientId}</span>
      ),
    },
    {
      accessorKey: "planId",
      header: "Plan",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.planId}</span>
      ),
    },
    {
      id: "status",
      header: "Statut",
      cell: ({ row }) => {
        const statusOption = getStatusOption(Number(row.original.status || 0))
        return <Badge variant={statusOption.variant}>{statusOption.label}</Badge>
      },
    },
    {
      id: "startDate",
      header: "Date debut",
      cell: ({ row }) => formatDateDisplay(row.original.startDate),
    },
    {
      id: "endDate",
      header: "Date fin",
      cell: ({ row }) => formatDateDisplay(row.original.endDate),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const subscription = row.original
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
                <DropdownMenuItem onClick={() => callbacks.onEdit(subscription)}>
                  <Pencil className="size-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => callbacks.onDelete(subscription)}>
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

// --- Plan columns ---

interface PlanCallbacks {
  onEdit: (plan: SubscriptionPlan) => void
  onDelete: (plan: SubscriptionPlan) => void
}

export function createPlanColumns(callbacks: PlanCallbacks): ColumnDef<SubscriptionPlan>[] {
  return [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.name}</div>
          <Badge variant="outline" className="font-mono text-xs">
            {row.original.code}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="max-w-[420px] text-sm text-muted-foreground line-clamp-2">
          {row.original.description || "-"}
        </span>
      ),
    },
    {
      id: "price",
      header: "Prix",
      cell: ({ row }) =>
        row.original.priceMonthly
          ? `${row.original.priceMonthly} ${row.original.currency || "EUR"}`
          : "-",
    },
    {
      id: "interval",
      header: "Intervalle",
      cell: ({ row }) => getIntervalLabel(Number(row.original.billingInterval || 0)),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const plan = row.original
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
                <DropdownMenuItem onClick={() => callbacks.onEdit(plan)}>
                  <Pencil className="size-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => callbacks.onDelete(plan)}>
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

export { STATUS_OPTIONS, INTERVAL_OPTIONS, getStatusOption, getIntervalLabel, formatDateDisplay }
