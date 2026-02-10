"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"

// ============================================================================
// Types
// ============================================================================

export interface AuditLogDisplay {
  id: string
  organisationId: string
  scope: number
  action: number
  refId: string
  userId: string
  apporteurId: string | null
  contratId: string | null
  baremeId: string | null
  periode: string | null
  details: string | null
  createdAt: Date | string
}

export interface AuditLogFilters {
  organisationId?: string
  scope?: number
  action?: number
  refId?: string
  userId?: string
  apporteurId?: string
  contratId?: string
  baremeId?: string
  periode?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}

interface AuditLogListResult {
  logs: AuditLogDisplay[]
  total: number
}

// ============================================================================
// READ hooks
// ============================================================================

/**
 * Hook pour recuperer les audit logs avec filtres
 * GET /audit-logs-commission
 */
export function useAuditLogs(filters?: AuditLogFilters) {
  const [auditLogs, setAuditLogs] = useState<AuditLogDisplay[]>([])
  const [total, setTotal] = useState(0)
  const { loading, error, execute } = useApi<AuditLogListResult>()

  const fetchAuditLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters?.organisationId) {
        params.append("organisationId", filters.organisationId)
      }
      if (filters?.scope !== undefined) {
        params.append("scope", String(filters.scope))
      }
      if (filters?.action !== undefined) {
        params.append("action", String(filters.action))
      }
      if (filters?.refId) {
        params.append("refId", filters.refId)
      }
      if (filters?.userId) {
        params.append("userId", filters.userId)
      }
      if (filters?.apporteurId) {
        params.append("apporteurId", filters.apporteurId)
      }
      if (filters?.contratId) {
        params.append("contratId", filters.contratId)
      }
      if (filters?.baremeId) {
        params.append("baremeId", filters.baremeId)
      }
      if (filters?.periode) {
        params.append("periode", filters.periode)
      }
      if (filters?.dateFrom) {
        params.append("dateFrom", filters.dateFrom)
      }
      if (filters?.dateTo) {
        params.append("dateTo", filters.dateTo)
      }
      if (filters?.limit !== undefined) {
        params.append("limit", String(filters.limit))
      }
      if (filters?.offset !== undefined) {
        params.append("offset", String(filters.offset))
      }

      const queryString = params.toString()
      const endpoint = queryString
        ? `/audit-logs-commission?${queryString}`
        : "/audit-logs-commission"

      const data = await execute(() => api.get(endpoint))
      if (data) {
        setAuditLogs(data.logs ?? [])
        setTotal(data.total ?? 0)
      }
    } catch {
      // Error handled by useApi
    }
  }, [
    execute,
    filters?.organisationId,
    filters?.scope,
    filters?.action,
    filters?.refId,
    filters?.userId,
    filters?.apporteurId,
    filters?.contratId,
    filters?.baremeId,
    filters?.periode,
    filters?.dateFrom,
    filters?.dateTo,
    filters?.limit,
    filters?.offset,
  ])

  useEffect(() => {
    fetchAuditLogs()
  }, [fetchAuditLogs])

  return {
    auditLogs,
    total,
    loading,
    error,
    refetch: fetchAuditLogs,
  }
}

/**
 * Hook pour recuperer les audit logs d'une commission specifique
 * GET /audit-logs-commission/by-commission/:commissionId
 */
export function useAuditLogsByCommission(commissionId: string | null) {
  const [auditLogs, setAuditLogs] = useState<AuditLogDisplay[]>([])
  const { loading, error, execute } = useApi<AuditLogListResult>()

  const fetchAuditLogs = useCallback(async () => {
    if (!commissionId) return

    try {
      const data = await execute(() =>
        api.get(`/audit-logs-commission/by-commission/${commissionId}`)
      )
      if (data) {
        setAuditLogs(data.logs ?? [])
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, commissionId])

  useEffect(() => {
    if (commissionId) {
      fetchAuditLogs()
    }
  }, [commissionId, fetchAuditLogs])

  return {
    auditLogs,
    loading,
    error,
    refetch: fetchAuditLogs,
  }
}
