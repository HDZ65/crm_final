"use client"

import * as React from "react"
import { PaymentKPICards } from "@/components/payments/payment-kpi-cards"
import { PaymentFiltersComponent } from "@/components/payments/payment-filters"
import { PaymentTable } from "@/components/payments/payment-table"
import { PaymentDetailsDialog } from "@/components/payments/payment-details-dialog"
import { mockPayments, mockPaymentStats } from "@/data/mock-payment-data"
import type { Payment, PaymentFilters } from "@/types/payment"

export default function PaymentsPage() {
  const [filters, setFilters] = React.useState<PaymentFilters>({})
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)

  // Filter payments based on active filters
  const filteredPayments = React.useMemo(() => {
    return mockPayments.filter((payment) => {
      // Search filter (across multiple fields)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const searchableFields = [
          payment.client_name,
          payment.contract_reference,
          payment.payment_reference,
          payment.company,
        ].join(" ").toLowerCase()

        if (!searchableFields.includes(searchLower)) return false
      }

      // Company filter
      if (filters.company && payment.company !== filters.company) return false

      // Status filter
      if (filters.status && payment.status !== filters.status) return false

      // PSP filter
      if (filters.psp_provider && payment.psp_provider !== filters.psp_provider) return false

      // Lot filter
      if (filters.debit_lot && payment.debit_lot !== filters.debit_lot) return false

      // Payment method filter
      if (filters.payment_method && payment.payment_method !== filters.payment_method) return false

      // Risk tier filter
      if (filters.risk_tier && payment.risk_tier !== filters.risk_tier) return false

      // Source channel filter
      if (filters.source_channel && payment.source_channel !== filters.source_channel) return false

      // Date range filter
      if (filters.date_from) {
        const paymentDate = new Date(payment.planned_debit_date)
        const fromDate = new Date(filters.date_from)
        if (paymentDate < fromDate) return false
      }

      if (filters.date_to) {
        const paymentDate = new Date(payment.planned_debit_date)
        const toDate = new Date(filters.date_to)
        if (paymentDate > toDate) return false
      }

      return true
    })
  }, [filters])

  // Calculate filtered stats
  const filteredStats = React.useMemo(() => {
    const total_payments = filteredPayments.length
    const total_amount = filteredPayments.reduce((sum, p) => sum + p.amount, 0)
    const paid_count = filteredPayments.filter((p) => p.status === "PAID").length
    const paid_amount = filteredPayments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0)
    const pending_count = filteredPayments.filter((p) => p.status === "PENDING").length
    const pending_amount = filteredPayments
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + p.amount, 0)
    const rejected_count = filteredPayments.filter(
      (p) => p.status === "REJECT_INSUFF_FUNDS" || p.status === "REJECT_OTHER"
    ).length
    const rejected_amount = filteredPayments
      .filter((p) => p.status === "REJECT_INSUFF_FUNDS" || p.status === "REJECT_OTHER")
      .reduce((sum, p) => sum + p.amount, 0)

    const reject_rate = total_payments > 0 ? (rejected_count / total_payments) * 100 : 0
    const average_amount = total_payments > 0 ? total_amount / total_payments : 0

    return {
      total_payments,
      total_amount,
      paid_count,
      paid_amount,
      pending_count,
      pending_amount,
      rejected_count,
      rejected_amount,
      reject_rate,
      average_amount,
    }
  }, [filteredPayments])

  const handlePaymentClick = (payment: Payment) => {
    setSelectedPayment(payment)
    setDetailsOpen(true)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paiements</h1>
          <p className="text-muted-foreground">
            Gestion des paiements SEPA et CB
          </p>
        </div>
      </div>

      <PaymentKPICards stats={filteredStats} />

      <PaymentFiltersComponent filters={filters} onFiltersChange={setFilters} />

      <PaymentTable payments={filteredPayments} onViewDetails={handlePaymentClick} />

      <PaymentDetailsDialog
        payment={selectedPayment}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  )
}
