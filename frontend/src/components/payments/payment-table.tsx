"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  BanIcon,
  ArrowRight,
  MoreVertical,
} from "lucide-react"
import type { Payment, PaymentStatus } from "@/types/payment"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface PaymentTableProps {
  payments: Payment[]
  onViewDetails: (payment: Payment) => void
}

const statusConfig: Record<
  PaymentStatus,
  {
    label: string
    icon: React.ElementType
    className: string
  }
> = {
  PAID: {
    label: "Payé",
    icon: CheckCircle2,
    className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  },
  PENDING: {
    label: "En attente",
    icon: Clock,
    className: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  },
  SUBMITTED: {
    label: "Soumis",
    icon: ArrowRight,
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  REJECT_INSUFF_FUNDS: {
    label: "Rejet AM04",
    icon: AlertCircle,
    className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  },
  REJECT_OTHER: {
    label: "Rejet autre",
    icon: XCircle,
    className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  },
  REFUNDED: {
    label: "Remboursé",
    icon: RefreshCw,
    className: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  },
  CANCELLED: {
    label: "Annulé",
    icon: BanIcon,
    className: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  },
  API_ERROR: {
    label: "Erreur API",
    icon: XCircle,
    className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  },
  RETRY_SCHEDULED: {
    label: "Réémission planifiée",
    icon: Clock,
    className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  },
}

const riskTierConfig = {
  LOW: {
    label: "Faible",
    className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  },
  MEDIUM: {
    label: "Moyen",
    className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  },
  HIGH: {
    label: "Élevé",
    className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  },
}

export function PaymentTable({ payments, onViewDetails }: PaymentTableProps) {
  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg border-dashed">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Clock className="size-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Aucun paiement trouvé</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Aucun paiement ne correspond à vos critères de recherche.
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <ScrollArea className="h-[600px]">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[140px]">Référence</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Société</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>PSP</TableHead>
              <TableHead>Lot</TableHead>
              <TableHead>Date planifiée</TableHead>
              <TableHead>Risque</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => {
              const status = statusConfig[payment.status]
              const StatusIcon = status.icon
              const riskStyle = payment.risk_tier ? riskTierConfig[payment.risk_tier] : null

              return (
                <TableRow
                  key={payment.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onViewDetails(payment)}
                >
                  <TableCell className="font-medium">
                    <div className="space-y-1">
                      <div className="font-mono text-xs">{payment.payment_reference}</div>
                      {payment.retry_count !== undefined && payment.retry_count > 0 && (
                        <Badge variant="outline" className="text-[10px] font-normal">
                          Tentative {payment.retry_count + 1}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{payment.client_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {payment.contract_reference}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{payment.company}</span>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-sm">
                      {payment.amount.toFixed(2)} {payment.currency}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {payment.payment_method}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("gap-1", status.className)}>
                      <StatusIcon className="size-3" />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{payment.psp_provider}</span>
                  </TableCell>
                  <TableCell>
                    {payment.debit_lot && (
                      <Badge variant="outline" className="font-mono text-xs">
                        {payment.debit_lot}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(payment.planned_debit_date).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {riskStyle && (
                      <div className="space-y-1">
                        <Badge variant="outline" className={cn("text-[10px]", riskStyle.className)}>
                          {riskStyle.label}
                        </Badge>
                        {payment.risk_score !== undefined && (
                          <div className="text-xs text-muted-foreground">
                            Score: {payment.risk_score}
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewDetails(payment)
                      }}
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}
