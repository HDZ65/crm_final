"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle } from "lucide-react"
import type { PaymentEventResponse } from "@proto/payments/payment"

interface PaymentEventTableProps {
  paymentEvents: PaymentEventResponse[]
}

const eventTypeColors: Record<string, string> = {
  payment_initiated: "bg-blue-500",
  payment_confirmed: "bg-green-500",
  payment_failed: "bg-red-500",
  payment_pending: "bg-yellow-500",
  mandate_cancelled: "bg-gray-500",
  payment_refunded: "bg-purple-500",
  PAYMENT_INITIATED: "bg-blue-500",
  PAYMENT_CONFIRMED: "bg-green-500",
  PAYMENT_FAILED: "bg-red-500",
  PAYMENT_PENDING: "bg-yellow-500",
  MANDATE_CANCELLED: "bg-gray-500",
  PAYMENT_REFUNDED: "bg-purple-500",
}

export function PaymentEventTable({ paymentEvents }: PaymentEventTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Event Type</TableHead>
            <TableHead>Received At</TableHead>
            <TableHead>Processed</TableHead>
            <TableHead>Processed At</TableHead>
            <TableHead>Error</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paymentEvents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Aucun payment event trouvé
              </TableCell>
            </TableRow>
          ) : (
            paymentEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-mono text-xs">
                  {event.id.slice(0, 8)}...
                </TableCell>
                <TableCell>
                  <Badge className={eventTypeColors[event.eventType]}>
                    {event.eventType}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {new Date(event.receivedAt).toLocaleString("fr-FR")}
                </TableCell>
                <TableCell>
                  {event.processed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {event.processedAt
                    ? new Date(event.processedAt).toLocaleString("fr-FR")
                    : "-"}
                </TableCell>
                <TableCell className="text-xs text-red-500">
                  {event.errorMessage || "-"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
