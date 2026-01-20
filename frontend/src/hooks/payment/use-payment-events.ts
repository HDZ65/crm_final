"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import type {
  PaymentEvent,
  CreatePaymentEventDto,
  UpdatePaymentEventDto,
} from "@/types/payment-event"

export function usePaymentEvents(filters?: {
  paymentIntentId?: string
  unprocessed?: boolean
}) {
  const [paymentEvents, setPaymentEvents] = useState<PaymentEvent[]>([])
  const { error, execute } = useApi<PaymentEvent[]>()

  const fetchPaymentEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters?.paymentIntentId)
        params.append("paymentIntentId", filters.paymentIntentId)
      if (filters?.unprocessed) params.append("unprocessed", "true")

      const queryString = params.toString()
      const endpoint = queryString
        ? `/payment-events?${queryString}`
        : "/payment-events"

      const data = await execute(() => api.get(endpoint))
      if (data) {
        setPaymentEvents(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, filters?.paymentIntentId, filters?.unprocessed])

  useEffect(() => {
    fetchPaymentEvents()
  }, [fetchPaymentEvents])

  return {
    paymentEvents,
    error,
    refetch: fetchPaymentEvents,
  }
}

export function usePaymentEvent(paymentEventId: string | null) {
  const [paymentEvent, setPaymentEvent] = useState<PaymentEvent | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const fetchPaymentEvent = useCallback(async () => {
    if (!paymentEventId) return

    setError(null)

    try {
      const data: PaymentEvent = await api.get(
        `/payment-events/${paymentEventId}`
      )
      if (data) {
        setPaymentEvent(data)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Erreur lors du chargement du payment event")
      )
    }
  }, [paymentEventId])

  useEffect(() => {
    if (paymentEventId) {
      fetchPaymentEvent()
    }
  }, [paymentEventId, fetchPaymentEvent])

  return {
    paymentEvent,
    error,
    refetch: fetchPaymentEvent,
  }
}

export function useCreatePaymentEvent() {
  const [error, setError] = useState<Error | null>(null)

  const createPaymentEvent = useCallback(
    async (data: CreatePaymentEventDto) => {
      setError(null)

      try {
        const result = await api.post("/payment-events", data)
        return result
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Erreur lors de la création du payment event")
        )
        throw err
      }
    },
    []
  )

  return {
    createPaymentEvent,
    error,
  }
}

export function useUpdatePaymentEvent(paymentEventId: string | null) {
  const [error, setError] = useState<Error | null>(null)

  const updatePaymentEvent = useCallback(
    async (data: UpdatePaymentEventDto) => {
      if (!paymentEventId) return

      setError(null)

      try {
        const result = await api.put(`/payment-events/${paymentEventId}`, data)
        return result
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Erreur lors de la mise à jour du payment event")
        )
        throw err
      }
    },
    [paymentEventId]
  )

  return {
    updatePaymentEvent,
    error,
  }
}

export function useDeletePaymentEvent() {
  const [error, setError] = useState<Error | null>(null)

  const deletePaymentEvent = useCallback(async (paymentEventId: string) => {
    setError(null)

    try {
      await api.delete(`/payment-events/${paymentEventId}`)
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Erreur lors de la suppression du payment event")
      )
      throw err
    }
  }, [])

  return {
    deletePaymentEvent,
    error,
  }
}
