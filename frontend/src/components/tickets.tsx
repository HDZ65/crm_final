"use client"

import * as React from "react"
import {
  Mail,
  Maximize2,
  MessageSquare,
  Phone,
  Ticket as TicketIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Input } from "./ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { Badge } from "./ui/badge"
import { TicketsTable } from "@/components/tickets-table"
import type { Ticket } from "@/types/tickets"
import { STATUS_LABEL, PRIORITY_LABEL, STATUS_STYLE, PRIORITY_STYLE } from "@/lib/tickets"
import { formatTimeAgo } from "@/lib/datetime"
import { ScrollArea } from "./ui/scroll-area"

type Company = { id: string; name: string }

const COMPANIES: Company[] = [
  { id: "acme", name: "CRM Client" },
  { id: "globex", name: "Globex SA" },
  { id: "innotech", name: "Innotech SARL" },
]

const CHANNEL_ICON = {
  email: <Mail className="size-3.5" />,
  phone: <Phone className="size-3.5" />,
  web: <MessageSquare className="size-3.5" />,
  chat: <MessageSquare className="size-3.5" />,
} as const

const NOW = Date.now()
const MOCK_TICKETS: Ticket[] = [
  {
    id: "t-101",
    subject: "Impossible d'accéder à mon espace client",
    customerName: "Jean Dupont",
    customerEmail: "jean.dupont@example.com",
    companyId: "acme",
    companyName: "CRM Client",
    status: "new",
    priority: "high",
    channel: "email",
    assignedTo: null,
    createdAt: new Date(NOW - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(NOW - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "t-102",
    subject: "Erreur 500 lors du paiement",
    customerName: "Sophie Martin",
    customerEmail: "sophie.martin@globex.co",
    companyId: "globex",
    companyName: "Globex SA",
    status: "new",
    priority: "urgent",
    channel: "web",
    assignedTo: "Moi",
    createdAt: new Date(NOW - 1000 * 60 * 90).toISOString(),
    updatedAt: new Date(NOW - 1000 * 60 * 20).toISOString(),
  },
  {
    id: "t-103",
    subject: "Facture manquante pour septembre",
    customerName: "Carlos Rodriguez",
    customerEmail: "carlos.rdz@innotech.io",
    companyId: "innotech",
    companyName: "Innotech SARL",
    status: "open",
    priority: "normal",
    channel: "email",
    assignedTo: "Moi",
    createdAt: new Date(NOW - 1000 * 60 * 60 * 28).toISOString(),
    updatedAt: new Date(NOW - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: "t-104",
    subject: "Question sur les tarifs entreprise",
    customerName: "Emma Davis",
    customerEmail: "emma.davis@acme.com",
    companyId: "acme",
    companyName: "CRM Client",
    status: "pending",
    priority: "low",
    channel: "phone",
    assignedTo: "Thomas",
    createdAt: new Date(NOW - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date(NOW - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "t-105",
    subject: "Problème d'activation de compte",
    customerName: "Nina Patel",
    customerEmail: "nina.patel@globex.co",
    companyId: "globex",
    companyName: "Globex SA",
    status: "resolved",
    priority: "normal",
    channel: "web",
    assignedTo: "Moi",
    createdAt: new Date(NOW - 1000 * 60 * 60 * 50).toISOString(),
    updatedAt: new Date(NOW - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    id: "t-106",
    subject: "Remboursement non reçu",
    customerName: "Sarah Connor",
    customerEmail: "s.connor@example.com",
    companyId: "innotech",
    companyName: "Innotech SARL",
    status: "open",
    priority: "high",
    channel: "email",
    assignedTo: null,
    createdAt: new Date(NOW - 1000 * 60 * 60 * 3).toISOString(),
    updatedAt: new Date(NOW - 1000 * 60 * 40).toISOString(),
  },
  {
    id: "t-107",
    subject: "Accès API: quota dépassé",
    customerName: "Raj Patel",
    customerEmail: "raj@acme.com",
    companyId: "acme",
    companyName: "CRM Client",
    status: "pending",
    priority: "urgent",
    channel: "web",
    assignedTo: "Amélie",
    createdAt: new Date(NOW - 1000 * 60 * 60 * 10).toISOString(),
    updatedAt: new Date(NOW - 1000 * 60 * 60 * 1).toISOString(),
  },
  {
    id: "t-108",
    subject: "Changement d'adresse de facturation",
    customerName: "Pierre Laurent",
    customerEmail: "p.laurent@globex.co",
    companyId: "globex",
    companyName: "Globex SA",
    status: "closed",
    priority: "low",
    channel: "email",
    assignedTo: "Sophie",
    createdAt: new Date(NOW - 1000 * 60 * 60 * 200).toISOString(),
    updatedAt: new Date(NOW - 1000 * 60 * 60 * 100).toISOString(),
  },
  {
    id: "t-109",
    subject: "Relance: devis non reçu",
    customerName: "Alex Thompson",
    customerEmail: "alex.th@innotech.io",
    companyId: "innotech",
    companyName: "Innotech SARL",
    status: "new",
    priority: "normal",
    channel: "email",
    assignedTo: null,
    createdAt: new Date(NOW - 1000 * 60 * 55).toISOString(),
    updatedAt: new Date(NOW - 1000 * 60 * 10).toISOString(),
  },
  {
    id: "t-110",
    subject: "Incident production - lenteurs",
    customerName: "Lisa Wong",
    customerEmail: "lisa.wong@example.com",
    companyId: "acme",
    companyName: "CRM Client",
    status: "open",
    priority: "urgent",
    channel: "phone",
    assignedTo: "Moi",
    createdAt: new Date(NOW - 1000 * 60 * 70).toISOString(),
    updatedAt: new Date(NOW - 1000 * 60 * 15).toISOString(),
  },
]

 

export default function Tickets() {
  const [search, setSearch] = React.useState("")
  const [company, setCompany] = React.useState<string>("all")
  const [status, setStatus] = React.useState<string>("all")
  const [assignment, setAssignment] = React.useState<string>("all")

  const [tickets, setTickets] = React.useState<Ticket[]>(MOCK_TICKETS)

  const filtered = React.useMemo(() => {
    let list = [...tickets]
    if (company !== "all") list = list.filter((t) => t.companyId === company)
    if (status !== "all") list = list.filter((t) => t.status === status)
    if (assignment === "me") list = list.filter((t) => t.assignedTo === "Moi")
    if (assignment === "unassigned") list = list.filter((t) => !t.assignedTo)
    return list
  }, [tickets, company, status, assignment])

  const orderedByAdded = React.useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [filtered]
  )

  return (
    <Dialog >
      <Card className="col-span-1 h-full  text-slate-950 lg:col-span-8 bg-sky-50 border-sky-200">
        <CardHeader className="pb-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TicketIcon className="size-5" />
            <CardTitle className="text-base md:text-lg ">Tickets</CardTitle>
          </div>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Agrandir la carte">
              <Maximize2 className="size-4" />
            </Button>
          </DialogTrigger>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 ">
          {orderedByAdded.length === 0 ? (
            <div className="bg-white text-slate-700/90 mt-2 flex h-full w-full items-center justify-center rounded-xl border">
              Aucun ticket
            </div>
          ) : (
            <div className="bg-white rounded-xl border h-full overflow-hidden">
              <ScrollArea className="h-full">
                <ul className="divide-y h-full overflow-y-auto p-3">
                  {orderedByAdded.map((t) => (
                    <li key={t.id} className="py-2.5 flex items-center gap-3">
                      <div className="size-7 rounded-full bg-sky-100 text-sky-700 grid place-items-center">
                        {CHANNEL_ICON[t.channel]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="truncate font-medium text-slate-800">
                            {t.subject}
                          </div>
                          <Badge variant="outline" className={`${PRIORITY_STYLE[t.priority]}`}>
                            {PRIORITY_LABEL[t.priority]}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {t.customerName} • {t.companyName}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className={`${STATUS_STYLE[t.status]}`}>
                          {STATUS_LABEL[t.status]}
                        </Badge>
                        <div className="text-[11px] text-slate-500">
                          {formatTimeAgo(t.createdAt)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      <DialogContent className="sm:max-w-7xl w-[95vw] p-0 max-h-[85vh] overflow-hidden">
        <div className="flex max-h-[85vh] flex-col bg-gradient-to-br from-sky-50 to-sky-100 border-sky-200">
          <div className="flex items-center justify-between p-4 pb-0">
            <div className="flex items-center gap-2 text-slate-700">
              <TicketIcon className="size-5" />
              <DialogTitle className="text-base md:text-lg">Tickets</DialogTitle>
            </div>
          </div>
          <div className="p-4 pt-2 flex-1 min-h-0 flex flex-col gap-3">
            <div className="bg-white rounded-xl border p-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-5">
                <div className="flex gap-2">
                  <Input
                    placeholder="Rechercher (objet, client, email)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <Select value={company} onValueChange={setCompany}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Société" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les sociétés</SelectItem>
                      {COMPANIES.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="new">Nouveau</SelectItem>
                      <SelectItem value="open">Ouvert</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="resolved">Résolu</SelectItem>
                      <SelectItem value="closed">Fermé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={assignment} onValueChange={setAssignment}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Assignation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="me">Assignés à moi</SelectItem>
                      <SelectItem value="unassigned">Non assignés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <div className="text-xs text-slate-500">
                    {filtered.length} ticket{filtered.length > 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white text-slate-700/90 rounded-xl border p-2 flex-1 min-h-0">
              <TicketsTable
                data={filtered as Ticket[]}
                search={search}
                onBulkDelete={(ids) =>
                  setTickets((prev) => prev.filter((t) => !ids.includes(t.id)))
                }
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function xPlural(n: number) {
  return n > 1 ? "x" : ""
}
