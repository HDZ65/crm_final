"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getPaymentEvents,
  getPaymentEvent,
  createPaymentEvent,
  updatePaymentEvent,
  deletePaymentEvent,
} from "@/actions/payments"
import type {
  PaymentEventResponse,
  CreatePaymentEventRequest,
} from "@proto/payments/payment"

interface UpdatePaymentEventDto {
  processed?: boolean;
  processedAt?: string;
  errorMessage?: string;
}

export function usePaymentEvents(filters?: {
  paymentIntentId?: string
  unprocessed?: boolean
}) {
  const [paymentEvents, setPaymentEvents] = useState<PaymentEventResponse[]>([])
  const [error, setError] = useState<Error | null>(null)

  const fetchPaymentEvents = useCallback(async () => {
    try {
      setError(null)
      const result = await getPaymentEvents(filters || {})
      if (result.error) {
        setError(new Error(result.error))
      } else if (result.data) {
        setPaymentEvents(result.data)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Erreur lors du chargement des payment events")
      )
    }
  }, [filters])

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
  const [paymentEvent, setPaymentEvent] = useState<PaymentEventResponse | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const fetchPaymentEvent = useCallback(async () => {
    if (!paymentEventId) return

    setError(null)

    try {
      const result = await getPaymentEvent(paymentEventId)
      if (result.error) {
        setError(new Error(result.error))
      } else if (result.data) {
        setPaymentEvent(result.data)
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

  const createPaymentEventFn = useCallback(
    async (data: CreatePaymentEventRequest) => {
      setError(null)

      try {
        const result = await createPaymentEvent(data)
        if (result.error) {
          setError(new Error(result.error))
          throw new Error(result.error)
        }
        return result.data
      } catch (err) {
        const error = err instanceof Error
          ? err
          : new Error("Erreur lors de la création du payment event")
        setError(error)
        throw error
      }
    },
    []
  )

  return {
    createPaymentEvent: createPaymentEventFn,
    error,
  }
}

export function useUpdatePaymentEvent(paymentEventId: string | null) {
  const [error, setError] = useState<Error | null>(null)

  const updatePaymentEventFn = useCallback(
    async (data: UpdatePaymentEventDto) => {
      if (!paymentEventId) return

      setError(null)

      try {
        const result = await updatePaymentEvent(paymentEventId, data)
        if (result.error) {
          setError(new Error(result.error))
          throw new Error(result.error)
        }
        return result.data
      } catch (err) {
        const error = err instanceof Error
          ? err
          : new Error("Erreur lors de la mise à jour du payment event")
        setError(error)
        throw error
      }
    },
    [paymentEventId]
  )

  return {
    updatePaymentEvent: updatePaymentEventFn,
    error,
  }
}

export function useDeletePaymentEvent() {
  const [error, setError] = useState<Error | null>(null)

  const deletePaymentEventFn = useCallback(async (paymentEventId: string) => {
    setError(null)

    try {
      const result = await deletePaymentEvent(paymentEventId)
      if (result.error) {
        setError(new Error(result.error))
        throw new Error(result.error)
      }
    } catch (err) {
      const error = err instanceof Error
        ? err
        : new Error("Erreur lors de la suppression du payment event")
      setError(error)
      throw error
    }
  }, [])

  return {
    deletePaymentEvent: deletePaymentEventFn,
    error,
  }
}
