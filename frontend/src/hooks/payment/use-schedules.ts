"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  triggerPaymentProcessing,
} from "@/actions/payments"
import type {
  ScheduleResponse,
  CreateScheduleRequest,
  UpdateScheduleRequest,
} from "@proto/payments/payment"

export function useSchedules(filters?: { factureId?: string; contratId?: string }) {
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([])
  const [error, setError] = useState<Error | null>(null)

  const fetchSchedules = useCallback(async () => {
    try {
      setError(null)
      const result = await getSchedules(filters || {})
      if (result.error) {
        setError(new Error(result.error))
      } else if (result.data) {
        setSchedules(result.data)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Erreur lors du chargement des schedules")
      )
    }
  }, [filters])

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
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const fetchSchedule = useCallback(async () => {
    if (!scheduleId) return

    setError(null)

    try {
      const result = await getSchedule(scheduleId)
      if (result.error) {
        setError(new Error(result.error))
      } else if (result.data) {
        setSchedule(result.data)
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

  const createScheduleFn = useCallback(async (data: CreateScheduleRequest) => {
    setError(null)

    try {
      const result = await createSchedule(data)
      if (result.error) {
        setError(new Error(result.error))
        throw new Error(result.error)
      }
      return result.data
    } catch (err) {
      const error = err instanceof Error
        ? err
        : new Error("Erreur lors de la création du schedule")
      setError(error)
      throw error
    }
  }, [])

  return {
    createSchedule: createScheduleFn,
    error,
  }
}

export function useUpdateSchedule(scheduleId: string | null) {
  const [error, setError] = useState<Error | null>(null)

  const updateScheduleFn = useCallback(
    async (data: UpdateScheduleRequest) => {
      if (!scheduleId) return

      setError(null)

      try {
        const result = await updateSchedule({
          ...data,
          id: scheduleId,
        })
        if (result.error) {
          setError(new Error(result.error))
          throw new Error(result.error)
        }
        return result.data
      } catch (err) {
        const error = err instanceof Error
          ? err
          : new Error("Erreur lors de la mise à jour du schedule")
        setError(error)
        throw error
      }
    },
    [scheduleId]
  )

  return {
    updateSchedule: updateScheduleFn,
    error,
  }
}

export function useDeleteSchedule() {
  const [error, setError] = useState<Error | null>(null)

  const deleteScheduleFn = useCallback(async (scheduleId: string) => {
    setError(null)

    try {
      const result = await deleteSchedule(scheduleId)
      if (result.error) {
        setError(new Error(result.error))
        throw new Error(result.error)
      }
    } catch (err) {
      const error = err instanceof Error
        ? err
        : new Error("Erreur lors de la suppression du schedule")
      setError(error)
      throw error
    }
  }, [])

  return {
    deleteSchedule: deleteScheduleFn,
    error,
  }
}

/**
 * Hook to trigger manual payment processing
 * This processes all due schedules and retries failed ones
 */
export function useTriggerPaymentProcessing() {
  const [error, setError] = useState<Error | null>(null)

  const triggerProcessingFn = useCallback(async () => {
    setError(null)

    try {
      const result = await triggerPaymentProcessing()
      if (result.error) {
        setError(new Error(result.error))
        throw new Error(result.error)
      }
      return result.data
    } catch (err) {
      const error = err instanceof Error
        ? err
        : new Error("Erreur lors du traitement des paiements")
      setError(error)
      throw error
    }
  }, [])

  return {
    triggerProcessing: triggerProcessingFn,
    error,
  }
}
