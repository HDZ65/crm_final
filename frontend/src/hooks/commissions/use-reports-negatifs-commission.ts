"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"

// ============================================================================
// Types
// ============================================================================

export interface ReportNegatifDisplay {
  id: string
  organisationId: string
  commissionId: string
  contratId: string
  apporteurId: string
  bordereauId: string | null
  montantNegatif: string
  motif: string
  periodeOrigine: string
  statut: number
  dateCreation: Date | string
  dateTraitement: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface ReportsNegatifsFilters {
  organisationId?: string
  apporteurId?: string
  statut?: number
  limit?: number
  offset?: number
}

interface ReportNegatifListResult {
  reports: ReportNegatifDisplay[]
  total: number
}

// ============================================================================
// READ hooks
// ============================================================================

/**
 * Hook pour recuperer les reports negatifs avec filtres
 * GET /reports-negatifs-commission
 */
export function useReportsNegatifs(filters?: ReportsNegatifsFilters) {
  const [reports, setReports] = useState<ReportNegatifDisplay[]>([])
  const [total, setTotal] = useState(0)
  const { loading, error, execute } = useApi<ReportNegatifListResult>()

  const fetchReports = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters?.organisationId) {
        params.append("organisationId", filters.organisationId)
      }
      if (filters?.apporteurId) {
        params.append("apporteurId", filters.apporteurId)
      }
      if (filters?.statut !== undefined) {
        params.append("statut", String(filters.statut))
      }
      if (filters?.limit !== undefined) {
        params.append("limit", String(filters.limit))
      }
      if (filters?.offset !== undefined) {
        params.append("offset", String(filters.offset))
      }

      const queryString = params.toString()
      const endpoint = queryString
        ? `/reports-negatifs-commission?${queryString}`
        : "/reports-negatifs-commission"

      const data = await execute(() => api.get(endpoint))
      if (data) {
        setReports(data.reports ?? [])
        setTotal(data.total ?? 0)
      }
    } catch {
      // Error handled by useApi
    }
  }, [
    execute,
    filters?.organisationId,
    filters?.apporteurId,
    filters?.statut,
    filters?.limit,
    filters?.offset,
  ])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  return {
    reports,
    total,
    loading,
    error,
    refetch: fetchReports,
  }
}
