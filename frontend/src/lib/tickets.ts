import type { TicketStatus, TicketPriority } from "@/types/tickets"

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
  new: "bg-blue-100 text-blue-800 border-blue-200",
  open: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  resolved: "bg-purple-100 text-purple-800 border-purple-200",
  closed: "bg-gray-100 text-gray-800 border-gray-200",
}

export const PRIORITY_STYLE: Record<TicketPriority, string> = {
  low: "bg-gray-100 text-gray-700 border-gray-200",
  normal: "bg-blue-100 text-blue-700 border-blue-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  urgent: "bg-red-100 text-red-700 border-red-200",
}
