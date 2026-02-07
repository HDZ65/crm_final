import {
  setupGoCardlessMandate,
  getGoCardlessMandate,
  cancelGoCardlessMandate,
  createGoCardlessPayment,
  createGoCardlessSubscription,
  cancelGoCardlessSubscription,
} from "@/actions/payments"
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
 * Service pour interagir avec l'API GoCardless via gRPC server actions
 * Thin wrapper around server actions for backward compatibility
 */
export const gocardlessService = {
  // === MANDATES ===

  /**
   * Crée un Billing Request et retourne l'URL d'autorisation
   * Le client sera redirigé vers GoCardless pour configurer son mandat
   */
  async setupMandate(request: SetupMandateRequest): Promise<SetupMandateResponse> {
    const result = await setupGoCardlessMandate({
      clientId: request.clientId,
      societeId: "",
      scheme: request.scheme || "sepa_core",
      successRedirectUrl: request.redirectUri,
    })

    if (result.error) {
      throw new Error(result.error)
    }

    if (!result.data) {
      throw new Error("Erreur lors du setup du mandat")
    }

    return {
      billingRequestId: result.data.id,
      billingRequestFlowId: result.data.id,
      authorisationUrl: result.data.redirectUrl || "",
    }
  },

  /**
   * Récupère le mandat actif d'un client
   */
  async getActiveMandate(clientId: string): Promise<GocardlessMandate | null> {
    const result = await getGoCardlessMandate({
      clientId: clientId,
      societeId: "",
    })

    if (result.error || !result.data) {
      return null
    }

    // Map gRPC response to GocardlessMandate type
    return {
      id: result.data.id,
      gocardlessMandateId: result.data.mandateId,
      gocardlessCustomerId: result.data.clientId,
      clientId: result.data.clientId,
      mandateReference: result.data.mandateId,
      mandateStatus: result.data.status as any,
      scheme: result.data.scheme,
      bankAccountEndingIn: result.data.accountNumberEnding,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },

  /**
   * Récupère tous les mandats d'un client
   */
  async getMandates(clientId: string): Promise<GocardlessMandate[]> {
    const result = await getGoCardlessMandate({
      clientId: clientId,
      societeId: "",
    })

    if (result.error || !result.data) {
      return []
    }

    return [
      {
        id: result.data.id,
        gocardlessMandateId: result.data.mandateId,
        gocardlessCustomerId: result.data.clientId,
        clientId: result.data.clientId,
        mandateReference: result.data.mandateId,
        mandateStatus: result.data.status as any,
        scheme: result.data.scheme,
        bankAccountEndingIn: result.data.accountNumberEnding,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]
  },

  /**
   * Annule un mandat
   */
  async cancelMandate(mandateId: string): Promise<GocardlessMandate> {
    const result = await cancelGoCardlessMandate({
      clientId: "",
      societeId: "",
    })

    if (result.error) {
      throw new Error(result.error)
    }

    if (!result.data) {
      throw new Error("Erreur lors de l'annulation du mandat")
    }

    return {
      id: result.data.id,
      gocardlessMandateId: result.data.mandateId,
      gocardlessCustomerId: result.data.clientId,
      clientId: result.data.clientId,
      mandateReference: result.data.mandateId,
      mandateStatus: result.data.status as any,
      scheme: result.data.scheme,
      bankAccountEndingIn: result.data.accountNumberEnding,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },

  // === PAYMENTS ===

  /**
   * Crée un paiement ponctuel pour un client
   * Requiert un mandat actif
   */
  async createPayment(clientId: string, request: CreatePaymentRequest): Promise<GocardlessPayment> {
    const result = await createGoCardlessPayment({
      clientId: clientId,
      societeId: "",
      amount: Math.round((request.amount || 0) * 100),
      currency: request.currency || "EUR",
      description: request.description || "",
      chargeDate: request.chargeDate,
      metadata: {},
    })

    if (result.error) {
      throw new Error(result.error)
    }

    if (!result.data) {
      throw new Error("Erreur lors de la création du paiement")
    }

    return {
      id: result.data.id,
      gocardlessPaymentId: result.data.paymentId,
      mandateId: "",
      amount: result.data.amount / 100,
      currency: result.data.currency,
      status: result.data.status as any,
      chargeDate: result.data.chargeDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },

  /**
   * Récupère les paiements d'un client
   */
  async getPayments(clientId: string): Promise<GocardlessPayment[]> {
    // Note: gRPC doesn't have a list payments endpoint, returning empty array
    // This would need to be implemented in the backend if needed
    return []
  },

  /**
   * Récupère un paiement par son ID
   */
  async getPayment(paymentId: string): Promise<GocardlessPayment> {
    throw new Error("getPayment not implemented in gRPC client")
  },

  /**
   * Annule un paiement (si possible)
   */
  async cancelPayment(paymentId: string): Promise<GocardlessPayment> {
    throw new Error("cancelPayment not implemented in gRPC client")
  },

  /**
   * Relance un paiement échoué
   */
  async retryPayment(paymentId: string): Promise<GocardlessPayment> {
    throw new Error("retryPayment not implemented in gRPC client")
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
    const result = await createGoCardlessSubscription({
      clientId: clientId,
      societeId: "",
      amount: Math.round((request.amount || 0) * 100),
      currency: request.currency || "EUR",
      intervalUnit: request.intervalUnit || "monthly",
      interval: request.interval || 1,
      name: request.name,
      startDate: request.startDate,
      metadata: {},
    })

    if (result.error) {
      throw new Error(result.error)
    }

    if (!result.data) {
      throw new Error("Erreur lors de la création de l'abonnement")
    }

    return {
      id: result.data.id,
      gocardlessSubscriptionId: result.data.subscriptionId,
      mandateId: "",
      amount: result.data.amount / 100,
      currency: result.data.currency,
      status: result.data.status as any,
      intervalUnit: result.data.intervalUnit as any,
      interval: result.data.interval,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },

  /**
   * Récupère les abonnements d'un client
   */
  async getSubscriptions(clientId: string): Promise<GocardlessSubscription[]> {
    // Note: gRPC doesn't have a list subscriptions endpoint, returning empty array
    // This would need to be implemented in the backend if needed
    return []
  },

  /**
   * Récupère un abonnement par son ID
   */
  async getSubscription(subscriptionId: string): Promise<GocardlessSubscription> {
    throw new Error("getSubscription not implemented in gRPC client")
  },

  /**
   * Annule un abonnement
   */
  async cancelSubscription(subscriptionId: string): Promise<GocardlessSubscription> {
    const result = await cancelGoCardlessSubscription({
      subscriptionId: subscriptionId,
      societeId: "",
    })

    if (result.error) {
      throw new Error(result.error)
    }

    if (!result.data) {
      throw new Error("Erreur lors de l'annulation de l'abonnement")
    }

    return {
      id: result.data.id,
      gocardlessSubscriptionId: result.data.subscriptionId,
      mandateId: "",
      amount: result.data.amount / 100,
      currency: result.data.currency,
      status: result.data.status as any,
      intervalUnit: result.data.intervalUnit as any,
      interval: result.data.interval,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },

  /**
   * Met en pause un abonnement
   */
  async pauseSubscription(subscriptionId: string): Promise<GocardlessSubscription> {
    throw new Error("pauseSubscription not implemented in gRPC client")
  },

  /**
   * Reprend un abonnement en pause
   */
  async resumeSubscription(subscriptionId: string): Promise<GocardlessSubscription> {
    throw new Error("resumeSubscription not implemented in gRPC client")
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
    const result = await setupGoCardlessMandate({
      clientId: request.clientId,
      societeId: "",
      scheme: "sepa_core",
      successRedirectUrl: request.redirectUri,
    })

    if (result.error) {
      throw new Error(result.error)
    }

    if (!result.data) {
      throw new Error("Erreur lors de la création du flow")
    }

    return {
      billingRequestFlowId: result.data.id,
    }
  },
}
