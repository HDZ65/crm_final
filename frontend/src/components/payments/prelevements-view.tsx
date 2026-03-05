"use client"

import * as React from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PaymentKPICards } from "./payment-kpi-cards"
import { PaymentFiltersComponent } from "./payment-filters"
import { PaymentTable } from "./payment-table"
import { PaymentDetailsDialog } from "./payment-details-dialog"
import { PaymentsEmptyState } from "./empty-states"
import type { Payment, PaymentStats, PaymentFilters } from "@/lib/ui/display-types/payment"
import { AskAiCardButton } from "@/components/ask-ai-card-button"

interface PrelevementsViewProps {
  societeId: string
}

const defaultStats: PaymentStats = {
  total_payments: 0,
  total_amount: 0,
  paid_count: 0,
  paid_amount: 0,
  pending_count: 0,
  pending_amount: 0,
  rejected_count: 0,
  rejected_amount: 0,
  reject_rate: 0,
  average_amount: 0,
}

export function PrelevementsView({ societeId }: PrelevementsViewProps) {
  const [payments, setPayments] = React.useState<Payment[]>([])
  const [stats, setStats] = React.useState<PaymentStats | null>(null)
  const [filters, setFilters] = React.useState<PaymentFilters>({})
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [showFilters, setShowFilters] = React.useState(false)

  const rejectionRate = stats ? Math.round(stats.reject_rate * 100) : 0
  const totalAmount = stats ? stats.total_amount.toLocaleString('fr-FR') : '0'
  const rejectedCount = stats ? stats.rejected_count : 0
  const aiPrompt = `Analyse les prélèvements (${payments.length} au total). Taux de rejet: ${rejectionRate}%. Montant total: ${totalAmount}€. Prélèvements rejetés: ${rejectedCount}. Identifie les causes et propose des actions correctives.`
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <PaymentKPICards stats={stats ?? defaultStats} />

      {/* Filter Toggle Button */}
      <div className="flex items-center gap-2">
        <AskAiCardButton prompt={aiPrompt} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          {showFilters ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
          <span>Filtres</span>
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <PaymentFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && payments.length === 0 && <PaymentsEmptyState />}

      {/* Payment Table */}
      {!isLoading && payments.length > 0 && (
        <PaymentTable
          payments={payments}
          onViewDetails={setSelectedPayment}
        />
      )}

      {/* Payment Details Dialog */}
      <PaymentDetailsDialog
        payment={selectedPayment}
        open={selectedPayment !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPayment(null)
          }
        }}
      />
    </div>
  )
}
