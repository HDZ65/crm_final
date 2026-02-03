import type { TicketPriority, TicketStatus } from "@/types/tickets"

export const STATUS_LABEL: Record<TicketStatus, string> = {
  new: "Nouveau",
  open: "Ouvert",
  pending: "En attente",
  resolved: "Résolu",
  closed: "Fermé",
}

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: "Basse",
  normal: "Normale",
  high: "Haute",
  urgent: "Urgente",
}

export const STATUS_STYLE: Record<TicketStatus, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  open: "bg-amber-50 text-amber-700 border-amber-200",
  pending: "bg-slate-50 text-slate-700 border-slate-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-zinc-50 text-zinc-600 border-zinc-200",
}

export const PRIORITY_STYLE: Record<TicketPriority, string> = {
  low: "bg-slate-50 text-slate-700 border-slate-200",
  normal: "bg-sky-50 text-sky-700 border-sky-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  urgent: "bg-red-50 text-red-700 border-red-200",
}
