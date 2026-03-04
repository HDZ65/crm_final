"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
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
import { MoreHorizontal, Pencil, Trash2, Store, Tag, Key, Activity, Link2, ArrowLeftRight, Clock } from "lucide-react"
import type {
  WooCommerceConfig,
  WooCommerceMapping,
  WooCommerceWebhookEvent,
} from "@proto/woocommerce/woocommerce"

// ---------------------------------------------------------------------------
// Configs columns
// ---------------------------------------------------------------------------

interface ConfigColumnHandlers {
  onEdit: (config: WooCommerceConfig) => void
  onDelete: (config: WooCommerceConfig) => void
  societes: Array<{ id: string; raisonSociale: string }>
}

export const createConfigColumns = (
  handlers: ConfigColumnHandlers
): ColumnDef<WooCommerceConfig>[] => [
  {
    accessorKey: "label",
    header: () => (
      <div className="flex items-center gap-1.5">
        <Tag className="size-4" />
        Label
      </div>
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.original.label || row.original.id}</div>
    ),
  },
  {
    accessorKey: "societeId",
    header: () => (
      <div className="flex items-center gap-1.5">
        <Store className="size-4" />
        Société
      </div>
    ),
    cell: ({ row }) => {
      const societe = handlers.societes.find((s) => s.id === row.original.societeId)
      return <div className="text-slate-700">{societe?.raisonSociale || "—"}</div>
    },
  },
  {
    accessorKey: "storeUrl",
    header: () => (
      <div className="flex items-center gap-1.5">
        <Link2 className="size-4" />
        URL Boutique
      </div>
    ),
    cell: ({ row }) => <div className="text-slate-700">{row.original.storeUrl}</div>,
  },
  {
    accessorKey: "consumerKey",
    header: () => (
      <div className="flex items-center gap-1.5">
        <Key className="size-4" />
        Consumer Key
      </div>
    ),
    cell: ({ row }) => (
      <div className="font-mono text-xs text-slate-600">
        {row.original.consumerKey ? row.original.consumerKey.substring(0, 20) + "..." : "—"}
      </div>
    ),
  },
  {
    accessorKey: "active",
    header: () => (
      <div className="flex items-center gap-1.5">
        <Activity className="size-4" />
        Actif
      </div>
    ),
    cell: ({ row }) => (
      <Badge variant={row.original.active ? "default" : "secondary"}>
        {row.original.active ? "Actif" : "Inactif"}
      </Badge>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => (
      <ConfigActionsCell
        config={row.original}
        onEdit={handlers.onEdit}
        onDelete={handlers.onDelete}
      />
    ),
  },
]

function ConfigActionsCell({
  config,
  onEdit,
  onDelete,
}: {
  config: WooCommerceConfig
  onEdit: (config: WooCommerceConfig) => void
  onDelete: (config: WooCommerceConfig) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onEdit(config)}>
          <Pencil className="size-4 mr-2" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(config)}>
          <Trash2 className="size-4 mr-2" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ---------------------------------------------------------------------------
// Mappings columns
// ---------------------------------------------------------------------------

interface MappingColumnHandlers {
  onEdit: (mapping: WooCommerceMapping) => void
  onDelete: (mapping: WooCommerceMapping) => void
}

export const createMappingColumns = (
  handlers: MappingColumnHandlers
): ColumnDef<WooCommerceMapping>[] => [
  {
    accessorKey: "entityType",
    header: () => (
      <div className="flex items-center gap-1.5">
        <Tag className="size-4" />
        Configuration
      </div>
    ),
    cell: ({ row }) => <div className="text-slate-700">{row.original.entityType}</div>,
  },
  {
    accessorKey: "internalId",
    header: () => (
      <div className="flex items-center gap-1.5">
        <Store className="size-4" />
        Produit CRM
      </div>
    ),
    cell: ({ row }) => (
      <div className="font-mono text-xs text-slate-600">{row.original.internalId}</div>
    ),
  },
  {
    accessorKey: "externalId",
    header: () => (
      <div className="flex items-center gap-1.5">
        <ArrowLeftRight className="size-4" />
        Produit WooCommerce
      </div>
    ),
    cell: ({ row }) => (
      <div className="font-mono text-xs text-slate-600">{row.original.externalId}</div>
    ),
  },
  {
    accessorKey: "syncStatus",
    header: () => (
      <div className="flex items-center gap-1.5">
        <Activity className="size-4" />
        Sync
      </div>
    ),
    cell: ({ row }) => (
      <Badge variant={row.original.syncStatus === "active" || row.original.syncStatus === "SYNCED" ? "default" : "secondary"}>
        {row.original.syncStatus === "active" || row.original.syncStatus === "SYNCED" ? "Actif" : row.original.syncStatus || "Inactif"}
      </Badge>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => (
      <MappingActionsCell
        mapping={row.original}
        onEdit={handlers.onEdit}
        onDelete={handlers.onDelete}
      />
    ),
  },
]

function MappingActionsCell({
  mapping,
  onEdit,
  onDelete,
}: {
  mapping: WooCommerceMapping
  onEdit: (mapping: WooCommerceMapping) => void
  onDelete: (mapping: WooCommerceMapping) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onEdit(mapping)}>
          <Pencil className="size-4 mr-2" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(mapping)}>
          <Trash2 className="size-4 mr-2" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ---------------------------------------------------------------------------
// Webhooks columns
// ---------------------------------------------------------------------------

export const webhookColumns: ColumnDef<WooCommerceWebhookEvent>[] = [
  {
    accessorKey: "topic",
    header: () => (
      <div className="flex items-center gap-1.5">
        <Tag className="size-4" />
        Type
      </div>
    ),
    cell: ({ row }) => <div className="font-medium">{row.original.topic}</div>,
  },
  {
    accessorKey: "payload",
    header: "Payload",
    cell: ({ row }) => (
      <div className="font-mono text-xs max-w-xs truncate text-slate-600">
        {row.original.payload}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: () => (
      <div className="flex items-center gap-1.5">
        <Activity className="size-4" />
        Statut
      </div>
    ),
    cell: ({ row }) => (
      <Badge variant={row.original.status === "processed" ? "default" : "secondary"}>
        {row.original.status === "processed" ? "Traité" : "En attente"}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: () => (
      <div className="flex items-center gap-1.5">
        <Clock className="size-4" />
        Date
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-600">
        {new Date(row.original.createdAt).toLocaleString("fr-FR")}
      </div>
    ),
  },
]
