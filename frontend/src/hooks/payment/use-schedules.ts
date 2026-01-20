"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import type {
  Schedule,
  CreateScheduleDto,
  UpdateScheduleDto,
} from "@/types/schedule"

export function useSchedules(filters?: { factureId?: string; contratId?: string }) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const { error, execute } = useApi<Schedule[]>()

  const fetchSchedules = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters?.factureId) params.append("factureId", filters.factureId)
      if (filters?.contratId) params.append("contratId", filters.contratId)

      const queryString = params.toString()
      const endpoint = queryString ? `/schedules?${queryString}` : "/schedules"

      const data = await execute(() => api.get(endpoint))
      if (data) {
        setSchedules(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, filters?.factureId, filters?.contratId])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  return {
    schedules,
    error,
    refetch: fetchSchedules,
  }
}

export function useSchedule(scheduleId: string | null) {
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const fetchSchedule = useCallback(async () => {
    if (!scheduleId) return

    setError(null)

    try {
      const data: Schedule = await api.get(`/schedules/${scheduleId}`)
      if (data) {
        setSchedule(data)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Erreur lors du chargement du schedule")
      )
    }
  }, [scheduleId])

  useEffect(() => {
    if (scheduleId) {
      fetchSchedule()
    }
  }, [scheduleId, fetchSchedule])

  return {
    schedule,
    error,
    refetch: fetchSchedule,
  }
}

export function useCreateSchedule() {
  const [error, setError] = useState<Error | null>(null)

  const createSchedule = useCallback(async (data: CreateScheduleDto) => {
    setError(null)

    try {
      const result = await api.post("/schedules", data)
      return result
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Erreur lors de la création du schedule")
      )
      throw err
    }
  }, [])

  return {
    createSchedule,
    error,
  }
}

export function useUpdateSchedule(scheduleId: string | null) {
  const [error, setError] = useState<Error | null>(null)

  const updateSchedule = useCallback(
    async (data: UpdateScheduleDto) => {
      if (!scheduleId) return

      setError(null)

      try {
        const result = await api.put(`/schedules/${scheduleId}`, data)
        return result
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Erreur lors de la mise à jour du schedule")
        )
        throw err
      }
    },
    [scheduleId]
  )

  return {
    updateSchedule,
    error,
  }
}

export function useDeleteSchedule() {
  const [error, setError] = useState<Error | null>(null)

  const deleteSchedule = useCallback(async (scheduleId: string) => {
    setError(null)

    try {
      await api.delete(`/schedules/${scheduleId}`)
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Erreur lors de la suppression du schedule")
      )
      throw err
    }
  }, [])

  return {
    deleteSchedule,
    error,
  }
}

/**
 * Hook to trigger manual payment processing
 * This processes all due schedules and retries failed ones
 */
export function useTriggerPaymentProcessing() {
  const [error, setError] = useState<Error | null>(null)

  const triggerProcessing = useCallback(async () => {
    setError(null)

    try {
      const result: { processed: number; failed: number } = await api.post("/schedules/process")
      return result
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Erreur lors du traitement des paiements")
      )
      throw err
    }
  }, [])

  return {
    triggerProcessing,
    error,
  }
}
