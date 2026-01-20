"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"
import type { PaymentIntent, PaymentIntentStatus } from "@/types/payment-intent"

interface PaymentIntentTableProps {
  paymentIntents: PaymentIntent[]
  onDelete?: (id: string) => void
}

const statusColors: Record<PaymentIntentStatus, string> = {
  pending: "bg-yellow-500",
  processing: "bg-blue-500",
  succeeded: "bg-green-500",
  failed: "bg-red-500",
  cancelled: "bg-gray-500",
}

export function PaymentIntentTable({
  paymentIntents,
  onDelete,
}: PaymentIntentTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>PSP</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>PSP Payment ID</TableHead>
            <TableHead>Error</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paymentIntents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Aucun payment intent trouvé
              </TableCell>
            </TableRow>
          ) : (
            paymentIntents.map((intent) => (
              <TableRow key={intent.id}>
                <TableCell className="font-mono text-xs">
                  {intent.id.slice(0, 8)}...
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{intent.pspName}</Badge>
                </TableCell>
                <TableCell>
                  {intent.amount.toFixed(2)} {intent.currency}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[intent.status]}>
                    {intent.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {intent.pspPaymentId?.slice(0, 12) || "-"}
                </TableCell>
                <TableCell className="text-xs text-red-500">
                  {intent.errorCode || "-"}
                </TableCell>
                <TableCell className="text-right">
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(intent.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
