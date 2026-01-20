import { api } from "@/lib/api"
import type {
  SetupMandateRequest,
  SetupMandateResponse,
  GocardlessMandate,
  GocardlessPayment,
  GocardlessSubscription,
  CreatePaymentRequest,
  CreateSubscriptionRequest,
} from "@/types/gocardless"

/**
 * Service pour interagir avec l'API GoCardless via le backend
 */
export const gocardlessService = {
  // === MANDATES ===

  /**
   * Crée un Billing Request et retourne l'URL d'autorisation
   * Le client sera redirigé vers GoCardless pour configurer son mandat
   */
  async setupMandate(request: SetupMandateRequest): Promise<SetupMandateResponse> {
    return api.post<SetupMandateResponse>("/gocardless/setup-mandate", request)
  },

  /**
   * Récupère le mandat actif d'un client
   */
  async getActiveMandate(clientId: string): Promise<GocardlessMandate | null> {
    try {
      return await api.get<GocardlessMandate>(`/gocardless/mandates/client/${clientId}/active`)
    } catch {
      return null
    }
  },

  /**
   * Récupère tous les mandats d'un client
   */
  async getMandates(clientId: string): Promise<GocardlessMandate[]> {
    return api.get<GocardlessMandate[]>(`/gocardless/mandates?clientId=${clientId}`)
  },

  /**
   * Annule un mandat
   */
  async cancelMandate(mandateId: string): Promise<GocardlessMandate> {
    return api.post<GocardlessMandate>(`/gocardless/mandates/${mandateId}/cancel`)
  },

  // === PAYMENTS ===

  /**
   * Crée un paiement ponctuel pour un client
   * Requiert un mandat actif
   */
  async createPayment(clientId: string, request: CreatePaymentRequest): Promise<GocardlessPayment> {
    return api.post<GocardlessPayment>(`/gocardless/payments/client/${clientId}`, request)
  },

  /**
   * Récupère les paiements d'un client
   */
  async getPayments(clientId: string): Promise<GocardlessPayment[]> {
    return api.get<GocardlessPayment[]>(`/gocardless/payments?clientId=${clientId}`)
  },

  /**
   * Récupère un paiement par son ID
   */
  async getPayment(paymentId: string): Promise<GocardlessPayment> {
    return api.get<GocardlessPayment>(`/gocardless/payments/${paymentId}`)
  },

  /**
   * Annule un paiement (si possible)
   */
  async cancelPayment(paymentId: string): Promise<GocardlessPayment> {
    return api.post<GocardlessPayment>(`/gocardless/payments/${paymentId}/cancel`)
  },

  /**
   * Relance un paiement échoué
   */
  async retryPayment(paymentId: string): Promise<GocardlessPayment> {
    return api.post<GocardlessPayment>(`/gocardless/payments/${paymentId}/retry`)
  },

  // === SUBSCRIPTIONS ===

  /**
   * Crée un abonnement récurrent pour un client
   * Requiert un mandat actif
   */
  async createSubscription(
    clientId: string,
    request: CreateSubscriptionRequest
  ): Promise<GocardlessSubscription> {
    return api.post<GocardlessSubscription>(`/gocardless/subscriptions/client/${clientId}`, request)
  },

  /**
   * Récupère les abonnements d'un client
   */
  async getSubscriptions(clientId: string): Promise<GocardlessSubscription[]> {
    return api.get<GocardlessSubscription[]>(`/gocardless/subscriptions?clientId=${clientId}`)
  },

  /**
   * Récupère un abonnement par son ID
   */
  async getSubscription(subscriptionId: string): Promise<GocardlessSubscription> {
    return api.get<GocardlessSubscription>(`/gocardless/subscriptions/${subscriptionId}`)
  },

  /**
   * Annule un abonnement
   */
  async cancelSubscription(subscriptionId: string): Promise<GocardlessSubscription> {
    return api.post<GocardlessSubscription>(`/gocardless/subscriptions/${subscriptionId}/cancel`)
  },

  /**
   * Met en pause un abonnement
   */
  async pauseSubscription(subscriptionId: string): Promise<GocardlessSubscription> {
    return api.post<GocardlessSubscription>(`/gocardless/subscriptions/${subscriptionId}/pause`)
  },

  /**
   * Reprend un abonnement en pause
   */
  async resumeSubscription(subscriptionId: string): Promise<GocardlessSubscription> {
    return api.post<GocardlessSubscription>(`/gocardless/subscriptions/${subscriptionId}/resume`)
  },

  // === BILLING REQUEST FLOW ===

  /**
   * Crée un Billing Request Flow pour le Drop-in
   * Retourne le billingRequestFlowId nécessaire pour initialiser le Drop-in
   */
  async createBillingRequestFlow(request: {
    clientId: string
    redirectUri: string
    exitUri: string
  }): Promise<{ billingRequestFlowId: string }> {
    return api.post<{ billingRequestFlowId: string }>("/gocardless/billing-request-flow", request)
  },
}
