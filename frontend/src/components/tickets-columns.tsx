"use client"

import * as React from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, ArrowUpDown, Mail, Phone, MessageSquare } from "lucide-react"
import type { Ticket, TicketChannel, TicketPriority } from "@/types/tickets"
import { STATUS_LABEL, PRIORITY_LABEL, STATUS_STYLE, PRIORITY_STYLE } from "@/lib/tickets"
import { formatTimeAgo } from "@/lib/datetime"

const CHANNEL_ICON: Record<TicketChannel, React.ReactNode> = {
  email: <Mail className="size-3.5" />,
  phone: <Phone className="size-3.5" />,
  web: <MessageSquare className="size-3.5" />,
  chat: <MessageSquare className="size-3.5" />,
}

export const ticketsColumns: ColumnDef<Ticket>[] = [
  // Colonne cachée pour la recherche globale
  {
    id: "search",
    accessorFn: (row) =>
      `${row.subject} ${row.customerName} ${row.customerEmail} ${row.companyName}`.toLowerCase(),
    header: () => null,
    cell: () => null,
    enableSorting: false,
    filterFn: "includesString",
    enableHiding: false,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 36,
    minSize: 36,
    maxSize: 36,
  },
  {
    id: "channel",
    header: () => <div className="w-8" />,
    cell: ({ row }) => (
      <div className="size-7 rounded-full bg-sky-100 text-sky-700 grid place-items-center">
        {CHANNEL_ICON[row.original.channel]}
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
    minSize: 40,
    maxSize: 40,
  },
  {
    accessorKey: "subject",
    filterFn: "includesString",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Objet
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="max-w-[32ch] truncate font-medium">{row.original.subject}</div>
    ),
  },
  {
    accessorKey: "customerName",
    header: "Client",
    cell: ({ row }) => (
      <div className="max-w-[24ch] truncate">{row.original.customerName}</div>
    ),
  },
  {
    accessorKey: "companyName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Société
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="max-w-[24ch] truncate">{row.original.companyName}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => (
      <Badge variant="outline" className={STATUS_STYLE[row.original.status]}>
        {STATUS_LABEL[row.original.status]}
      </Badge>
    ),
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Priorité
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    sortingFn: (rowA, rowB, columnId) => {
      const rank: Record<TicketPriority, number> = {
        urgent: 4,
        high: 3,
        normal: 2,
        low: 1,
      }
      const a = rowA.getValue(columnId) as TicketPriority
      const b = rowB.getValue(columnId) as TicketPriority
      return rank[a] - rank[b]
    },
    cell: ({ row }) => (
      <Badge variant="outline" className={PRIORITY_STYLE[row.original.priority]}>
        {PRIORITY_LABEL[row.original.priority]}
      </Badge>
    ),
  },
  {
    accessorKey: "assignedTo",
    header: "Assigné",
    cell: ({ row }) => <div className="max-w-[18ch] truncate">{row.original.assignedTo ?? "—"}</div>,
  },
  {
    accessorKey: "updatedAt",
    header: () => <div className="text-right">Mis à jour</div>,
    cell: ({ row }) => (
      <div className="text-right text-sm text-slate-500">
        {formatTimeAgo(row.original.updatedAt)}
      </div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const ticket = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Ouvrir le menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(ticket.id)}>
              Copier l'ID du ticket
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Voir le client</DropdownMenuItem>
            <DropdownMenuItem>Assigner</DropdownMenuItem>
            <DropdownMenuItem>Fermer</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
