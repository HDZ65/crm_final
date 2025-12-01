"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import type {
  CommissionResponseDto,
  CommissionWithDetailsResponseDto,
  CommissionFiltersDto,
  CommissionSummaryDto,
} from "@/types/commission-dto"

/**
 * Hook pour récupérer la liste des commissions
 * GET /commissions
 */
export function useCommissions(filters?: CommissionFiltersDto) {
  const [commissions, setCommissions] = useState<CommissionResponseDto[]>([])
  const { loading, error, execute } = useApi<CommissionResponseDto[]>()

  const fetchCommissions = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters?.organisationId) {
        params.append("organisationId", filters.organisationId)
      }
      if (filters?.apporteurId) {
        params.append("apporteurId", filters.apporteurId)
      }
      if (filters?.periode) {
        params.append("periode", filters.periode)
      }

      const queryString = params.toString()
      const endpoint = queryString ? `/commissions?${queryString}` : "/commissions"

      const data = await execute(() => api.get(endpoint))
      if (data) {
        setCommissions(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, filters?.organisationId, filters?.apporteurId, filters?.periode])

  useEffect(() => {
    fetchCommissions()
  }, [fetchCommissions])

  return {
    commissions,
    loading,
    error,
    refetch: fetchCommissions,
  }
}

/**
 * Hook pour récupérer les commissions avec leurs détails
 * GET /commissions/with-details
 */
export function useCommissionsWithDetails(organisationId?: string) {
  const [commissions, setCommissions] = useState<CommissionWithDetailsResponseDto[]>([])
  const { loading, error, execute } = useApi<CommissionWithDetailsResponseDto[]>()

  const fetchCommissions = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (organisationId) {
        params.append("organisationId", organisationId)
      }

      const queryString = params.toString()
      const endpoint = queryString
        ? `/commissions/with-details?${queryString}`
        : "/commissions/with-details"

      const data = await execute(() => api.get(endpoint))
      if (data) {
        setCommissions(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, organisationId])

  useEffect(() => {
    fetchCommissions()
  }, [fetchCommissions])

  // Calcul du résumé global
  const summary: CommissionSummaryDto = useMemo(() => {
    return commissions.reduce(
      (acc, commission) => ({
        totalBrut: acc.totalBrut + commission.montantBrut,
        totalReprises: acc.totalReprises + commission.montantReprises,
        totalAcomptes: acc.totalAcomptes + commission.montantAcomptes,
        totalNet: acc.totalNet + commission.montantNetAPayer,
        nombreLignes: acc.nombreLignes + 1,
        nombreSelectionnes: 0,
      }),
      {
        totalBrut: 0,
        totalReprises: 0,
        totalAcomptes: 0,
        totalNet: 0,
        nombreLignes: 0,
        nombreSelectionnes: 0,
      }
    )
  }, [commissions])

  return {
    commissions,
    summary,
    loading,
    error,
    refetch: fetchCommissions,
  }
}

/**
 * Hook pour récupérer une commission par son ID
 * GET /commissions/:id
 */
export function useCommission(commissionId: string | null) {
  const [commission, setCommission] = useState<CommissionResponseDto | null>(null)
  const { loading, error, execute } = useApi<CommissionResponseDto>()

  const fetchCommission = useCallback(async () => {
    if (!commissionId) return

    try {
      const data = await execute(() => api.get(`/commissions/${commissionId}`))
      if (data) {
        setCommission(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, commissionId])

  useEffect(() => {
    if (commissionId) {
      fetchCommission()
    }
  }, [commissionId, fetchCommission])

  return {
    commission,
    loading,
    error,
    refetch: fetchCommission,
  }
}

/**
 * Hook pour récupérer une commission avec ses détails par son ID
 * GET /commissions/:id/with-details
 */
export function useCommissionWithDetails(commissionId: string | null) {
  const [commission, setCommission] = useState<CommissionWithDetailsResponseDto | null>(null)
  const { loading, error, execute } = useApi<CommissionWithDetailsResponseDto>()

  const fetchCommission = useCallback(async () => {
    if (!commissionId) return

    try {
      const data = await execute(() => api.get(`/commissions/${commissionId}/with-details`))
      if (data) {
        setCommission(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, commissionId])

  useEffect(() => {
    if (commissionId) {
      fetchCommission()
    }
  }, [commissionId, fetchCommission])

  return {
    commission,
    loading,
    error,
    refetch: fetchCommission,
  }
}

/**
 * Hook utilitaire pour calculer le résumé d'une sélection de commissions
 */
export function useCommissionsSummary(
  commissions: CommissionWithDetailsResponseDto[],
  selectedIds: Record<string, boolean>
) {
  const globalSummary: CommissionSummaryDto = useMemo(() => {
    return commissions.reduce(
      (acc, commission) => ({
        totalBrut: acc.totalBrut + commission.montantBrut,
        totalReprises: acc.totalReprises + commission.montantReprises,
        totalAcomptes: acc.totalAcomptes + commission.montantAcomptes,
        totalNet: acc.totalNet + commission.montantNetAPayer,
        nombreLignes: acc.nombreLignes + 1,
        nombreSelectionnes: 0,
      }),
      {
        totalBrut: 0,
        totalReprises: 0,
        totalAcomptes: 0,
        totalNet: 0,
        nombreLignes: 0,
        nombreSelectionnes: 0,
      }
    )
  }, [commissions])

  const selectedSummary: CommissionSummaryDto = useMemo(() => {
    const selectedCommissions = commissions.filter((c) => selectedIds[c.id])
    return selectedCommissions.reduce(
      (acc, commission) => ({
        totalBrut: acc.totalBrut + commission.montantBrut,
        totalReprises: acc.totalReprises + commission.montantReprises,
        totalAcomptes: acc.totalAcomptes + commission.montantAcomptes,
        totalNet: acc.totalNet + commission.montantNetAPayer,
        nombreLignes: acc.nombreLignes + 1,
        nombreSelectionnes: acc.nombreSelectionnes + 1,
      }),
      {
        totalBrut: 0,
        totalReprises: 0,
        totalAcomptes: 0,
        totalNet: 0,
        nombreLignes: 0,
        nombreSelectionnes: 0,
      }
    )
  }, [commissions, selectedIds])

  const selectedCount = Object.values(selectedIds).filter(Boolean).length

  return {
    globalSummary,
    selectedSummary,
    selectedCount,
  }
}
