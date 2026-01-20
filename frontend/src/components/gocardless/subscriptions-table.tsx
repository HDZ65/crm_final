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
import { MoreHorizontal, RefreshCw, XCircle, Pause, Play } from "lucide-react"
import type { GocardlessSubscription, SubscriptionStatus, IntervalUnit } from "@/types/gocardless"

const STATUS_CONFIG: Record<
  SubscriptionStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending_customer_approval: { label: "En attente", variant: "secondary" },
  customer_approval_denied: { label: "Refusé", variant: "destructive" },
  active: { label: "Actif", variant: "default" },
  finished: { label: "Terminé", variant: "outline" },
  cancelled: { label: "Annulé", variant: "outline" },
  paused: { label: "En pause", variant: "secondary" },
}

const INTERVAL_LABELS: Record<IntervalUnit, string> = {
  weekly: "Semaine",
  monthly: "Mois",
  yearly: "An",
}

interface GocardlessSubscriptionsTableProps {
  subscriptions: GocardlessSubscription[]
  loading?: boolean
  onRefresh?: () => void
  onCancel?: (subscriptionId: string) => void
  onPause?: (subscriptionId: string) => void
  onResume?: (subscriptionId: string) => void
}

export function GocardlessSubscriptionsTable({
  subscriptions,
  loading,
  onRefresh,
  onCancel,
  onPause,
  onResume,
}: GocardlessSubscriptionsTableProps) {
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

  const formatInterval = (unit: IntervalUnit, interval: number) => {
    if (interval === 1) {
      return `Chaque ${INTERVAL_LABELS[unit].toLowerCase()}`
    }
    return `Tous les ${interval} ${INTERVAL_LABELS[unit].toLowerCase()}s`
  }

  const canCancel = (status: SubscriptionStatus) =>
    ["active", "paused", "pending_customer_approval"].includes(status)

  const canPause = (status: SubscriptionStatus) => status === "active"

  const canResume = (status: SubscriptionStatus) => status === "paused"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Abonnements
            </CardTitle>
            <CardDescription>
              Gestion des prélèvements récurrents
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
        {subscriptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun abonnement configuré
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Fréquence</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Prochain prélèvement</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => {
                const statusConfig = STATUS_CONFIG[subscription.status] || STATUS_CONFIG.active
                const nextPayment = subscription.upcomingPayments?.[0]

                return (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">
                      {subscription.name || subscription.gocardlessSubscriptionId.slice(0, 12)}
                    </TableCell>
                    <TableCell>
                      {formatAmount(subscription.amount, subscription.currency)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatInterval(subscription.intervalUnit, subscription.interval)}
                      {subscription.dayOfMonth && (
                        <span className="text-muted-foreground">
                          {" "}
                          (le {subscription.dayOfMonth})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {nextPayment ? (
                        <span>
                          {formatDate(nextPayment.chargeDate)}
                          <span className="text-muted-foreground text-xs ml-1">
                            ({formatAmount(nextPayment.amount, subscription.currency)})
                          </span>
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {(canCancel(subscription.status) ||
                        canPause(subscription.status) ||
                        canResume(subscription.status)) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canPause(subscription.status) && onPause && (
                              <DropdownMenuItem onClick={() => onPause(subscription.id)}>
                                <Pause className="mr-2 h-4 w-4" />
                                Mettre en pause
                              </DropdownMenuItem>
                            )}
                            {canResume(subscription.status) && onResume && (
                              <DropdownMenuItem onClick={() => onResume(subscription.id)}>
                                <Play className="mr-2 h-4 w-4" />
                                Reprendre
                              </DropdownMenuItem>
                            )}
                            {canCancel(subscription.status) && onCancel && (
                              <DropdownMenuItem
                                onClick={() => onCancel(subscription.id)}
                                className="text-destructive"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Annuler
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
