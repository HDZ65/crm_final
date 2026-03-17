"use client"

import { useCallback, useEffect, useState } from "react"
import {
  listAlerts,
  acknowledgeAlert,
  listExportJobs,
  createExportJob,
  listRoutingRules,
  fetchPaymentStats,
} from "@/actions/payments"
import type { PSPAccountsSummaryResponse } from "@proto/payments/payment"

/**
 * Hook to fetch and manage payment alerts
 */
export function usePaymentAlerts(params?: { societeId?: string; acknowledged?: boolean }) {
  const [alerts, setAlerts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await listAlerts(params || {})
      if (result.error) {
        setError(new Error(result.error))
      } else if (result.data) {
        setAlerts(result.data)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Erreur lors du chargement des alertes")
      )
    } finally {
      setIsLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const acknowledge = useCallback(
    async (alertId: string) => {
      try {
        setError(null)
        const result = await acknowledgeAlert(alertId)
        if (result.error) {
          setError(new Error(result.error))
          throw new Error(result.error)
        }
        // Refresh alerts after acknowledging
        await fetchAlerts()
        return result.data
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Erreur lors de l'acknowledgement")
        setError(error)
        throw error
      }
    },
    [fetchAlerts]
  )

  return {
    alerts,
    isLoading,
    error,
    refetch: fetchAlerts,
    acknowledge,
  }
}

/**
 * Hook to fetch and manage export jobs
 */
export function useExportJobs(params?: { societeId?: string }) {
  const [jobs, setJobs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await listExportJobs(params || {})
      if (result.error) {
        setError(new Error(result.error))
      } else if (result.data) {
        setJobs(result.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du chargement des exports"))
    } finally {
      setIsLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const createJob = useCallback(
    async (jobParams: { societeId: string; format?: string; filters?: Record<string, any> }) => {
      try {
        setError(null)
        const result = await createExportJob(jobParams)
        if (result.error) {
          setError(new Error(result.error))
          throw new Error(result.error)
        }
        // Refresh jobs after creating
        await fetchJobs()
        return result.data
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Erreur lors de la création de l'export")
        setError(error)
        throw error
      }
    },
    [fetchJobs]
  )

  return {
    jobs,
    isLoading,
    error,
    refetch: fetchJobs,
    createJob,
  }
}

/**
 * Hook to fetch and manage routing rules
 */
export function useRoutingRules(params?: { societeId?: string }) {
  const [rules, setRules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchRules = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await listRoutingRules(params || {})
      if (result.error) {
        setError(new Error(result.error))
      } else if (result.data) {
        setRules(result.data)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Erreur lors du chargement des règles de routage")
      )
    } finally {
      setIsLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  return {
    rules,
    isLoading,
    error,
    refetch: fetchRules,
  }
}

/**
 * Hook to fetch payment statistics (PSP accounts summary)
 */
export function usePaymentStats(societeId: string) {
  const [stats, setStats] = useState<PSPAccountsSummaryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchStats = useCallback(async () => {
    if (!societeId) return

    try {
      setIsLoading(true)
      setError(null)
      const result = await fetchPaymentStats(societeId)
      if (result.error) {
        setError(new Error(result.error))
      } else if (result.data) {
        setStats(result.data)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Erreur lors du chargement des statistiques")
      )
    } finally {
      setIsLoading(false)
    }
  }, [societeId])

  useEffect(() => {
    if (societeId) {
      fetchStats()
    }
  }, [societeId, fetchStats])

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  }
}

/**
 * Composite hook for all payment-related data
 */
export function usePayments(societeId: string) {
  const alerts = usePaymentAlerts({ societeId })
  const exportJobs = useExportJobs({ societeId })
  const routingRules = useRoutingRules({ societeId })
  const paymentStats = usePaymentStats(societeId)

  return {
    alerts,
    exportJobs,
    routingRules,
    paymentStats,
  }
}
