"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, RefreshCw, XCircle, Euro } from "lucide-react"
import type { GocardlessPayment, PaymentStatus } from "@/types/gocardless"

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending_customer_approval: { label: "En attente", variant: "secondary" },
  pending_submission: { label: "En attente", variant: "secondary" },
  submitted: { label: "Envoyé", variant: "secondary" },
  confirmed: { label: "Confirmé", variant: "default" },
  paid_out: { label: "Versé", variant: "default" },
  cancelled: { label: "Annulé", variant: "outline" },
  customer_approval_denied: { label: "Refusé", variant: "destructive" },
  failed: { label: "Échec", variant: "destructive" },
  charged_back: { label: "Remboursé", variant: "destructive" },
}

interface GocardlessPaymentsTableProps {
  payments: GocardlessPayment[]
  loading?: boolean
  onRefresh?: () => void
  onCancel?: (paymentId: string) => void
  onRetry?: (paymentId: string) => void
}

export function GocardlessPaymentsTable({
  payments,
  loading,
  onRefresh,
  onCancel,
  onRetry,
}: GocardlessPaymentsTableProps) {
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(amount / 100)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("fr-FR")
  }

  const canCancel = (status: PaymentStatus) =>
    ["pending_customer_approval", "pending_submission", "submitted"].includes(status)

  const canRetry = (status: PaymentStatus) =>
    ["failed", "charged_back"].includes(status)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Paiements
            </CardTitle>
            <CardDescription>
              Historique des prélèvements ponctuels
            </CardDescription>
          </div>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Rafraîchir
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun paiement enregistré
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date prélèvement</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => {
                const statusConfig = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending_submission
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-sm">
                      {payment.reference || payment.gocardlessPaymentId.slice(0, 12)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(payment.chargeDate)}</TableCell>
                    <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    <TableCell>
                      {(canCancel(payment.status) || canRetry(payment.status)) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canCancel(payment.status) && onCancel && (
                              <DropdownMenuItem onClick={() => onCancel(payment.id)}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Annuler
                              </DropdownMenuItem>
                            )}
                            {canRetry(payment.status) && onRetry && (
                              <DropdownMenuItem onClick={() => onRetry(payment.id)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Relancer
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
