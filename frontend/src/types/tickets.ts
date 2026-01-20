export type TicketStatus = "new" | "open" | "pending" | "resolved" | "closed"
export type TicketPriority = "low" | "normal" | "high" | "urgent"
export type TicketChannel = "email" | "phone" | "web" | "chat"

export type Ticket = {
  id: string
  subject: string
  customerName: string
  customerEmail: string
  companyId: string
  companyName: string
  status: TicketStatus
  priority: TicketPriority
  channel: TicketChannel
  assignedTo?: string | null
  createdAt: string
  updatedAt: string
}

