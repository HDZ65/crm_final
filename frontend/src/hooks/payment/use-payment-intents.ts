"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getPaymentIntents,
  getPaymentIntent,
  createPaymentIntent as createPaymentIntentAction,
  updatePaymentIntent as updatePaymentIntentAction,
  deletePaymentIntent as deletePaymentIntentAction,
} from "@/actions/payments"
import type {
  PaymentIntentResponse,
  CreatePaymentIntentRequest,
  UpdatePaymentIntentRequest,
} from "@proto/payments/payment"

export function usePaymentIntents(filters?: { scheduleId?: string }) {
  const [paymentIntents, setPaymentIntents] = useState<PaymentIntentResponse[]>([])
  const [error, setError] = useState<Error | null>(null)

  const fetchPaymentIntents = useCallback(async () => {
    try {
      setError(null)
      const result = await getPaymentIntents(filters || {})
      if (result.error) {
        setError(new Error(result.error))
      } else if (result.data) {
        setPaymentIntents(result.data)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Erreur lors du chargement des payment intents")
      )
    }
  }, [filters])

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
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResponse | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const fetchPaymentIntent = useCallback(async () => {
    if (!paymentIntentId) return

    setError(null)

    try {
      const result = await getPaymentIntent(paymentIntentId)
      if (result.error) {
        setError(new Error(result.error))
      } else if (result.data) {
        setPaymentIntent(result.data)
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
    async (data: CreatePaymentIntentRequest) => {
      setError(null)

      try {
        const result = await createPaymentIntentAction(data)
        if (result.error) {
          setError(new Error(result.error))
          throw new Error(result.error)
        }
        return result.data
      } catch (err) {
        const error = err instanceof Error
          ? err
          : new Error("Erreur lors de la création du payment intent")
        setError(error)
        throw error
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
    async (data: UpdatePaymentIntentRequest) => {
      if (!paymentIntentId) return

      setError(null)

      try {
        const result = await updatePaymentIntentAction({
          ...data,
          id: paymentIntentId,
        })
        if (result.error) {
          setError(new Error(result.error))
          throw new Error(result.error)
        }
        return result.data
      } catch (err) {
        const error = err instanceof Error
          ? err
          : new Error("Erreur lors de la mise à jour du payment intent")
        setError(error)
        throw error
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
      const result = await deletePaymentIntentAction(paymentIntentId)
      if (result.error) {
        setError(new Error(result.error))
        throw new Error(result.error)
      }
    } catch (err) {
      const error = err instanceof Error
        ? err
        : new Error("Erreur lors de la suppression du payment intent")
      setError(error)
      throw error
    }
  }, [])

  return {
    deletePaymentIntent,
    error,
  }
}
