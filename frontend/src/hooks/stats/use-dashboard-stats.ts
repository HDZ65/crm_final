"use client"

import { useCallback } from "react"
import type { StatsFilters } from "@/types/stats"
import { useDashboardKPIs } from "./use-dashboard-kpis"
import { useCAEvolution } from "./use-ca-evolution"
import { useProductDistribution } from "./use-product-distribution"
import { useCompanyStats } from "./use-company-stats"
import { useAlerts } from "./use-alerts"

interface UseDashboardStatsOptions {
  filters?: StatsFilters
  skip?: boolean
}

/**
 * Combined hook for fetching all dashboard statistics
 * Aggregates all individual stats hooks for convenient usage
 */
export function useDashboardStats(options: UseDashboardStatsOptions = {}) {
  const { filters, skip = false } = options

  const kpis = useDashboardKPIs({ filters, skip })
  const caEvolution = useCAEvolution({ filters, skip })
  const productDistribution = useProductDistribution({ filters, skip })
  const companyStats = useCompanyStats({ filters, skip })
  const alerts = useAlerts({ filters, skip })

  // Global loading state
  const isLoading =
    kpis.loading ||
    caEvolution.loading ||
    productDistribution.loading ||
    companyStats.loading ||
    alerts.loading

  // Global error state (returns first error found)
  const error =
    kpis.error ||
    caEvolution.error ||
    productDistribution.error ||
    companyStats.error ||
    alerts.error

  // Refetch all data
  const refetchAll = useCallback(async () => {
    await Promise.all([
      kpis.refetch(),
      caEvolution.refetch(),
      productDistribution.refetch(),
      companyStats.refetch(),
      alerts.refetch(),
    ])
  }, [kpis, caEvolution, productDistribution, companyStats, alerts])

  return {
    // Individual hook results
    kpis,
    caEvolution,
    productDistribution,
    companyStats,
    alerts,

    // Convenience accessors for transformed data
    kpiCards: kpis.kpiCards,
    chartCAData: caEvolution.chartData,
    chartProductData: productDistribution.chartData,
    tableCompanyData: companyStats.tableData,
    alertsList: alerts.alerts,
    alertCounts: alerts.counts,

    // Global states
    isLoading,
    error,
    refetchAll,
  }
}
