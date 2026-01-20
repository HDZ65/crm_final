"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import type {
  PaymentIntent,
  CreatePaymentIntentDto,
  UpdatePaymentIntentDto,
} from "@/types/payment-intent"

export function usePaymentIntents(filters?: { scheduleId?: string }) {
  const [paymentIntents, setPaymentIntents] = useState<PaymentIntent[]>([])
  const { error, execute } = useApi<PaymentIntent[]>()

  const fetchPaymentIntents = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters?.scheduleId) params.append("scheduleId", filters.scheduleId)

      const queryString = params.toString()
      const endpoint = queryString
        ? `/payment-intents?${queryString}`
        : "/payment-intents"

      const data = await execute(() => api.get(endpoint))
      if (data) {
        setPaymentIntents(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, filters?.scheduleId])

  useEffect(() => {
    fetchPaymentIntents()
  }, [fetchPaymentIntents])

  return {
    paymentIntents,
    error,
    refetch: fetchPaymentIntents,
  }
}

export function usePaymentIntent(paymentIntentId: string | null) {
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const fetchPaymentIntent = useCallback(async () => {
    if (!paymentIntentId) return

    setError(null)

    try {
      const data: PaymentIntent = await api.get(
        `/payment-intents/${paymentIntentId}`
      )
      if (data) {
        setPaymentIntent(data)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Erreur lors du chargement du payment intent")
      )
    }
  }, [paymentIntentId])

  useEffect(() => {
    if (paymentIntentId) {
      fetchPaymentIntent()
    }
  }, [paymentIntentId, fetchPaymentIntent])

  return {
    paymentIntent,
    error,
    refetch: fetchPaymentIntent,
  }
}

export function useCreatePaymentIntent() {
  const [error, setError] = useState<Error | null>(null)

  const createPaymentIntent = useCallback(
    async (data: CreatePaymentIntentDto) => {
      setError(null)

      try {
        const result = await api.post("/payment-intents", data)
        return result
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Erreur lors de la création du payment intent")
        )
        throw err
      }
    },
    []
  )

  return {
    createPaymentIntent,
    error,
  }
}

export function useUpdatePaymentIntent(paymentIntentId: string | null) {
  const [error, setError] = useState<Error | null>(null)

  const updatePaymentIntent = useCallback(
    async (data: UpdatePaymentIntentDto) => {
      if (!paymentIntentId) return

      setError(null)

      try {
        const result = await api.put(
          `/payment-intents/${paymentIntentId}`,
          data
        )
        return result
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Erreur lors de la mise à jour du payment intent")
        )
        throw err
      }
    },
    [paymentIntentId]
  )

  return {
    updatePaymentIntent,
    error,
  }
}

export function useDeletePaymentIntent() {
  const [error, setError] = useState<Error | null>(null)

  const deletePaymentIntent = useCallback(async (paymentIntentId: string) => {
    setError(null)

    try {
      await api.delete(`/payment-intents/${paymentIntentId}`)
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Erreur lors de la suppression du payment intent")
      )
      throw err
    }
  }, [])

  return {
    deletePaymentIntent,
    error,
  }
}
