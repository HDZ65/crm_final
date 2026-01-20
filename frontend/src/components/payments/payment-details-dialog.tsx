"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  BanIcon,
  ArrowRight,
  Copy,
  ExternalLink,
} from "lucide-react"
import type { Payment, PaymentStatus } from "@/types/payment"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface PaymentDetailsDialogProps {
  payment: Payment | null
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function PaymentDetailsDialog({
  payment,
  open,
  onOpenChange,
}: PaymentDetailsDialogProps) {
  if (!payment) return null

  const status = statusConfig[payment.status]
  const StatusIcon = status.icon

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copié`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails du paiement</DialogTitle>
          <DialogDescription>
            Référence: {payment.payment_reference}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statut */}
          <div>
            <h3 className="text-sm font-medium mb-3">Statut</h3>
            <Badge variant="outline" className={cn("gap-2 text-sm py-1", status.className)}>
              <StatusIcon className="size-4" />
              {status.label}
            </Badge>
          </div>

          <Separator />

          {/* Informations client */}
          <div>
            <h3 className="text-sm font-medium mb-3">Client & Contrat</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Client</dt>
                <dd className="font-medium">{payment.client_name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Société</dt>
                <dd className="font-medium">{payment.company}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Contrat</dt>
                <dd className="font-medium font-mono text-xs">
                  {payment.contract_reference}
                </dd>
              </div>
              {payment.commercial_name && (
                <div>
                  <dt className="text-muted-foreground">Commercial</dt>
                  <dd className="font-medium">{payment.commercial_name}</dd>
                </div>
              )}
            </dl>
          </div>

          <Separator />

          {/* Informations financières */}
          <div>
            <h3 className="text-sm font-medium mb-3">Informations financières</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Montant</dt>
                <dd className="text-lg font-bold">
                  {payment.amount.toFixed(2)} {payment.currency}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Mode de paiement</dt>
                <dd className="font-medium">{payment.payment_method}</dd>
              </div>
              {payment.iban_masked && (
                <div>
                  <dt className="text-muted-foreground">IBAN</dt>
                  <dd className="font-mono text-xs">{payment.iban_masked}</dd>
                </div>
              )}
              {payment.rum && (
                <div>
                  <dt className="text-muted-foreground">RUM</dt>
                  <dd className="font-mono text-xs flex items-center gap-2">
                    {payment.rum}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() => copyToClipboard(payment.rum!, "RUM")}
                    >
                      <Copy className="size-3" />
                    </Button>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <Separator />

          {/* PSP & Routage */}
          <div>
            <h3 className="text-sm font-medium mb-3">PSP & Routage</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Fournisseur PSP</dt>
                <dd className="font-medium">{payment.psp_provider}</dd>
              </div>
              {payment.psp_transaction_id && (
                <div>
                  <dt className="text-muted-foreground">Transaction ID</dt>
                  <dd className="font-mono text-xs flex items-center gap-2">
                    {payment.psp_transaction_id}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() =>
                        copyToClipboard(payment.psp_transaction_id!, "Transaction ID")
                      }
                    >
                      <Copy className="size-3" />
                    </Button>
                  </dd>
                </div>
              )}
              {payment.debit_lot && (
                <div>
                  <dt className="text-muted-foreground">Lot</dt>
                  <dd>
                    <Badge variant="outline" className="font-mono">
                      {payment.debit_lot}
                    </Badge>
                  </dd>
                </div>
              )}
              {payment.preferred_debit_day && (
                <div>
                  <dt className="text-muted-foreground">Jour préféré</dt>
                  <dd className="font-medium">{payment.preferred_debit_day}</dd>
                </div>
              )}
            </dl>
          </div>

          <Separator />

          {/* Dates */}
          <div>
            <h3 className="text-sm font-medium mb-3">Dates</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Date planifiée</dt>
                <dd className="font-medium">
                  {new Date(payment.planned_debit_date).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
              {payment.actual_debit_date && (
                <div>
                  <dt className="text-muted-foreground">Date réelle</dt>
                  <dd className="font-medium">
                    {new Date(payment.actual_debit_date).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Créé le</dt>
                <dd className="text-xs">
                  {new Date(payment.created_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Mis à jour le</dt>
                <dd className="text-xs">
                  {new Date(payment.updated_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
            </dl>
          </div>

          {/* Scoring & Risque */}
          {(payment.risk_score !== undefined || payment.risk_tier) && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-3">Scoring & Risque</h3>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {payment.risk_score !== undefined && (
                    <div>
                      <dt className="text-muted-foreground">Score de risque</dt>
                      <dd className="font-medium">{payment.risk_score} / 100</dd>
                    </div>
                  )}
                  {payment.risk_tier && (
                    <div>
                      <dt className="text-muted-foreground">Niveau de risque</dt>
                      <dd>
                        <Badge
                          variant="outline"
                          className={cn(
                            payment.risk_tier === "LOW" &&
                              "bg-green-500/10 text-green-700 border-green-500/20",
                            payment.risk_tier === "MEDIUM" &&
                              "bg-orange-500/10 text-orange-700 border-orange-500/20",
                            payment.risk_tier === "HIGH" &&
                              "bg-red-500/10 text-red-700 border-red-500/20"
                          )}
                        >
                          {payment.risk_tier === "LOW" && "Faible"}
                          {payment.risk_tier === "MEDIUM" && "Moyen"}
                          {payment.risk_tier === "HIGH" && "Élevé"}
                        </Badge>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </>
          )}

          {/* Réémission */}
          {(payment.retry_count !== undefined || payment.next_retry_date) && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-3">Réémission</h3>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {payment.retry_count !== undefined && (
                    <div>
                      <dt className="text-muted-foreground">Tentatives</dt>
                      <dd className="font-medium">
                        {payment.retry_count} / {payment.max_retry_attempts || 3}
                      </dd>
                    </div>
                  )}
                  {payment.next_retry_date && (
                    <div>
                      <dt className="text-muted-foreground">Prochaine tentative</dt>
                      <dd className="font-medium">
                        {new Date(payment.next_retry_date).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </>
          )}

          {/* Rejet */}
          {(payment.reject_reason || payment.reject_code) && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-3">Informations de rejet</h3>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {payment.reject_code && (
                    <div>
                      <dt className="text-muted-foreground">Code</dt>
                      <dd className="font-mono font-medium">{payment.reject_code}</dd>
                    </div>
                  )}
                  {payment.reject_reason && (
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Raison</dt>
                      <dd className="font-medium">{payment.reject_reason}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </>
          )}

          {/* Notes */}
          {payment.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-3">Notes</h3>
                <p className="text-sm text-muted-foreground">{payment.notes}</p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1">
              Voir le client
              <ExternalLink className="size-4 ml-2" />
            </Button>
            <Button variant="outline" className="flex-1">
              Voir le contrat
              <ExternalLink className="size-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
