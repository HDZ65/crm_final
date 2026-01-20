"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import type {
  BaremeCommissionResponseDto,
  BaremeFiltersDto,
  BaremeApplicableFiltersDto,
} from "@/types/commission"

/**
 * Hook pour récupérer la liste des barèmes de commission
 * GET /baremes-commission
 */
export function useBaremesCommission(filters?: BaremeFiltersDto) {
  const [baremes, setBaremes] = useState<BaremeCommissionResponseDto[]>([])
  const { loading, error, execute } = useApi<BaremeCommissionResponseDto[]>()

  const fetchBaremes = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters?.organisationId) {
        params.append("organisationId", filters.organisationId)
      }
      if (filters?.actifs !== undefined) {
        params.append("actifs", String(filters.actifs))
      }
      if (filters?.typeProduit) {
        params.append("typeProduit", filters.typeProduit)
      }

      const queryString = params.toString()
      const endpoint = queryString ? `/baremes-commission?${queryString}` : "/baremes-commission"

      const data = await execute(() => api.get(endpoint))
      if (data) {
        setBaremes(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, filters?.organisationId, filters?.actifs, filters?.typeProduit])

  useEffect(() => {
    fetchBaremes()
  }, [fetchBaremes])

  return {
    baremes,
    loading,
    error,
    refetch: fetchBaremes,
  }
}

/**
 * Hook pour récupérer le barème applicable
 * GET /baremes-commission/applicable
 */
export function useBaremeApplicable(filters: BaremeApplicableFiltersDto | null) {
  const [bareme, setBareme] = useState<BaremeCommissionResponseDto | null>(null)
  const { loading, error, execute } = useApi<BaremeCommissionResponseDto | null>()

  const fetchBareme = useCallback(async () => {
    if (!filters?.organisationId) return

    try {
      const params = new URLSearchParams()
      params.append("organisationId", filters.organisationId)
      if (filters.typeProduit) {
        params.append("typeProduit", filters.typeProduit)
      }
      if (filters.profilRemuneration) {
        params.append("profilRemuneration", filters.profilRemuneration)
      }

      const data = await execute(() => api.get(`/baremes-commission/applicable?${params.toString()}`))
      setBareme(data)
    } catch {
      // Error handled by useApi
    }
  }, [execute, filters?.organisationId, filters?.typeProduit, filters?.profilRemuneration])

  useEffect(() => {
    if (filters?.organisationId) {
      fetchBareme()
    }
  }, [filters?.organisationId, fetchBareme])

  return {
    bareme,
    loading,
    error,
    refetch: fetchBareme,
  }
}

/**
 * Hook pour récupérer un barème par son code
 * GET /baremes-commission/code/:code
 */
export function useBaremeByCode(code: string | null) {
  const [bareme, setBareme] = useState<BaremeCommissionResponseDto | null>(null)
  const { loading, error, execute } = useApi<BaremeCommissionResponseDto | null>()

  const fetchBareme = useCallback(async () => {
    if (!code) return

    try {
      const data = await execute(() => api.get(`/baremes-commission/code/${code}`))
      setBareme(data)
    } catch {
      // Error handled by useApi
    }
  }, [execute, code])

  useEffect(() => {
    if (code) {
      fetchBareme()
    }
  }, [code, fetchBareme])

  return {
    bareme,
    loading,
    error,
    refetch: fetchBareme,
  }
}

/**
 * Hook pour récupérer un barème par son ID
 * GET /baremes-commission/:id
 */
export function useBaremeCommission(baremeId: string | null) {
  const [bareme, setBareme] = useState<BaremeCommissionResponseDto | null>(null)
  const { loading, error, execute } = useApi<BaremeCommissionResponseDto>()

  const fetchBareme = useCallback(async () => {
    if (!baremeId) return

    try {
      const data = await execute(() => api.get(`/baremes-commission/${baremeId}`))
      if (data) {
        setBareme(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, baremeId])

  useEffect(() => {
    if (baremeId) {
      fetchBareme()
    }
  }, [baremeId, fetchBareme])

  return {
    bareme,
    loading,
    error,
    refetch: fetchBareme,
  }
}
