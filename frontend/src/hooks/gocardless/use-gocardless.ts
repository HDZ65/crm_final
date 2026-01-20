"use client"

import { useState, useCallback, useEffect } from "react"
import { gocardlessService } from "@/services/gocardless.service"
import type {
  GocardlessMandate,
  GocardlessPayment,
  GocardlessSubscription,
  SetupMandateRequest,
  CreatePaymentRequest,
  CreateSubscriptionRequest,
} from "@/types/gocardless"

interface UseGoCardlessOptions {
  clientId: string
  autoFetchMandate?: boolean
}

interface UseGoCardlessReturn {
  // État
  mandate: GocardlessMandate | null
  payments: GocardlessPayment[]
  subscriptions: GocardlessSubscription[]
  error: Error | null

  // Mandat
  setupMandate: (options?: Partial<SetupMandateRequest>) => Promise<string | null>
  fetchMandate: () => Promise<void>
  cancelMandate: () => Promise<void>
  hasMandateActive: boolean

  // Paiements
  createPayment: (request: CreatePaymentRequest) => Promise<GocardlessPayment | null>
  fetchPayments: () => Promise<void>
  cancelPayment: (paymentId: string) => Promise<void>
  retryPayment: (paymentId: string) => Promise<void>

  // Abonnements
  createSubscription: (request: CreateSubscriptionRequest) => Promise<GocardlessSubscription | null>
  fetchSubscriptions: () => Promise<void>
  cancelSubscription: (subscriptionId: string) => Promise<void>
  pauseSubscription: (subscriptionId: string) => Promise<void>
  resumeSubscription: (subscriptionId: string) => Promise<void>

  // Billing Request Flow (pour Drop-in)
  createBillingRequestFlow: () => Promise<string | null>
}

/**
 * Hook pour gérer l'intégration GoCardless
 */
export function useGoCardless({
  clientId,
  autoFetchMandate = true,
}: UseGoCardlessOptions): UseGoCardlessReturn {
  const [mandate, setMandate] = useState<GocardlessMandate | null>(null)
  const [payments, setPayments] = useState<GocardlessPayment[]>([])
  const [subscriptions, setSubscriptions] = useState<GocardlessSubscription[]>([])
  const [error, setError] = useState<Error | null>(null)

  // === MANDAT ===

  const fetchMandate = useCallback(async () => {
    if (!clientId) return
    setError(null)
    try {
      const result = await gocardlessService.getActiveMandate(clientId)
      setMandate(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur inconnue"))
    }
  }, [clientId])

  const setupMandate = useCallback(
    async (options?: Partial<SetupMandateRequest>): Promise<string | null> => {
      if (!clientId) return null
      setError(null)
      try {
        const result = await gocardlessService.setupMandate({
          clientId,
          redirectUri: options?.redirectUri || `${window.location.origin}/payment/success?clientId=${clientId}`,
          exitUri: options?.exitUri || `${window.location.origin}/payment/cancel`,
          currency: options?.currency || "EUR",
          scheme: options?.scheme || "sepa_core",
          ...options,
        })

        // Stocker le billingRequestId pour vérification ultérieure
        if (typeof window !== "undefined") {
          localStorage.setItem("gc_billing_request", result.billingRequestId)
          localStorage.setItem("gc_billing_request_flow", result.billingRequestFlowId)
        }

        return result.authorisationUrl
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Erreur lors du setup du mandat"))
        return null
      }
    },
    [clientId]
  )

  const cancelMandate = useCallback(async () => {
    if (!mandate?.id) return
    setError(null)
    try {
      await gocardlessService.cancelMandate(mandate.id)
      setMandate(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors de l'annulation du mandat"))
    }
  }, [mandate?.id])

  // === PAIEMENTS ===

  const fetchPayments = useCallback(async () => {
    if (!clientId) return
    setError(null)
    try {
      const result = await gocardlessService.getPayments(clientId)
      setPayments(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du chargement des paiements"))
    }
  }, [clientId])

  const createPayment = useCallback(
    async (request: CreatePaymentRequest): Promise<GocardlessPayment | null> => {
      if (!clientId) return null
      setError(null)
      try {
        const payment = await gocardlessService.createPayment(clientId, request)
        setPayments((prev) => [payment, ...prev])
        return payment
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Erreur lors de la création du paiement"))
        return null
      }
    },
    [clientId]
  )

  const cancelPayment = useCallback(async (paymentId: string) => {
    setError(null)
    try {
      const updated = await gocardlessService.cancelPayment(paymentId)
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? updated : p))
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors de l'annulation du paiement"))
    }
  }, [])

  const retryPayment = useCallback(async (paymentId: string) => {
    setError(null)
    try {
      const updated = await gocardlessService.retryPayment(paymentId)
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? updated : p))
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors de la relance du paiement"))
    }
  }, [])

  // === ABONNEMENTS ===

  const fetchSubscriptions = useCallback(async () => {
    if (!clientId) return
    setError(null)
    try {
      const result = await gocardlessService.getSubscriptions(clientId)
      setSubscriptions(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du chargement des abonnements"))
    }
  }, [clientId])

  const createSubscription = useCallback(
    async (request: CreateSubscriptionRequest): Promise<GocardlessSubscription | null> => {
      if (!clientId) return null
      setError(null)
      try {
        const subscription = await gocardlessService.createSubscription(clientId, request)
        setSubscriptions((prev) => [subscription, ...prev])
        return subscription
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Erreur lors de la création de l'abonnement"))
        return null
      }
    },
    [clientId]
  )

  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    setError(null)
    try {
      const updated = await gocardlessService.cancelSubscription(subscriptionId)
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === subscriptionId ? updated : s))
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors de l'annulation de l'abonnement"))
    }
  }, [])

  const pauseSubscription = useCallback(async (subscriptionId: string) => {
    setError(null)
    try {
      const updated = await gocardlessService.pauseSubscription(subscriptionId)
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === subscriptionId ? updated : s))
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors de la mise en pause"))
    }
  }, [])

  const resumeSubscription = useCallback(async (subscriptionId: string) => {
    setError(null)
    try {
      const updated = await gocardlessService.resumeSubscription(subscriptionId)
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === subscriptionId ? updated : s))
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors de la reprise"))
    }
  }, [])

  // === BILLING REQUEST FLOW (pour Drop-in) ===

  const createBillingRequestFlow = useCallback(async (): Promise<string | null> => {
    if (!clientId) return null
    setError(null)
    try {
      const result = await gocardlessService.createBillingRequestFlow({
        clientId,
        redirectUri: `${window.location.origin}/payment/success?clientId=${clientId}`,
        exitUri: `${window.location.origin}/payment/cancel`,
      })
      return result.billingRequestFlowId
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors de la création du flow"))
      return null
    }
  }, [clientId])

  // Auto-fetch du mandat au montage
  useEffect(() => {
    if (autoFetchMandate && clientId) {
      fetchMandate()
    }
  }, [autoFetchMandate, clientId, fetchMandate])

  return {
    // État
    mandate,
    payments,
    subscriptions,
    error,

    // Mandat
    setupMandate,
    fetchMandate,
    cancelMandate,
    hasMandateActive: mandate?.mandateStatus === "active",

    // Paiements
    createPayment,
    fetchPayments,
    cancelPayment,
    retryPayment,

    // Abonnements
    createSubscription,
    fetchSubscriptions,
    cancelSubscription,
    pauseSubscription,
    resumeSubscription,

    // Billing Request Flow
    createBillingRequestFlow,
  }
}
